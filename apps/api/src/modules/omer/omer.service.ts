import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@common/prisma/prisma.service';
import { PushSubscription } from '@prisma/client';
import webpush from 'web-push';

/**
 * Sefirat HaOmer push notification service.
 *
 * Background:
 *   Sefirat HaOmer is the 49-day count between Pesach (16 Nisan) and Shavuot
 *   (5 Sivan). The count is performed each evening after nightfall. The
 *   Gregorian dates shift every year — in 2026 the count ran 2026-04-02 →
 *   2026-05-22; in 2027 it will run 2027-04-22 → 2027-06-09. Hard-coding the
 *   range is brittle, so we ask Hebcal's API which is authoritative.
 *
 *   Hebcal returns omer items with the Gregorian date of the EVENING that
 *   begins the count (i.e. the night-of date). Asking Hebcal for today's
 *   date at 20:00 IST therefore yields the correct count for tonight.
 *
 * Mechanism:
 *   • A cron job fires daily at 20:00 Asia/Jerusalem (after sunset year-round
 *     during the spring omer period).
 *   • The job queries Hebcal for today's date with omer=on.
 *   • If the response contains an omer item, a push notification is sent to
 *     every active PushSubscription across all organizations.
 *   • Outside the 49-day window Hebcal returns no omer items and the job is
 *     a no-op (zero pushes sent).
 */

interface HebcalOmerItem {
  title: string;
  hebrew?: string;
  date: string;
  category: string;
  omer?: {
    count?: {
      en?: string;
      he?: string;
    };
    sefira?: {
      he?: string;
      translit?: string;
      en?: string;
    };
  };
}

interface HebcalResponse {
  items?: HebcalOmerItem[];
}

const PUSH_CONCURRENCY = 20;

@Injectable()
export class OmerService {
  private readonly logger = new Logger(OmerService.name);
  private vapidInitialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private ensureVapid(): boolean {
    if (this.vapidInitialized) return true;

    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT');

    if (!publicKey || !privateKey || !subject) {
      this.logger.warn('[Omer] VAPID keys not configured — push notifications disabled');
      return false;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidInitialized = true;
    return true;
  }

  /** Returns today's date in Asia/Jerusalem as YYYY-MM-DD. */
  private todayIST(): string {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date());
  }

  /**
   * Asks Hebcal whether today is an omer day. Returns the parsed item or
   * null when outside the 49-day window.
   */
  private async fetchTodaysOmer(): Promise<HebcalOmerItem | null> {
    const date = this.todayIST();
    const url = `https://www.hebcal.com/hebcal?cfg=json&omer=on&maj=off&min=off&mod=off&nx=off&ss=off&mf=off&i=on&start=${date}&end=${date}`;

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'NachalatDavid/1.0' } });
      if (!res.ok) {
        this.logger.warn(`[Omer] Hebcal returned ${res.status}`);
        return null;
      }
      const data = (await res.json()) as HebcalResponse;
      const omerItem = data.items?.find(i => i.category === 'omer');
      return omerItem ?? null;
    } catch (err) {
      this.logger.error(`[Omer] Failed to fetch Hebcal: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Cron entry point. Runs every evening at 20:00 IST. Outside the omer
   * period the job exits early with no pushes sent.
   */
  @Cron('0 20 * * *', { timeZone: 'Asia/Jerusalem' })
  async runDailyOmerReminder(): Promise<void> {
    const start = Date.now();
    this.logger.log('[Omer] Daily check started');

    const item = await this.fetchTodaysOmer();
    if (!item) {
      this.logger.log('[Omer] Not an omer day — no push sent');
      return;
    }

    const dayLabel = item.hebrew || item.title;
    const countText = item.omer?.count?.he || `${dayLabel} לעומר`;
    const sefiraText = item.omer?.sefira?.he ? ` · ${item.omer.sefira.he}` : '';

    const body = `${countText}${sefiraText}`;

    if (!this.ensureVapid()) {
      this.logger.warn('[Omer] Skipping push — VAPID not configured');
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { isActive: true },
    });

    this.logger.log(`[Omer] ${dayLabel}: sending to ${subscriptions.length} subscriptions`);

    if (subscriptions.length === 0) {
      this.logger.log('[Omer] No active subscriptions');
      return;
    }

    await this.broadcastPush(subscriptions, {
      title: 'ספירת העומר',
      body,
      url: '/community/zmanim',
    });

    const duration = Date.now() - start;
    this.logger.log(`[Omer] Complete in ${duration}ms`);
  }

  private async broadcastPush(
    subscriptions: PushSubscription[],
    payload: { title: string; body: string; url: string },
  ): Promise<void> {
    const payloadStr = JSON.stringify({
      type: 'omer',
      title: payload.title,
      body: payload.body,
      url: payload.url,
    });

    let delivered = 0;
    const staleIds: string[] = [];

    for (let i = 0; i < subscriptions.length; i += PUSH_CONCURRENCY) {
      const batch = subscriptions.slice(i, i + PUSH_CONCURRENCY);

      const results = await Promise.allSettled(
        batch.map(sub =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payloadStr,
          ),
        ),
      );

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          delivered++;
        } else {
          const err = result.reason as { statusCode?: number };
          const status = err?.statusCode;
          if (status === 410 || status === 404) {
            staleIds.push(batch[idx].id);
          } else {
            this.logger.warn(
              `[Omer] Push delivery failed for ${batch[idx].id}: ${String(result.reason)}`,
            );
          }
        }
      });
    }

    if (staleIds.length > 0) {
      await this.prisma.pushSubscription.updateMany({
        where: { id: { in: staleIds } },
        data: { isActive: false },
      });
      this.logger.log(`[Omer] Deactivated ${staleIds.length} stale subscriptions`);
    }

    this.logger.log(`[Omer] Delivered ${delivered}/${subscriptions.length} pushes`);
  }
}
