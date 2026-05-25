import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@common/prisma/prisma.service';
import { AlertsService } from '@modules/alerts/alerts.service';
import { OrganizationStatus, TehillimDedicationType } from '@prisma/client';
import { DedicateTehillimDto } from './dto/dedicate.dto';

const MAX_DEDICATIONS_PER_DAY = 3;
const PRIORITY_GRACE_MINUTES = 60; // עד שעה אחרי 10:00 — רק מי שזכה לעדיפות יכול להקדיש

const DEDICATION_LABELS: Record<TehillimDedicationType, string> = {
  BRIAUT: 'בריאות',
  HATZLACHA: 'הצלחה',
  PARNASSA: 'פרנסה',
  ZIVUG: 'זיווג הגון',
  SIMCHA: 'שמחה',
  EXAM: 'הצלחה במבחן',
  BUSINESS: 'הצלחה בעסקה',
  EMUNAH: 'אמונה',
  REFUAH: 'רפואה',
  NESHAMA: 'לעילוי נשמת',
};

/**
 * Daily Tehillim queue service.
 *
 * The flow:
 *   1. Every morning at 10:00 IST a cron creates a new DailyTehillim row per
 *      active organization with a random chapter (1-150).
 *   2. The same cron looks at yesterday's first 3 readers (by readAt asc) and
 *      stores their userIds on today's row as priorityUserIds.
 *   3. A push notification fans out to every active subscription in the org.
 *   4. The first 3 users to call dedicate() claim positions 1/2/3 with their
 *      chosen blessing type and dedicatee name. During the first hour after
 *      10:00, only priorityUserIds can claim. After the grace window slots
 *      open to everyone.
 *   5. Everyone else marks themselves as having read by calling read(). The
 *      readAt timestamp on this row decides their priority for tomorrow.
 */
