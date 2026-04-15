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
