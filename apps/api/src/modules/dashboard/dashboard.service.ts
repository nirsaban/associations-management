import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

interface DashboardData {
  role: string;
  [key: string]: unknown;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string, userId: string, role: string): Promise<DashboardData> {
    this.logger.log(`Getting dashboard data for user ${userId} with role ${role}`);

    switch (role) {
      case 'admin':
        return this.getAdminDashboard(organizationId);
      case 'manager':
        return this.getManagerDashboard(organizationId, userId);
      case 'distributor':
        return this.getDistributorDashboard(organizationId, userId);
      default:
        return this.getUserDashboard(organizationId, userId);
    }
  }

  private async getAdminDashboard(organizationId: string): Promise<DashboardData> {
    const [userCount, familyCount, groupCount, totalPayments] = await Promise.all([
      this.prisma.user.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.family.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.group.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.payment.aggregate({
        where: { organizationId, status: 'COMPLETED', deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const paidUsers = await this.prisma.payment.count({
      where: {
        organizationId,
        monthKey: currentMonth,
        status: 'COMPLETED',
        deletedAt: null,
      },
    });

    return {
      role: 'admin',
      userCount,
      familyCount,
      groupCount,
      totalPayments: totalPayments._sum.amount ?? 0,
      paidUsersThisMonth: paidUsers,
      unpaidUsersThisMonth: userCount - paidUsers,
    };
  }

  private async getManagerDashboard(organizationId: string, userId: string): Promise<DashboardData> {
    // Get groups managed by this manager
    const groups = await this.prisma.group.findMany({
      where: {
        organizationId,
        managerId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const groupIds = groups.map((g) => g.id);

    const [familyCount, memberCount, orderCount] = await Promise.all([
      this.prisma.groupFamily.count({
        where: {
          organizationId,
          groupId: { in: groupIds },
          deletedAt: null,
        },
      }),
      this.prisma.groupMembership.count({
        where: {
          organizationId,
          groupId: { in: groupIds },
          deletedAt: null,
        },
      }),
      this.prisma.weeklyOrder.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      role: 'manager',
      managedGroupCount: groups.length,
      familyCount,
      memberCount,
      pendingOrders: orderCount,
    };
  }

  private async getDistributorDashboard(organizationId: string, userId: string): Promise<DashboardData> {
    const currentWeek = this.getCurrentWeek();
    const currentWeekDate = this.getCurrentWeekDate();

    // Get current distributor assignment
    const distributorAssignment = await this.prisma.weeklyDistributor.findFirst({
      where: {
        organizationId,
        userId,
        weekStart: currentWeekDate,
        deletedAt: null,
      },
      include: {
        group: {
          select: { id: true, name: true },
        },
      },
    });

    if (!distributorAssignment) {
      return {
        role: 'distributor',
        currentWeek,
        assignedGroup: null,
        deliveriesCount: 0,
      };
    }

    const deliveries = await this.prisma.weeklyOrder.count({
      where: {
        organizationId,
        weekStart: currentWeekDate,
        groupId: distributorAssignment.groupId,
        status: 'COMPLETED',
        deletedAt: null,
      },
    });

    const totalOrders = await this.prisma.weeklyOrder.count({
      where: {
        organizationId,
        weekStart: currentWeekDate,
        groupId: distributorAssignment.groupId,
        deletedAt: null,
      },
    });

    return {
      role: 'distributor',
      currentWeek,
      assignedGroup: distributorAssignment.group.name,
      completedDeliveries: deliveries,
      totalDeliveries: totalOrders,
      completionPercentage: totalOrders > 0 ? Math.round((deliveries / totalOrders) * 100) : 0,
    };
  }

  private async getUserDashboard(organizationId: string, userId: string): Promise<DashboardData> {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const paymentStatus = await this.prisma.payment.findFirst({
      where: {
        userId,
        monthKey: currentMonth,
        status: 'COMPLETED',
        deletedAt: null,
      },
    });

    const lastPayment = await this.prisma.payment.findFirst({
      where: {
        organizationId,
        userId,
        status: 'COMPLETED',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const unreadNotifications = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
    });

    return {
      role: 'user',
      paid: !!paymentStatus,
      lastPaymentDate: lastPayment?.createdAt,
      lastPaymentAmount: lastPayment?.amount,
      unreadNotifications,
    };
  }

  private getCurrentWeekDate(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private getCurrentWeek(): string {
    const now = new Date();
    const weekNum = this.getWeekNumber(now);
    const year = now.getFullYear();
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
