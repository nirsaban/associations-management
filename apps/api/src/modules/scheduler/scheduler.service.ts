import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@common/prisma/prisma.service';
import { getCurrentWeekKey, getCurrentMonthKey } from '@common/utils/week';
import { OrganizationStatus } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Weekly reset ──────────────────────────────────────────────────────────
  //
  // Runs every Sunday at 00:00 Asia/Jerusalem.
  //
  // WeeklyOrder records are created on-demand by group managers for each
  // family — there is no pre-creation step. This job therefore only:
  //   1. Logs the start of the new week so the audit trail is clear.
  //   2. Verifies there is nothing stale to clean up (currently a no-op).
  //
  // WeeklyDistributorAssignment records are also created on-demand by
  // managers via upsert. No auto-rotation pattern exists in this platform.
  // Assignments are left in place between weeks intentionally — a manager
  // must explicitly change them each week. The job therefore documents
  // this fact per organisation and emits a log so operators can confirm
  // the schedule ran.

  @Cron('0 0 * * 0', { timeZone: 'Asia/Jerusalem' })
  async runWeeklyReset(): Promise<void> {
    const weekKey = getCurrentWeekKey();
    const start = Date.now();
    this.logger.log(`[WeeklyReset] Starting for week ${weekKey}`);

    let processedOrgs = 0;
    let errorCount = 0;

    const organizations = await this.prisma.organization.findMany({
      where: {
        status: OrganizationStatus.ACTIVE,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    this.logger.log(`[WeeklyReset] Found ${organizations.length} active organizations`);

    for (const org of organizations) {
      try {
        await this.processWeeklyResetForOrg(org.id, weekKey);
        processedOrgs++;
      } catch (err) {
        errorCount++;
        this.logger.error(
          `[WeeklyReset] Error processing org ${org.id} (${org.name}): ${(err as Error).message}`,
          (err as Error).stack,
        );
      }
    }

    const duration = Date.now() - start;
    this.logger.log(
      `[WeeklyReset] Complete in ${duration}ms — processed ${processedOrgs}/${organizations.length} orgs, ${errorCount} errors`,
    );
  }

  private async processWeeklyResetForOrg(organizationId: string, weekKey: string): Promise<void> {
    // Count existing weekly orders and distributor assignments for the new week.
    // These are created on-demand by managers — we do not auto-create them.
    // This check serves as an idempotency guard and an observability signal.
    const [existingOrders, existingDistributors] = await Promise.all([
      this.prisma.weeklyOrder.count({
        where: { organizationId, weekKey },
      }),
      this.prisma.weeklyDistributorAssignment.count({
        where: { organizationId, weekKey },
      }),
    ]);

    this.logger.log(
      `[WeeklyReset] Org ${organizationId}: week=${weekKey}, existing orders=${existingOrders}, existing distributors=${existingDistributors}`,
    );

    // No mutations needed — orders and distributor assignments for the new
    // week are created on-demand by managers. If none exist yet this early
    // on Sunday that is expected and correct.
  }

  // ─── Monthly reset ─────────────────────────────────────────────────────────
  //
  // Runs on the 1st of each month at 00:00 Asia/Jerusalem.
  //
  // MonthlyPaymentStatus is the pre-computed payment status table consumed by
  // the reminders service and the dashboard "unpaid this month" cohort.
  // This job bootstraps a MonthlyPaymentStatus row (isPaid=false) for every
  // active user in every active organisation, ensuring reads never miss a row.
  //
  // Idempotency: uses upsert with no-op on conflict so re-running is safe.

  @Cron('0 0 1 * *', { timeZone: 'Asia/Jerusalem' })
  async runMonthlyReset(): Promise<void> {
    const monthKey = getCurrentMonthKey();
    const start = Date.now();
    this.logger.log(`[MonthlyReset] Starting for month ${monthKey}`);

    let totalCreated = 0;
    let totalSkipped = 0;
    let errorCount = 0;

    const organizations = await this.prisma.organization.findMany({
      where: {
        status: OrganizationStatus.ACTIVE,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    this.logger.log(`[MonthlyReset] Found ${organizations.length} active organizations`);

    for (const org of organizations) {
      try {
        const { created, skipped } = await this.processMonthlyResetForOrg(org.id, monthKey);
        totalCreated += created;
        totalSkipped += skipped;
        this.logger.log(
          `[MonthlyReset] Org ${org.id}: month=${monthKey}, created=${created}, skipped=${skipped}`,
        );
      } catch (err) {
        errorCount++;
        this.logger.error(
          `[MonthlyReset] Error processing org ${org.id} (${org.name}): ${(err as Error).message}`,
          (err as Error).stack,
        );
      }
    }

    const duration = Date.now() - start;
    this.logger.log(
      `[MonthlyReset] Complete in ${duration}ms — created ${totalCreated}, skipped ${totalSkipped}, ${errorCount} errors`,
    );
  }

  private async processMonthlyResetForOrg(
    organizationId: string,
    monthKey: string,
  ): Promise<{ created: number; skipped: number }> {
    // Fetch all active users for this organization.
    // SUPER_ADMIN users have no organizationId and are excluded by the filter.
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      const existing = await this.prisma.monthlyPaymentStatus.findUnique({
        where: {
          userId_monthKey: {
            userId: user.id,
            monthKey,
          },
        },
        select: { id: true },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await this.prisma.monthlyPaymentStatus.create({
        data: {
          organizationId,
          userId: user.id,
          monthKey,
          isPaid: false,
        },
      });
      created++;
    }

    return { created, skipped };
  }
}
