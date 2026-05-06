import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { Alert, AlertAudience, GroupRole, PaymentStatus, PushSubscription } from '@prisma/client';
import webpush from 'web-push';
import { CreateAlertDto } from './dto/create-alert.dto';

/** Returns the ISO week key for the given date, e.g. "2026-W19" */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Thursday in current week decides the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Returns the first day of the current calendar month at midnight UTC */
function firstDayOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

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

  async createAlertForUsers(
    organizationId: string,
    publishedById: string,
    dto: CreateAlertDto,
    targetUserIds: string[],
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

    try {
      const subscriptions =
        targetUserIds.length > 0
          ? await this.prisma.pushSubscription.findMany({
              where: {
                organizationId,
                isActive: true,
                userId: { in: targetUserIds },
              },
            })
          : [];

      await this.prisma.alert.update({
        where: { id: alert.id },
        data: { recipientCount: targetUserIds.length },
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
      this.logger.warn(
        `Push fan-out failed for targeted alert ${alert.id}, alert was still created`,
        (err as Error).message,
      );
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

    // Base audiences visible to every authenticated user
    const visibleAudiences: AlertAudience[] = [AlertAudience.ALL_USERS];

    // GROUP_MANAGERS audience: visible to users who hold the MANAGER role in any group
    const managerMembership = await this.prisma.groupMembership.findFirst({
      where: { organizationId, userId, role: GroupRole.MANAGER },
    });
    if (managerMembership) {
      visibleAudiences.push(AlertAudience.GROUP_MANAGERS);
    }

    // UNPAID_THIS_MONTH audience: visible to users with no COMPLETED payment this calendar month
    const monthStart = firstDayOfCurrentMonth();
    const paidPayment = await this.prisma.payment.findFirst({
      where: {
        organizationId,
        userId,
        status: PaymentStatus.COMPLETED,
        createdAt: { gte: monthStart },
      },
    });
    if (!paidPayment) {
      visibleAudiences.push(AlertAudience.UNPAID_THIS_MONTH);
    }

    // CURRENT_DISTRIBUTORS audience: visible to users assigned as distributor for the active ISO week
    const currentWeek = isoWeekKey(now);
    const distributorAssignment = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: { organizationId, assignedUserId: userId, weekKey: currentWeek },
    });
    if (distributorAssignment) {
      visibleAudiences.push(AlertAudience.CURRENT_DISTRIBUTORS);
    }

    const alerts = await this.prisma.alert.findMany({
      where: {
        organizationId,
        audience: { in: visibleAudiences },
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
  // Public helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolve the set of user IDs that match the given audience within an organization.
   * Used internally for push fan-out and can be called externally for dry-run previews.
   */
  async resolveAudienceUserIds(
    audience: AlertAudience,
    organizationId: string,
  ): Promise<string[]> {
    switch (audience) {
      case AlertAudience.ALL_USERS: {
        const users = await this.prisma.user.findMany({
          where: { organizationId, deletedAt: null, isActive: true },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }

      case AlertAudience.GROUP_MANAGERS: {
        const memberships = await this.prisma.groupMembership.findMany({
          where: { organizationId, role: GroupRole.MANAGER },
          select: { userId: true },
        });
        return memberships.map((m) => m.userId);
      }

      case AlertAudience.UNPAID_THIS_MONTH: {
        // All active users in the org
        const allUsers = await this.prisma.user.findMany({
          where: { organizationId, deletedAt: null, isActive: true },
          select: { id: true },
        });

        const monthStart = firstDayOfCurrentMonth();

        // Users who DO have a successful payment this month
        const paidPayments = await this.prisma.payment.findMany({
          where: {
            organizationId,
            status: PaymentStatus.COMPLETED,
            createdAt: { gte: monthStart },
          },
          select: { userId: true },
        });

        const paidUserIds = new Set(paidPayments.map((p) => p.userId));

        return allUsers
          .map((u) => u.id)
          .filter((id) => !paidUserIds.has(id));
      }

      case AlertAudience.CURRENT_DISTRIBUTORS: {
        const currentWeek = isoWeekKey(new Date());

        const assignments = await this.prisma.weeklyDistributorAssignment.findMany({
          where: { organizationId, weekKey: currentWeek },
          select: { assignedUserId: true },
        });

        // Deduplicate — a user could theoretically be distributor for multiple groups
        const uniqueIds = [...new Set(assignments.map((a) => a.assignedUserId))];
        return uniqueIds;
      }

      default: {
        // Exhaustive guard — TypeScript will error if a new enum value is unhandled
        const _exhaustive: never = audience;
        this.logger.warn(`Unknown AlertAudience value: ${String(_exhaustive)}`);
        return [];
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async resolveSubscriptions(
    organizationId: string,
    audience: AlertAudience,
  ): Promise<PushSubscription[]> {
    const userIds = await this.resolveAudienceUserIds(audience, organizationId);

    if (audience === AlertAudience.ALL_USERS) {
      // Broad fan-out — all active subscriptions in the org (not filtered by userId to
      // avoid missing subscriptions for users created after the user list was fetched)
      return this.prisma.pushSubscription.findMany({
        where: { organizationId, isActive: true },
      });
    }

    if (userIds.length === 0) return [];

    return this.prisma.pushSubscription.findMany({
      where: {
        organizationId,
        isActive: true,
        userId: { in: userIds },
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
