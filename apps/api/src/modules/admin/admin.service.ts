import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import {
  AdminStatsDto,
  RevenueByMonthDto,
  UnpaidUserDto,
  GroupWeeklyStatusDto,
} from './dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(organizationId: string): Promise<AdminStatsDto> {
    this.logger.log(`Getting dashboard stats for organization ${organizationId}`);

    const currentMonth = this.getCurrentMonthKey();

    const [totalUsers, totalGroups, totalFamilies, revenue, paidCount] = await Promise.all([
      this.prisma.user.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.group.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.family.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.payment.aggregate({
        where: {
          organizationId,
          monthKey: currentMonth,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: {
          organizationId,
          monthKey: currentMonth,
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      totalUsers,
      totalGroups,
      totalFamilies,
      currentMonthRevenue: Number(revenue._sum?.amount ?? 0),
      paidUsersThisMonth: paidCount,
      unpaidUsersThisMonth: totalUsers - paidCount,
    };
  }

  async getMonthlyRevenue(organizationId: string): Promise<{ revenue: number }> {
    this.logger.log(`Getting monthly revenue for organization ${organizationId}`);

    const currentMonth = this.getCurrentMonthKey();

    const result = await this.prisma.payment.aggregate({
      where: {
        organizationId,
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    return {
      revenue: Number(result._sum?.amount ?? 0),
    };
  }

  async getRevenueByMonth(
    organizationId: string,
    months: number = 12,
  ): Promise<{ data: RevenueByMonthDto[] }> {
    this.logger.log(`Getting revenue by month for last ${months} months`);

    const monthKeys = this.getLastNMonthKeys(months);

    const payments = await this.prisma.payment.groupBy({
      by: ['monthKey'],
      where: {
        organizationId,
        monthKey: { in: monthKeys },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    const revenueMap = new Map(
      payments.map((p) => [
        p.monthKey,
        {
          monthKey: p.monthKey,
          revenue: Number(p._sum?.amount ?? 0),
          paymentCount: p._count._all,
        },
      ]),
    );

    const data = monthKeys.map(
      (monthKey) =>
        revenueMap.get(monthKey) ?? {
          monthKey,
          revenue: 0,
          paymentCount: 0,
        },
    );

    return { data };
  }

  async getUnpaidUsers(
    organizationId: string,
    monthKey?: string,
  ): Promise<{ data: UnpaidUserDto[] }> {
    const targetMonth = monthKey ?? this.getCurrentMonthKey();

    this.logger.log(`Getting unpaid users for month ${targetMonth}`);

    const unpaidUsers = await this.prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        payments: {
          none: {
            monthKey: targetMonth,
            status: 'COMPLETED',
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        paymentReminders: {
          where: {
            monthKey: targetMonth,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    const data: UnpaidUserDto[] = unpaidUsers.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email ?? undefined,
      reminderCount: u.paymentReminders.length,
    }));

    return { data };
  }

  async getWeeklyStatus(
    organizationId: string,
    weekKey?: string,
  ): Promise<{ data: GroupWeeklyStatusDto[] }> {
    const week = weekKey ?? this.getCurrentWeekKey();

    this.logger.log(`Getting weekly status for week ${week}`);

    const groups = await this.prisma.group.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        manager: {
          select: {
            fullName: true,
          },
        },
        _count: {
          select: {
            families: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    const data: GroupWeeklyStatusDto[] = await Promise.all(
      groups.map(async (group) => {
        const [completedCount, pendingCount, distributor] = await Promise.all([
          this.prisma.weeklyOrder.count({
            where: {
              groupId: group.id,
              weekKey: week,
              status: 'COMPLETED',
            },
          }),
          this.prisma.weeklyOrder.count({
            where: {
              groupId: group.id,
              weekKey: week,
              status: 'DRAFT',
            },
          }),
          this.prisma.weeklyDistributorAssignment.findFirst({
            where: {
              groupId: group.id,
              weekKey: week,
            },
            include: {
              assignedUser: {
                select: {
                  fullName: true,
                },
              },
            },
          }),
        ]);

        return {
          groupId: group.id,
          groupName: group.name,
          managerName: group.manager?.fullName ?? null,
          totalFamilies: group._count.families,
          completedOrders: completedCount,
          pendingOrders: pendingCount,
          distributorName: distributor?.assignedUser.fullName,
          hasDistributor: !!distributor,
        };
      }),
    );

    return { data };
  }

  async getPaymentsList(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    filters?: { monthKey?: string; status?: string; fromDate?: string; toDate?: string },
  ) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };
    if (filters?.monthKey) where.monthKey = filters.monthKey;
    if (filters?.status) where.status = filters.status;
    if (filters?.fromDate || filters?.toDate) {
      where.paymentDate = {
        ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
        ...(filters.toDate ? { lte: new Date(filters.toDate + 'T23:59:59') } : {}),
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          user: { select: { fullName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.fullName,
        userPhone: p.user.phone,
        amount: Number(p.amount),
        monthKey: p.monthKey,
        status: p.status,
        paymentDate: p.paymentDate?.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize: limit,
    };
  }

  async getGroupsOverview(organizationId: string) {
    const groups = await this.prisma.group.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        manager: { select: { fullName: true } },
        _count: {
          select: {
            memberships: true,
            families: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g._count.memberships,
      familyCount: g._count.families,
      managerName: g.manager?.fullName ?? null,
    }));
  }

  async getWeeklyOrders(
    organizationId: string,
    weekKey?: string,
  ): Promise<{
    data: {
      weekKey: string;
      groups: Array<{
        groupId: string;
        groupName: string;
        families: Array<{
          familyId: string;
          familyName: string;
          contactName: string | null;
          address: string | null;
          items: unknown;
          status: string;
          notes: string | null;
        }>;
      }>;
    };
  }> {
    const week = weekKey ?? this.getCurrentWeekKey();

    this.logger.log(`Getting weekly orders for week ${week}, organization ${organizationId}`);

    const orders = await this.prisma.weeklyOrder.findMany({
      where: {
        organizationId,
        weekKey: week,
      },
      include: {
        family: {
          select: {
            familyName: true,
            contactName: true,
            address: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ groupId: 'asc' }, { familyId: 'asc' }],
    });

    const groupMap = new Map<
      string,
      {
        groupId: string;
        groupName: string;
        families: Array<{
          familyId: string;
          familyName: string;
          contactName: string | null;
          address: string | null;
          items: unknown;
          status: string;
          notes: string | null;
        }>;
      }
    >();

    for (const order of orders) {
      if (!groupMap.has(order.groupId)) {
        groupMap.set(order.groupId, {
          groupId: order.groupId,
          groupName: order.group.name,
          families: [],
        });
      }

      groupMap.get(order.groupId)!.families.push({
        familyId: order.familyId,
        familyName: order.family.familyName,
        contactName: order.family.contactName,
        address: order.family.address,
        items: order.shoppingListJson,
        status: order.status,
        notes: order.notes,
      });
    }

    return {
      data: {
        weekKey: week,
        groups: Array.from(groupMap.values()),
      },
    };
  }

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getCurrentWeekKey(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  async getPaymentStatistics(organizationId: string) {
    const now = new Date();
    const currentMonthKey = this.getCurrentMonthKey();
    const currentYear = now.getFullYear();

    // Current month total
    const monthPayments = await this.prisma.payment.aggregate({
      where: { organizationId, monthKey: currentMonthKey, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    // Current week total (payments made in last 7 days)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekPayments = await this.prisma.payment.aggregate({
      where: {
        organizationId,
        status: 'COMPLETED',
        paymentDate: { gte: weekStart },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Yearly total
    const yearMonthKeys = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(currentYear, i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const yearPayments = await this.prisma.payment.aggregate({
      where: { organizationId, monthKey: { in: yearMonthKeys }, status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    // Daily breakdown for current month (for timing analysis)
    const monthPaymentsList = await this.prisma.payment.findMany({
      where: { organizationId, monthKey: currentMonthKey, status: 'COMPLETED', paymentDate: { not: null } },
      select: { paymentDate: true },
    });
    const dayDistribution: Record<number, number> = {};
    for (const p of monthPaymentsList) {
      if (p.paymentDate) {
        const day = p.paymentDate.getDate();
        dayDistribution[day] = (dayDistribution[day] || 0) + 1;
      }
    }
    const bestDay = Object.entries(dayDistribution)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      currentMonth: {
        total: Number(monthPayments._sum.amount || 0),
        count: monthPayments._count,
        monthKey: currentMonthKey,
      },
      currentWeek: {
        total: Number(weekPayments._sum.amount || 0),
        count: weekPayments._count,
      },
      yearly: {
        total: Number(yearPayments._sum.amount || 0),
        count: yearPayments._count,
        year: currentYear,
      },
      bestPaymentDay: bestDay ? { day: parseInt(bestDay[0]), count: parseInt(String(bestDay[1])) } : null,
      dayDistribution,
    };
  }

  private getLastNMonthKeys(n: number): string[] {
    const keys: string[] = [];
    const now = new Date();

    for (let i = 0; i < n; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      keys.push(key);
    }

    return keys.reverse();
  }
}
