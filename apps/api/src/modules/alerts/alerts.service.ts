import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { Alert, AlertAudience, GroupRole, PushSubscription } from '@prisma/client';
import webpush from 'web-push';
import { CreateAlertDto } from './dto/create-alert.dto';

interface AlertWithPublisher extends Alert {
  publishedBy: {
    id: string;
    fullName: string;
  };
}

interface PaginatedAlerts {
  data: AlertWithPublisher[];
  meta: { total: number; page: number; limit: number };
}

interface PushPayload {
  type: string;
  title: string;
  body: string;
  url: string;
}

const PUSH_CONCURRENCY = 20;

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private vapidInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private ensureVapid(): void {
    if (this.vapidInitialized) return;

    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT');

    if (!publicKey || !privateKey || !subject) {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidInitialized = true;
  }

  async createAlert(
    organizationId: string,
    publishedById: string,
    dto: CreateAlertDto,
  ): Promise<AlertWithPublisher> {
    const audience = dto.audience ?? AlertAudience.ALL_USERS;

    const alert = await this.prisma.alert.create({
      data: {
        organizationId,
        publishedById,
        title: dto.title,
        body: dto.body,
        audience,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        publishedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Push notification fan-out is non-critical — never fail the request
    try {
      const subscriptions = await this.resolveSubscriptions(organizationId, audience);

      await this.prisma.alert.update({
        where: { id: alert.id },
        data: { recipientCount: subscriptions.length },
      });

      if (subscriptions.length > 0) {
        this.sendPushNotificationsInBackground(alert.id, subscriptions, {
          type: 'alert',
          title: dto.title,
          body: dto.body,
          url: '/manager',
        });
      }
    } catch (err) {
      this.logger.warn(`Push fan-out failed for alert ${alert.id}, alert was still created`, (err as Error).message);
    }

    return alert;
  }

  async getAdminAlerts(
    organizationId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedAlerts> {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [alerts, total] = await Promise.all([
      this.prisma.alert.findMany({
        where: { organizationId },
        skip,
        take: safeLimit,
        orderBy: { publishedAt: 'desc' },
        include: {
          publishedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      this.prisma.alert.count({ where: { organizationId } }),
    ]);

    return {
      data: alerts as AlertWithPublisher[],
      meta: { total, page: safePage, limit: safeLimit },
    };
  }

  async deleteAlert(organizationId: string, alertId: string): Promise<void> {
    // Verify the alert belongs to the organization before deleting
    const existing = await this.prisma.alert.findFirst({
      where: { id: alertId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('ההתראה לא נמצאה');
    }

    // Hard delete — Alert has no soft-delete per design decision
    await this.prisma.alert.delete({ where: { id: alertId } });
  }

  async getUserAlerts(
    organizationId: string,
    userId: string,
    limit: number,
  ): Promise<Alert[]> {
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const now = new Date();

    // Determine if the user is a group manager
    const managerMembership = await this.prisma.groupMembership.findFirst({
      where: {
        organizationId,
        userId,
        role: GroupRole.MANAGER,
      },
    });

    const isManager = managerMembership !== null;

    const audienceFilter = isManager
      ? { in: [AlertAudience.ALL_USERS, AlertAudience.GROUP_MANAGERS] }
      : { equals: AlertAudience.ALL_USERS };

    const alerts = await this.prisma.alert.findMany({
      where: {
        organizationId,
        audience: audienceFilter,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: safeLimit,
    });

    return alerts;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async resolveSubscriptions(
    organizationId: string,
    audience: AlertAudience,
  ): Promise<PushSubscription[]> {
    if (audience === AlertAudience.ALL_USERS) {
      return this.prisma.pushSubscription.findMany({
        where: { organizationId, isActive: true },
      });
    }

    // GROUP_MANAGERS only: find users who are managers in this org
    const managerMemberships = await this.prisma.groupMembership.findMany({
      where: {
        organizationId,
        role: GroupRole.MANAGER,
      },
      select: { userId: true },
    });

    const managerIds = managerMemberships.map((m) => m.userId);

    if (managerIds.length === 0) return [];

    return this.prisma.pushSubscription.findMany({
      where: {
        organizationId,
        isActive: true,
        userId: { in: managerIds },
      },
    });
  }

  private sendPushNotificationsInBackground(
    alertId: string,
    subscriptions: PushSubscription[],
    payload: PushPayload,
  ): void {
    // Detach from current async context — fire and forget
    this.fanOutPush(alertId, subscriptions, payload).catch((err: unknown) => {
      this.logger.error(`Background push fan-out failed for alert ${alertId}`, err);
    });
  }

  private async fanOutPush(
    alertId: string,
    subscriptions: PushSubscription[],
    payload: PushPayload,
  ): Promise<void> {
    this.ensureVapid();

    if (!this.vapidInitialized) {
      this.logger.warn(`Skipping push fan-out for alert ${alertId} — VAPID not configured`);
      return;
    }

    const payloadStr = JSON.stringify(payload);
    let deliveredCount = 0;
    const staleIds: string[] = [];

    // Process in batches to cap concurrency
    for (let i = 0; i < subscriptions.length; i += PUSH_CONCURRENCY) {
      const batch = subscriptions.slice(i, i + PUSH_CONCURRENCY);

      const results = await Promise.allSettled(
        batch.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payloadStr,
          ),
        ),
      );

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          deliveredCount++;
        } else {
          const err = result.reason as { statusCode?: number };
          const status = err?.statusCode;
          if (status === 410 || status === 404) {
            staleIds.push(batch[idx].id);
          } else {
            this.logger.warn(
              `Push delivery failed for subscription ${batch[idx].id}: ${String(result.reason)}`,
            );
          }
        }
      });
    }

    // Cleanup stale subscriptions
    if (staleIds.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { id: { in: staleIds } },
      });
      this.logger.log(`Removed ${staleIds.length} stale push subscriptions`);
    }

    // Update delivered count on the alert
    await this.prisma.alert.update({
      where: { id: alertId },
      data: { deliveredCount },
    });

    this.logger.log(
      `Alert ${alertId}: delivered ${deliveredCount}/${subscriptions.length}, removed ${staleIds.length} stale`,
    );
  }
}
