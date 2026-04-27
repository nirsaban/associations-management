import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateReferral(organizationId: string, userId: string) {
    const existing = await this.prisma.referral.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });

    if (existing) return existing;

    // Generate unique code, retry on collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(4).toString('hex');
      try {
        const referral = await this.prisma.referral.create({
          data: { organizationId, userId, code },
        });
        this.logger.log(`Created referral code ${code} for user ${userId}`);
        return referral;
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002' && attempt < 4) continue;
        throw error;
      }
    }

    throw new Error('Failed to generate unique referral code');
  }

  async trackClick(
    organizationId: string,
    code: string,
    ip?: string,
    userAgent?: string,
  ) {
    const referral = await this.prisma.referral.findFirst({
      where: { organizationId, code, isActive: true },
    });

    if (!referral) return { success: false };

    await this.prisma.referralClick.create({
      data: { referralId: referral.id, ip, userAgent },
    });

    return { success: true };
  }

  async getUserStats(organizationId: string, userId: string) {
    const referral = await this.getOrCreateReferral(organizationId, userId);

    const [clickCount, paymentStats, landingPage] = await Promise.all([
      this.prisma.referralClick.count({
        where: { referralId: referral.id },
      }),
      this.prisma.payment.aggregate({
        where: { referralId: referral.id, status: 'COMPLETED' },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.landingPage.findFirst({
        where: { organizationId, published: true },
        select: { slug: true },
      }),
    ]);

    return {
      code: referral.code,
      isActive: referral.isActive,
      clickCount,
      paymentCount: paymentStats._count,
      totalAmount: Number(paymentStats._sum.amount ?? 0),
      landingSlug: landingPage?.slug || null,
    };
  }

  async getAdminStats(organizationId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { clicks: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get payment totals per referral
    const referralIds = referrals.map((r) => r.id);
    const paymentTotals = await this.prisma.payment.groupBy({
      by: ['referralId'],
      where: { referralId: { in: referralIds }, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    const totalsMap = new Map(
      paymentTotals.map((p) => [
        p.referralId,
        { totalAmount: Number(p._sum.amount ?? 0), paymentCount: p._count },
      ]),
    );

    return referrals.map((r) => ({
      userId: r.user.id,
      fullName: r.user.fullName,
      phone: r.user.phone,
      code: r.code,
      isActive: r.isActive,
      clickCount: r._count.clicks,
      paymentCount: totalsMap.get(r.id)?.paymentCount ?? 0,
      totalAmount: totalsMap.get(r.id)?.totalAmount ?? 0,
    }));
  }

  async findReferralByCode(organizationId: string, code: string) {
    return this.prisma.referral.findFirst({
      where: { organizationId, code, isActive: true },
    });
  }
}
