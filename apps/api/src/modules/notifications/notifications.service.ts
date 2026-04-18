import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, userId: string, createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.logger.log(`Creating notification for user ${userId}`);

    const notification = await this.prisma.notification.create({
      data: {
        organizationId,
        userId,
        title: createNotificationDto.title,
        body: createNotificationDto.body,
        type: createNotificationDto.type as NotificationType,
        metadataJson: (createNotificationDto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        status: 'PENDING',
        sentAt: new Date(),
      },
    });

    return this.mapToDto(notification);
  }

  async findAll(
    organizationId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: NotificationResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding notifications for user ${userId} in org ${organizationId}`);

    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 10;
    const skip = (safePage - 1) * safeLimit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          organizationId,
          userId,
        },
        skip,
        take: safeLimit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({
        where: {
          organizationId,
          userId,
        },
      }),
    ]);

    return {
      data: notifications.map((n) => this.mapToDto(n)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async markAsRead(organizationId: string, userId: string, id: string): Promise<NotificationResponseDto> {
    this.logger.log(`Marking notification ${id} as read for user ${userId} in org ${organizationId}`);

    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        organizationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        status: 'READ',
      },
    });

    return this.mapToDto(updated);
  }

  async markAllAsRead(organizationId: string, userId: string): Promise<{ updated: number }> {
    this.logger.log(`Marking all notifications as read for user ${userId} in org ${organizationId}`);

    const result = await this.prisma.notification.updateMany({
      where: {
        organizationId,
        userId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
      },
    });

    return { updated: result.count };
  }

  async getUnreadCount(organizationId: string, userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        organizationId,
        userId,
        status: { not: 'READ' },
      },
    });

    return { count };
  }

  private mapToDto(notification: Record<string, unknown>): NotificationResponseDto {
    return {
      id: notification.id as string,
      organizationId: notification.organizationId as string,
      userId: notification.userId as string,
      title: notification.title as string,
      body: notification.body as string,
      type: notification.type as string,
      isRead: notification.status === 'READ',
      metadata: notification.metadataJson,
      createdAt: notification.createdAt as Date,
    };
  }
}