@Injectable()
export class TehillimService {
  private readonly logger = new Logger(TehillimService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  // ─── Date helpers (Asia/Jerusalem) ──────────────────────────

  private todayDateIST(): Date {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const isoDate = fmt.format(new Date()); // YYYY-MM-DD
    return new Date(`${isoDate}T00:00:00.000Z`);
  }

  private yesterdayDateIST(): Date {
    const today = this.todayDateIST();
    return new Date(today.getTime() - 24 * 60 * 60 * 1000);
  }

  private tomorrowDateIST(): Date {
    const today = this.todayDateIST();
    return new Date(today.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Ensures tomorrow's DailyTehillim row exists and that the given user is
   * listed in its priorityUserIds. Used when a user finishes reading today
   * and lands in the first-3 — they should be able to dedicate immediately
   * for tomorrow.
   */
  private async ensureTomorrowDailyWithPriority(organizationId: string, userId: string) {
    const tomorrow = this.tomorrowDateIST();
    const existing = await this.prisma.dailyTehillim.findUnique({
      where: { organizationId_date: { organizationId, date: tomorrow } },
    });

    if (existing) {
      if (existing.priorityUserIds.includes(userId)) return existing;
      return this.prisma.dailyTehillim.update({
        where: { id: existing.id },
        data: { priorityUserIds: { push: userId } },
      });
    }

    const chapter = Math.floor(Math.random() * 150) + 1;
    return this.prisma.dailyTehillim.create({
      data: {
        organizationId,
        date: tomorrow,
        chapter,
        priorityUserIds: [userId],
      },
    });
  }

  // ─── Public API ──────────────────────────────────────────────

  async getToday(organizationId: string, userId: string) {
    const today = this.todayDateIST();
    const daily = await this.prisma.dailyTehillim.findUnique({
      where: { organizationId_date: { organizationId, date: today } },
      include: {
        dedications: {
          orderBy: { position: 'asc' },
          include: { user: { select: { id: true, fullName: true } } },
        },
        readings: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!daily) {
      return {
        exists: false,
        message: 'התהילים היומי טרם נוצר. ייווצר אוטומטית מחר ב-10:00.',
      };
    }

    const myDedication = daily.dedications.find(d => d.userId === userId);
    const myReading = daily.readings[0] ?? null;
    const isPriorityUser = daily.priorityUserIds.includes(userId);
    const dedicationsCount = daily.dedications.length;
    const slotsLeft = MAX_DEDICATIONS_PER_DAY - dedicationsCount;

    // ההגנה על תור: בתוך חלון החסד (שעה ראשונה) רק priority users יכולים להקדיש
    const ageMinutes = (Date.now() - daily.createdAt.getTime()) / 60000;
    const inGraceWindow = ageMinutes < PRIORITY_GRACE_MINUTES;
    const hasPriorityUsers = daily.priorityUserIds.length > 0;
    const canDedicate =
      !myDedication &&
      slotsLeft > 0 &&
      (!inGraceWindow || !hasPriorityUsers || isPriorityUser);

    // האם כבר הוקדש למחר ע״י המשתמש?
    const tomorrow = this.tomorrowDateIST();
    const tomorrowDaily = await this.prisma.dailyTehillim.findUnique({
      where: { organizationId_date: { organizationId, date: tomorrow } },
      include: { dedications: { where: { userId } } },
    });
    const tomorrowState = tomorrowDaily
      ? {
          chapter: tomorrowDaily.chapter,
          date: tomorrowDaily.date.toISOString().slice(0, 10),
          isPriorityUser: tomorrowDaily.priorityUserIds.includes(userId),
          myDedication: tomorrowDaily.dedications[0]
            ? {
                position: tomorrowDaily.dedications[0].position,
                type: tomorrowDaily.dedications[0].type,
                dedicateeName: tomorrowDaily.dedications[0].dedicateeName,
                motherName: tomorrowDaily.dedications[0].motherName,
              }
            : null,
        }
      : null;

    return {
      exists: true,
      id: daily.id,
      date: daily.date.toISOString().slice(0, 10),
      chapter: daily.chapter,
      dedications: daily.dedications.map(d => ({
        position: d.position,
        type: d.type,
        typeLabel: DEDICATION_LABELS[d.type],
        dedicateeName: d.dedicateeName,
        motherName: d.motherName,
        dedicatorName: d.user.fullName,
        createdAt: d.createdAt,
      })),
      slotsLeft,
      myDedication: myDedication
        ? {
            position: myDedication.position,
            type: myDedication.type,
            dedicateeName: myDedication.dedicateeName,
            motherName: myDedication.motherName,
          }
        : null,
      myReading: myReading ? { readAt: myReading.readAt } : null,
      isPriorityUser,
      canDedicate,
      inGraceWindow,
      gracePeriodEndsAt: new Date(daily.createdAt.getTime() + PRIORITY_GRACE_MINUTES * 60000),
      tomorrow: tomorrowState,
    };
  }

  async dedicate(
    organizationId: string,
    userId: string,
    dto: DedicateTehillimDto,
    forTomorrow = false,
  ) {
    const targetDate = forTomorrow ? this.tomorrowDateIST() : this.todayDateIST();
    const daily = await this.prisma.dailyTehillim.findUnique({
      where: { organizationId_date: { organizationId, date: targetDate } },
    });
    if (!daily) {
      throw new NotFoundException(
        `לא נוצר תהילים יומי ל${forTomorrow ? 'מחר' : 'היום'}`,
      );
    }

    const existing = await this.prisma.tehillimDedication.findUnique({
      where: { dailyTehillimId_userId: { dailyTehillimId: daily.id, userId } },
    });
    if (existing) throw new ConflictException('כבר תפסת סלוט');

    const count = await this.prisma.tehillimDedication.count({
      where: { dailyTehillimId: daily.id },
    });
    if (count >= MAX_DEDICATIONS_PER_DAY) {
      throw new ConflictException('כל הסלוטים נתפסו');
    }

    if (forTomorrow) {
      // הקדשה למחר זמינה רק למי שזכה להיכלל ב-priorityUserIds (3 הראשונים
      // שאישרו קריאה היום). מי שלא בתוך הרשימה — חייב לחכות עד 10:00 מחר.
      if (!daily.priorityUserIds.includes(userId)) {
        throw new ForbiddenException('הקדשה מראש למחר מותרת רק ל-3 הזוכים שקראו ראשונים היום');
      }
    } else {
      // עבור היום — לוגיקת חלון החסד הקיימת
      const ageMinutes = (Date.now() - daily.createdAt.getTime()) / 60000;
      const inGrace = ageMinutes < PRIORITY_GRACE_MINUTES;
      const hasPriority = daily.priorityUserIds.length > 0;
      const isPriority = daily.priorityUserIds.includes(userId);
      if (inGrace && hasPriority && !isPriority) {
        throw new ForbiddenException(
          'בשעה הראשונה רק 3 הראשונים שאישרו קריאה אתמול יכולים להקדיש. נסה שוב בעוד מעט.',
        );
      }
    }

    if (
      (dto.type === 'NESHAMA' || dto.type === 'REFUAH') &&
      (!dto.dedicateeName || dto.dedicateeName.trim().length < 2)
    ) {
      throw new BadRequestException('בברכת רפואה/נשמה — שם המוקדש חובה');
    }

    return this.prisma.tehillimDedication.create({
      data: {
        organizationId,
        dailyTehillimId: daily.id,
        userId,
        type: dto.type,
        dedicateeName: dto.dedicateeName?.trim() || null,
        motherName: dto.motherName?.trim() || null,
        position: count + 1,
      },
    });
  }

  async confirmRead(organizationId: string, userId: string) {
    const today = this.todayDateIST();
    const daily = await this.prisma.dailyTehillim.findUnique({
      where: { organizationId_date: { organizationId, date: today } },
    });
    if (!daily) throw new NotFoundException('התהילים היומי טרם נוצר להיום');

    const reading = await this.prisma.tehillimReading.upsert({
      where: { dailyTehillimId_userId: { dailyTehillimId: daily.id, userId } },
      create: { organizationId, dailyTehillimId: daily.id, userId },
      update: {},
    });

    // Rank deterministically — readAt asc, id asc as tie-breaker. Including
    // self in the count means rank starts at 1.
    const rank = await this.prisma.tehillimReading.count({
      where: {
        dailyTehillimId: daily.id,
        OR: [
          { readAt: { lt: reading.readAt } },
          { readAt: reading.readAt, id: { lte: reading.id } },
        ],
      },
    });

    let tomorrow: {
      id: string;
      chapter: number;
      date: string;
      alreadyDedicated: boolean;
    } | null = null;

    if (rank <= 3) {
      // First-3 reader → eligible for tomorrow's dedication slot. Pre-create
      // tomorrow's DailyTehillim row (or add this user to its priority list)
      // so that the dedicate-for-tomorrow endpoint can accept the call now.
      const tomorrowDaily = await this.ensureTomorrowDailyWithPriority(organizationId, userId);
      const myExisting = await this.prisma.tehillimDedication.findUnique({
        where: { dailyTehillimId_userId: { dailyTehillimId: tomorrowDaily.id, userId } },
      });
      tomorrow = {
        id: tomorrowDaily.id,
        chapter: tomorrowDaily.chapter,
        date: tomorrowDaily.date.toISOString().slice(0, 10),
        alreadyDedicated: !!myExisting,
      };
    }

    return {
      reading,
      rank,
      eligibleForTomorrowDedication: rank <= 3,
      tomorrow,
    };
  }

  // ─── Daily cron at 10:00 IST ─────────────────────────────────

  @Cron('0 10 * * *', { timeZone: 'Asia/Jerusalem' })
  async runDailyTehillimRollout(): Promise<void> {
    const start = Date.now();
    this.logger.log('[DailyTehillim] Rollout starting');

    const orgs = await this.prisma.organization.findMany({
      where: { status: OrganizationStatus.ACTIVE, deletedAt: null },
      select: { id: true, name: true },
    });

    let processed = 0;
    let errors = 0;
    for (const org of orgs) {
      try {
        await this.rolloutForOrg(org.id);
        processed++;
      } catch (err) {
        errors++;
        this.logger.error(`[DailyTehillim] Org ${org.id} failed: ${(err as Error).message}`);
      }
    }

    this.logger.log(
      `[DailyTehillim] Complete in ${Date.now() - start}ms — ${processed}/${orgs.length} orgs, ${errors} errors`,
    );
  }

  private async rolloutForOrg(organizationId: string): Promise<void> {
    const today = this.todayDateIST();

    // הרישום של היום עשוי להיווצר מראש אתמול-בערב ע״י קוראים מקדימים. אם
    // כן — נעדכן רק את ההודעה והפוש; אם לא — ניצור אותו עכשיו.
    let daily = await this.prisma.dailyTehillim.findUnique({
      where: { organizationId_date: { organizationId, date: today } },
    });

    if (daily?.pushSentAt) {
      this.logger.log(`[DailyTehillim] Org ${organizationId}: push already sent today`);
      return;
    }

    if (!daily) {
      // fallback: יום ראשון אי-פעם, או שאף אחד לא קרא אתמול
      const yesterday = this.yesterdayDateIST();
      const yesterdayDaily = await this.prisma.dailyTehillim.findUnique({
        where: { organizationId_date: { organizationId, date: yesterday } },
        include: {
          readings: { orderBy: { readAt: 'asc' }, take: 3, select: { userId: true } },
        },
      });
      const priorityUserIds = yesterdayDaily?.readings.map(r => r.userId) ?? [];
      const chapter = Math.floor(Math.random() * 150) + 1;

      daily = await this.prisma.dailyTehillim.create({
        data: { organizationId, date: today, chapter, priorityUserIds },
      });
    }

    // ספירת הקדשות שכבר נשמרו מראש (ע״י זוכי האתמול)
    const dedicationsReady = await this.prisma.tehillimDedication.count({
      where: { dailyTehillimId: daily.id },
    });
    const slotsBlurb =
      dedicationsReady === 3
        ? 'כל 3 ההקדשות מוכנות מאתמול'
        : `${dedicationsReady}/3 הקדשות כבר מוכנות`;

    const recipientCount = await this.alertsService.broadcastPushToOrg(organizationId, {
      title: 'תהילים יומי — פרק ' + daily.chapter,
      body: `הצטרפו לקריאת תהילים של היום. ${slotsBlurb}.`,
      url: '/community/tehillim',
      type: 'daily-tehillim',
    });

    await this.prisma.dailyTehillim.update({
      where: { id: daily.id },
      data: { pushSentAt: new Date() },
    });

    this.logger.log(
      `[DailyTehillim] Org ${organizationId}: chapter ${daily.chapter}, push to ${recipientCount} subs, dedications=${dedicationsReady}/3`,
    );
  }
}
