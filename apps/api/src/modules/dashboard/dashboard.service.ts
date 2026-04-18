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
        where: { organizationId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const paidUsers = await this.prisma.payment.count({
      where: {
        organizationId,
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
    });

    return {
      role: 'admin',
      userCount,
      familyCount,
      groupCount,
      totalPayments: totalPayments._sum?.amount ?? 0,
      paidUsersThisMonth: paidUsers,
      unpaidUsersThisMonth: userCount - paidUsers,
    };
  }

  private async getManagerDashboard(organizationId: string, userId: string): Promise<DashboardData> {
    // Get groups managed by this manager
    const groups = await this.prisma.group.findMany({
      where: {
        organizationId,
        managerUserId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const groupIds = groups.map((g) => g.id);

    const [familyCount, memberCount, orderCount] = await Promise.all([
      this.prisma.family.count({
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
        },
      }),
      this.prisma.weeklyOrder.count({
        where: {
          organizationId,
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
    const currentWeekKey = this.getCurrentWeekKey();

    // Get current distributor assignment
    const distributorAssignment = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        organizationId,
        assignedUserId: userId,
        weekKey: currentWeekKey,
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
        currentWeek: currentWeekKey,
        assignedGroup: null,
        deliveriesCount: 0,
      };
    }

    const deliveries = await this.prisma.weeklyOrder.count({
      where: {
        organizationId,
        weekKey: currentWeekKey,
        groupId: distributorAssignment.groupId,
        status: 'COMPLETED',
      },
    });

    const totalOrders = await this.prisma.weeklyOrder.count({
      where: {
        organizationId,
        weekKey: currentWeekKey,
        groupId: distributorAssignment.groupId,
      },
    });

    return {
      role: 'distributor',
      currentWeek: currentWeekKey,
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
        organizationId,
        userId,
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
    });

    const lastPayment = await this.prisma.payment.findFirst({
      where: {
        organizationId,
        userId,
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const unreadNotifications = await this.prisma.notification.count({
      where: {
        organizationId,
        userId,
        status: { not: 'READ' },
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

  private getCurrentWeekKey(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
}
