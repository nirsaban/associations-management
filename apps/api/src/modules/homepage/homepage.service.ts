import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { HomepageContextDto } from './dto';

@Injectable()
export class HomepageService {
  private readonly logger = new Logger(HomepageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getContext(userId: string, organizationId: string | null): Promise<HomepageContextDto> {
    this.logger.log(`Getting homepage context for user ${userId}`);

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: organizationId ? true : false,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const context: HomepageContextDto = {
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        systemRole: user.systemRole,
      },
      visibleCards: [],
      quickActions: [],
      unreadNotifications: 0,
    };

    // SUPER_ADMIN has no organization
    if (user.platformRole === 'SUPER_ADMIN') {
      context.visibleCards = ['platform-admin'];
      context.quickActions = [
        {
          id: 'manage-organizations',
          title: 'ניהול עמותות',
          path: '/platform-secret/admins',
        },
      ];
      return context;
    }

    // Get organization context
    if (organizationId && user.organization) {
      context.organization = {
        name: user.organization.name,
        setupCompleted: user.organization.setupCompleted,
      };

      // If setup not completed, show setup wizard
      if (!user.organization.setupCompleted && user.systemRole === 'ADMIN') {
        context.visibleCards = ['organization-setup'];
        context.quickActions = [
          {
            id: 'complete-setup',
            title: 'השלמת הגדרות עמותה',
            path: '/setup/organization',
          },
        ];
        return context;
      }
    }

    // Get unread notifications
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        organizationId: organizationId ?? undefined,
        status: { not: 'READ' },
      },
    });
    context.unreadNotifications = unreadCount;

    // Get payment summary
    const currentMonth = this.getCurrentMonthKey();
    const payment = await this.prisma.payment.findFirst({
      where: {
        userId,
        organizationId: organizationId ?? undefined,
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
    });

    const lastPayment = await this.prisma.payment.findFirst({
      where: {
        userId,
        organizationId: organizationId ?? undefined,
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    context.payment = {
      currentMonth,
      isPaid: !!payment,
      lastPaymentDate: lastPayment?.paymentDate ?? undefined,
    };

    // Check if user is GROUP_MANAGER
    const managedGroups = await this.prisma.group.findMany({
      where: {
        managerUserId: userId,
        organizationId: organizationId ?? undefined,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const isManager = managedGroups.length > 0;

    // Check if user is weekly distributor this week
    const currentWeekKey = this.getCurrentWeekKey();
    const distributorAssignment = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        assignedUserId: userId,
        organizationId: organizationId ?? undefined,
        weekKey: currentWeekKey,
      },
      include: {
        group: {
          select: { name: true },
        },
      },
    });

    const isDistributor = !!distributorAssignment;

    // Get group membership
    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        userId,
        organizationId: organizationId ?? undefined,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                memberships: true,
              },
            },
          },
        },
      },
    });

    if (membership) {
      context.group = {
        groupId: membership.group.id,
        groupName: membership.group.name,
        memberCount: membership.group._count.memberships,
      };
    }

    // Build context based on role
    if (user.systemRole === 'ADMIN') {
      context.admin = await this.getAdminSummary(organizationId!);
      context.visibleCards = ['admin-dashboard', 'admin-stats', 'quick-actions'];
      context.quickActions = [
        {
          id: 'manage-users',
          title: 'ניהול משתמשים',
          path: '/admin/users',
        },
        {
          id: 'manage-groups',
          title: 'ניהול קבוצות',
          path: '/admin/groups',
        },
        {
          id: 'view-payments',
          title: 'תשלומים',
          path: '/admin/payments',
        },
      ];
    } else if (isManager) {
      context.manager = await this.getManagerSummary(userId, organizationId!, managedGroups);
      context.visibleCards.push('manager-dashboard', 'group-tasks');
      context.quickActions.push(
        {
          id: 'weekly-orders',
          title: 'הזמנות שבועיות',
          path: '/manager/weekly-orders',
        },
        {
          id: 'manage-families',
          title: 'ניהול משפחות',
          path: '/manager/families',
        },
      );
    }

    if (isDistributor) {
      const deliveriesCount = await this.prisma.weeklyOrder.count({
        where: {
          groupId: distributorAssignment.groupId,
          weekKey: currentWeekKey,
        },
      });

      context.distributor = {
        currentWeek: currentWeekKey,
        assignedGroup: distributorAssignment.group.name,
        deliveriesCount,
      };
      context.visibleCards.push('distributor-notice');
      context.quickActions.push({
        id: 'view-deliveries',
        title: 'משלוחים שלי',
        path: '/distributor/current',
      });
    }

    // Standard user cards
    if (!context.visibleCards.includes('admin-dashboard')) {
      context.visibleCards.push('payment-status', 'my-group', 'notifications');
      context.quickActions.push(
        {
          id: 'my-donations',
          title: 'היסטוריית תרומות',
          path: '/my-donations',
        },
        {
          id: 'profile',
          title: 'פרופיל אישי',
          path: '/profile',
        },
      );
    }

    return context;
  }

  private async getAdminSummary(organizationId: string) {
    const [totalUsers, totalGroups, totalFamilies, currentMonthRevenue] = await Promise.all([
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
          monthKey: this.getCurrentMonthKey(),
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
    ]);

    const currentMonth = this.getCurrentMonthKey();
    const paidUsersCount = await this.prisma.payment.count({
      where: {
        organizationId,
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
    });

    const unpaidCount = totalUsers - paidUsersCount;

    return {
      totalUsers,
      totalGroups,
      totalFamilies,
      unpaidCount,
      currentMonthRevenue: Number(currentMonthRevenue._sum?.amount ?? 0),
    };
  }

  private async getManagerSummary(
    _userId: string,
    organizationId: string,
    managedGroups: Array<{ id: string; name: string }>,
  ) {
    const groupIds = managedGroups.map((g) => g.id);
    const currentMonth = this.getCurrentMonthKey();
    const currentWeekKey = this.getCurrentWeekKey();

    // Get all families for managed groups
    const totalFamilies = await this.prisma.family.count({
      where: {
        organizationId,
        groupId: { in: groupIds },
        deletedAt: null,
      },
    });

    // Get weekly orders for current week
    const completedOrders = await this.prisma.weeklyOrder.count({
      where: {
        groupId: { in: groupIds },
        weekKey: currentWeekKey,
        status: 'COMPLETED',
      },
    });

    const pendingTasks = totalFamilies - completedOrders;

    // Get member payment status (paid/unpaid count only, no amounts)
    const members = await this.prisma.groupMembership.findMany({
      where: {
        groupId: { in: groupIds },
      },
      select: { userId: true },
    });

    const memberIds = members.map((m) => m.userId);

    const paidMembers = await this.prisma.payment.count({
      where: {
        userId: { in: memberIds },
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
    });

    return {
      managedGroups: managedGroups.length,
      pendingTasks,
      membersPaid: paidMembers,
      membersUnpaid: memberIds.length - paidMembers,
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
}
