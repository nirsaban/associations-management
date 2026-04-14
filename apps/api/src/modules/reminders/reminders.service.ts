import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendReminderNotifications(): Promise<void> {
    this.logger.log('Starting daily reminder check');

    // Get current month key
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get all unpaid users (users without a COMPLETED payment for this month)
    const unpaidUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        payments: {
          none: {
            monthKey,
            status: 'COMPLETED',
            deletedAt: null,
          },
        },
      },
    });

    this.logger.log(`Found ${unpaidUsers.length} unpaid users for month ${monthKey}`);

    for (const user of unpaidUsers) {
      // Skip SUPER_ADMIN users (no organization, no payments)
      if (!user.organizationId) {
        continue;
      }

      // Check reminder count for this user this month
      const reminderCount = await this.prisma.paymentReminder.count({
        where: {
          userId: user.id,
          monthKey,
          deletedAt: null,
        },
      });

      // Only send if less than 3 reminders this month
      if (reminderCount < 3) {
        await this.sendReminder(user.organizationId, user.id, monthKey, reminderCount + 1, 'SMS');
        this.logger.log(`Reminder sent to user ${user.id} (reminder ${reminderCount + 1}/3)`);
      } else {
        this.logger.log(`User ${user.id} has reached max reminders for month ${monthKey}`);
      }
    }
  }

  private async sendReminder(organizationId: string, userId: string, monthKey: string, reminderNumber: number, channel: 'SMS' | 'PUSH' | 'WHATSAPP'): Promise<void> {
    // Create reminder record
    await this.prisma.paymentReminder.create({
      data: {
        organizationId,
        userId,
        monthKey,
        reminderNumber,
        channel,
        sentAt: new Date(),
      },
    });

    // TODO: Send actual SMS/email reminder
    this.logger.debug(`Reminder created for user ${userId} via ${channel}`);
  }
}
