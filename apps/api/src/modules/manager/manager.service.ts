import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';
import { GroupDetailsDto, MemberWithStatusDto, WeeklyTaskStatusDto } from './dto';
import type { UpdateFamilyDto } from './dto';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getManagedGroup(userId: string, organizationId: string): Promise<GroupDetailsDto> {
    this.logger.log(`Getting managed group for user ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            memberships: true,
            families: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('אין לך קבוצה מנוהלת');
    }

    return {
      id: group.id,
      name: group.name,
      memberCount: group._count.memberships,
      familyCount: group._count.families,
      createdAt: group.createdAt,
    };
  }

  async getGroupMembers(
    userId: string,
    organizationId: string,
  ): Promise<{ data: MemberWithStatusDto[] }> {
    this.logger.log(`Getting group members for manager ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const currentMonth = this.getCurrentMonthKey();

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            payments: {
              where: {
                monthKey: currentMonth,
                status: 'COMPLETED',
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    const members = memberships.map((m) => ({
      id: m.user.id,
      fullName: m.user.fullName,
      phone: m.user.phone,
      email: m.user.email ?? undefined,
      isPaid: m.user.payments.length > 0,
      joinedAt: m.joinedAt,
    }));

    return { data: members };
  }

  async getGroupFamilies(
    userId: string,
    organizationId: string,
  ): Promise<{ data: Array<Record<string, unknown>> }> {
    this.logger.log(`Getting families for manager ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const families = await this.prisma.family.findMany({
      where: {
        groupId: group.id,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        familyName: true,
        address: true,
        contactPhone: true,
        childrenMinorCount: true,
        totalMemberCount: true,
        notes: true,
      },
      orderBy: {
        familyName: 'asc',
      },
    });

    return { data: families };
  }

  async getWeeklyTasks(
    userId: string,
    organizationId: string,
    weekKey?: string,
  ): Promise<{ data: WeeklyTaskStatusDto[] }> {
    this.logger.log(`Getting weekly tasks for manager ${userId}, week ${weekKey}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const week = weekKey || this.getCurrentWeekKey();

    const families = await this.prisma.family.findMany({
      where: {
        groupId: group.id,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        familyName: true,
        address: true,
        contactPhone: true,
      },
    });

    const orders = await this.prisma.weeklyOrder.findMany({
      where: {
        groupId: group.id,
        weekKey: week,
      },
    });

    const orderMap = new Map(orders.map((o) => [o.familyId, o]));

    const tasks: WeeklyTaskStatusDto[] = families.map((family) => {
      const order = orderMap.get(family.id);
      return {
        familyId: family.id,
        familyName: family.familyName,
        address: family.address ?? undefined,
        contactPhone: family.contactPhone ?? undefined,
        hasOrder: !!order,
        orderStatus: order?.status,
        orderId: order?.id,
      };
    });

    return { data: tasks };
  }

  async createWeeklyOrder(
    userId: string,
    organizationId: string,
    familyId: string,
    weekKey: string,
    items?: unknown[],
    notes?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Creating weekly order for family ${familyId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        groupId: group.id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new ForbiddenException('המשפחה אינה שייכת לקבוצה שלך');
    }

    const existing = await this.prisma.weeklyOrder.findUnique({
      where: {
        familyId_weekKey: {
          familyId,
          weekKey,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('כבר קיימת הזמנה למשפחה זו השבוע');
    }

    const order = await this.prisma.weeklyOrder.create({
      data: {
        organizationId,
        groupId: group.id,
        familyId,
        weekKey,
        shoppingListJson: (items ?? []) as Prisma.InputJsonValue,
        notes: notes ?? null,
        status: 'DRAFT',
        createdByUserId: userId,
      },
    });

    return { data: order };
  }

  async updateWeeklyOrder(
    userId: string,
    organizationId: string,
    orderId: string,
    items?: unknown[],
    notes?: string,
    status?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Updating weekly order ${orderId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const order = await this.prisma.weeklyOrder.findFirst({
      where: {
        id: orderId,
        groupId: group.id,
        organizationId,
      },
    });

    if (!order) {
      throw new NotFoundException('הזמנה לא נמצאה או אינה שייכת לקבוצה שלך');
    }

    const updated = await this.prisma.weeklyOrder.update({
      where: { id: orderId },
      data: {
        ...(items !== undefined && { shoppingListJson: items as Prisma.InputJsonValue }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status: status as OrderStatus }),
      },
    });

    return { data: updated };
  }

  async assignWeeklyDistributor(
    userId: string,
    organizationId: string,
    assigneeUserId: string,
    weekKey: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Assigning weekly distributor: ${assigneeUserId} for week ${weekKey}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        groupId: group.id,
        userId: assigneeUserId,
        organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException('המשתמש אינו חבר בקבוצה');
    }

    const assignment = await this.prisma.weeklyDistributorAssignment.upsert({
      where: {
        groupId_weekKey: {
          groupId: group.id,
          weekKey,
        },
      },
      update: {
        assignedUserId: assigneeUserId,
        assignedByUserId: userId,
      },
      create: {
        organizationId,
        groupId: group.id,
        assignedUserId: assigneeUserId,
        assignedByUserId: userId,
        weekKey,
      },
    });

    return { data: assignment };
  }

  // ─── New endpoints ──────────────────────────────────────────────────────────

  async getWeeklyStatus(
    userId: string,
    organizationId: string,
    weekKey?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting weekly status for manager ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const week = weekKey || this.getCurrentWeekKey();
    const weekStart = this.weekKeyToMondayIso(week);

    // Families in the group
    const families = await this.prisma.family.findMany({
      where: {
        groupId: group.id,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        familyName: true,
        contactPhone: true,
      },
      orderBy: { familyName: 'asc' },
    });

    // Orders for this week
    const orders = await this.prisma.weeklyOrder.findMany({
      where: {
        groupId: group.id,
        weekKey: week,
        organizationId,
      },
      select: { id: true, familyId: true },
    });
    const orderByFamilyId = new Map(orders.map((o) => [o.familyId, o.id]));

    const familiesStatus = families.map((f) => {
      const orderId = orderByFamilyId.get(f.id);
      return {
        id: f.id,
        familyName: f.familyName,
        contactPhone: f.contactPhone ?? null,
        hasOrder: orderByFamilyId.has(f.id),
        orderId: orderId ?? null,
      };
    });

    const ordersFilledCount = orders.length;
    const ordersTotalCount = families.length;
    const ordersAllFilled = ordersTotalCount > 0 && ordersFilledCount === ordersTotalCount;

    // Current week distributor
    const currentDistributor = await this.prisma.weeklyDistributorAssignment.findUnique({
      where: {
        groupId_weekKey: {
          groupId: group.id,
          weekKey: week,
        },
      },
      include: {
        assignedUser: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });

    const distributor = currentDistributor
      ? {
          assigned: true,
          userId: currentDistributor.assignedUser.id,
          fullName: currentDistributor.assignedUser.fullName,
          phone: currentDistributor.assignedUser.phone,
        }
      : { assigned: false };

    // Last 3 distributors before this week (ordered descending by weekKey)
    const pastDistributors = await this.prisma.weeklyDistributorAssignment.findMany({
      where: {
        groupId: group.id,
        organizationId,
        weekKey: { lt: week },
      },
      orderBy: { weekKey: 'desc' },
      take: 3,
      include: {
        assignedUser: {
          select: { id: true, fullName: true },
        },
      },
    });

    const lastThreeDistributors = pastDistributors.map((d) => ({
      weekStart: this.weekKeyToMondayIso(d.weekKey),
      userId: d.assignedUser.id,
      fullName: d.assignedUser.fullName,
    }));

    return {
      data: {
        weekStart,
        families: familiesStatus,
        ordersFilledCount,
        ordersTotalCount,
        ordersAllFilled,
        distributor,
        lastThreeDistributors,
      },
    };
  }

  async updateFamily(
    userId: string,
    organizationId: string,
    familyId: string,
    dto: UpdateFamilyDto,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Updating family ${familyId} by manager ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        groupId: group.id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה או אינה שייכת לקבוצה שלך');
    }

    // Cross-field validation: childrenMinorCount <= totalMemberCount
    const minorCount =
      dto.childrenMinorCount !== undefined ? dto.childrenMinorCount : family.childrenMinorCount;
    const totalCount =
      dto.totalMemberCount !== undefined ? dto.totalMemberCount : family.totalMemberCount;

    if (
      minorCount !== null &&
      minorCount !== undefined &&
      totalCount !== null &&
      totalCount !== undefined &&
      minorCount > totalCount
    ) {
      throw new BadRequestException('מספר הקטינים לא יכול לעלות על סך חברי המשפחה');
    }

    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: {
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
        ...(dto.childrenMinorCount !== undefined && { childrenMinorCount: dto.childrenMinorCount }),
        ...(dto.totalMemberCount !== undefined && { totalMemberCount: dto.totalMemberCount }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return { data: updated };
  }

  async getFamilyWeeklyOrder(
    userId: string,
    organizationId: string,
    familyId: string,
    weekKey?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting weekly order for family ${familyId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        groupId: group.id,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        familyName: true,
        contactPhone: true,
      },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה או אינה שייכת לקבוצה שלך');
    }

    const week = weekKey || this.getCurrentWeekKey();

    const order = await this.prisma.weeklyOrder.findUnique({
      where: {
        familyId_weekKey: {
          familyId,
          weekKey: week,
        },
      },
    });

    if (!order) {
      return {
        data: {
          exists: false,
          family: {
            id: family.id,
            familyName: family.familyName,
            contactPhone: family.contactPhone ?? null,
          },
        },
      };
    }

    return {
      data: {
        exists: true,
        family: {
          id: family.id,
          familyName: family.familyName,
          contactPhone: family.contactPhone ?? null,
        },
        order: {
          id: order.id,
          weekKey: order.weekKey,
          shoppingListJson: order.shoppingListJson,
          notes: order.notes,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
    };
  }

  async upsertFamilyWeeklyOrder(
    userId: string,
    organizationId: string,
    familyId: string,
    content: string,
    weekKey?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Upserting weekly order for family ${familyId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        groupId: group.id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה או אינה שייכת לקבוצה שלך');
    }

    const week = weekKey || this.getCurrentWeekKey();
    const shoppingListJson: Prisma.InputJsonValue = { text: content };

    const order = await this.prisma.weeklyOrder.upsert({
      where: {
        familyId_weekKey: {
          familyId,
          weekKey: week,
        },
      },
      update: {
        shoppingListJson,
        status: 'COMPLETED',
        createdByUserId: userId,
      },
      create: {
        organizationId,
        groupId: group.id,
        familyId,
        weekKey: week,
        shoppingListJson,
        status: 'COMPLETED',
        createdByUserId: userId,
      },
    });

    return { data: order };
  }

  async getMembersWithPaymentStatus(
    userId: string,
    organizationId: string,
  ): Promise<{ data: Array<Record<string, unknown>> }> {
    this.logger.log(`Getting members with payment status for manager ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    const currentMonth = this.getCurrentMonthKey();

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            payments: {
              where: {
                monthKey: currentMonth,
                status: 'COMPLETED',
              },
              select: {
                id: true,
                paymentDate: true,
              },
              orderBy: { paymentDate: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    // isDonor = true for all members (per domain: group members are donors)
    const members = memberships.map((m) => {
      const paid = m.user.payments.length > 0;
      return {
        userId: m.user.id,
        fullName: m.user.fullName,
        phone: m.user.phone,
        isDonor: true,
        paidThisMonth: paid,
        currentMonthPaymentDate: paid
          ? (m.user.payments[0].paymentDate?.toISOString() ?? null)
          : null,
      };
    });

    // Sort: unpaid first, then by name
    members.sort((a, b) => {
      if (a.paidThisMonth !== b.paidThisMonth) {
        return a.paidThisMonth ? 1 : -1;
      }
      return a.fullName.localeCompare(b.fullName, 'he');
    });

    return { data: members };
  }

  async getDistributorWorkload(
    userId: string,
    organizationId: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting distributor workload for manager ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    // Compute the weekKey from 52 weeks ago
    const fiftyTwoWeeksAgo = this.weekKeyNWeeksAgo(52);

    // Get all memberships for user data
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Get distributor assignments for the last 52 weeks
    const assignments = await this.prisma.weeklyDistributorAssignment.findMany({
      where: {
        groupId: group.id,
        organizationId,
        weekKey: { gte: fiftyTwoWeeksAgo },
      },
      select: {
        assignedUserId: true,
        weekKey: true,
      },
      orderBy: { weekKey: 'desc' },
    });

    // Aggregate per user
    const countMap = new Map<string, { count: number; lastWeekKey: string | null }>();
    for (const a of assignments) {
      const existing = countMap.get(a.assignedUserId);
      if (!existing) {
        countMap.set(a.assignedUserId, { count: 1, lastWeekKey: a.weekKey });
      } else {
        // Assignments are desc ordered, first seen is the most recent
        existing.count += 1;
      }
    }

    const members = memberships.map((m) => {
      const stats = countMap.get(m.user.id);
      return {
        userId: m.user.id,
        fullName: m.user.fullName,
        timesAsDistributor: stats?.count ?? 0,
        lastAsDistributor: stats?.lastWeekKey ?? null,
      };
    });

    // Highest and lowest by timesAsDistributor (exclude ties by first found)
    const sorted = [...members].sort((a, b) => b.timesAsDistributor - a.timesAsDistributor);
    const highest = sorted[0] ?? null;
    const lowest = sorted[sorted.length - 1] ?? null;

    return {
      data: {
        members,
        highest: highest
          ? {
              userId: highest.userId,
              fullName: highest.fullName,
              timesAsDistributor: highest.timesAsDistributor,
            }
          : null,
        lowest: lowest
          ? {
              userId: lowest.userId,
              fullName: lowest.fullName,
              timesAsDistributor: lowest.timesAsDistributor,
            }
          : null,
      },
    };
  }

  async getGroupRevenue(
    userId: string,
    organizationId: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting group revenue for manager ${userId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        managerUserId: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new ForbiddenException('אינך מנהל קבוצה');
    }

    // Get all member user IDs in the group
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        organizationId,
      },
      select: { userId: true },
    });

    const memberUserIds = memberships.map((m) => m.userId);

    if (memberUserIds.length === 0) {
      return {
        data: {
          thisMonth: { amount: 0, currency: 'ILS', paidCount: 0, unpaidCount: 0 },
          thisYear: {
            amount: 0,
            byMonth: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 })),
          },
        },
      };
    }

    const currentMonth = this.getCurrentMonthKey();
    const currentYear = new Date().getFullYear();
    const yearPrefix = `${currentYear}-`;

    // This month: completed payments by group members
    const thisMonthPayments = await this.prisma.payment.findMany({
      where: {
        organizationId,
        userId: { in: memberUserIds },
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
      select: {
        amount: true,
      },
    });

    // Total members for unpaidCount: total members minus those who paid
    const paidUserIdsThisMonth = await this.prisma.payment.findMany({
      where: {
        organizationId,
        userId: { in: memberUserIds },
        monthKey: currentMonth,
        status: 'COMPLETED',
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const paidCount = paidUserIdsThisMonth.length;
    const unpaidCount = memberUserIds.length - paidCount;
    const thisMonthAmount = thisMonthPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // This year: completed payments by month
    const thisYearPayments = await this.prisma.payment.findMany({
      where: {
        organizationId,
        userId: { in: memberUserIds },
        monthKey: { startsWith: yearPrefix },
        status: 'COMPLETED',
      },
      select: {
        amount: true,
        monthKey: true,
      },
    });

    // Aggregate by month number (1-12)
    const byMonthMap = new Map<number, number>();
    for (const p of thisYearPayments) {
      const monthNum = parseInt(p.monthKey.split('-')[1], 10);
      byMonthMap.set(monthNum, (byMonthMap.get(monthNum) ?? 0) + Number(p.amount));
    }

    const byMonth = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: byMonthMap.get(i + 1) ?? 0,
    }));

    const thisYearTotal = thisYearPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      data: {
        thisMonth: {
          amount: thisMonthAmount,
          currency: 'ILS',
          paidCount,
          unpaidCount,
        },
        thisYear: {
          amount: thisYearTotal,
          byMonth,
        },
      },
    };
  }

  async getDonationInfo(
    organizationId: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting donation info for org ${organizationId}`);

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        logoUrl: true,
        paymentLink: true,
        defaultPaymentLink: true,
        paymentDescription: true,
      },
    });

    if (!org) {
      throw new NotFoundException('עמותה לא נמצאה');
    }

    return {
      data: {
        paymentLink: org.paymentLink || org.defaultPaymentLink || null,
        paymentDescription: org.paymentDescription ?? null,
        organizationName: org.name,
        organizationLogoUrl: org.logoUrl ?? null,
      },
    };
  }

  async getMyPaymentsWithStatus(
    organizationId: string,
    userId: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting payments with status for user ${userId}`);

    const currentMonth = this.getCurrentMonthKey();

    const [payments, monthlyStatus] = await Promise.all([
      this.prisma.payment.findMany({
        where: { organizationId, userId },
        orderBy: { monthKey: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          monthKey: true,
          paymentDate: true,
          source: true,
          externalTransactionId: true,
          status: true,
        },
      }),
      this.prisma.monthlyPaymentStatus.findUnique({
        where: { userId_monthKey: { userId, monthKey: currentMonth } },
      }),
    ]);

    const isCurrentMonthPaid = monthlyStatus?.isPaid ?? false;
    const currentMonthPaymentDate = monthlyStatus?.paidAt?.toISOString() ?? null;

    return {
      data: {
        isCurrentMonthPaid,
        currentMonthPaymentDate,
        history: payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          monthKey: p.monthKey,
          paidAt: p.paymentDate?.toISOString() ?? null,
          method: p.source ?? null,
          reference: p.externalTransactionId ?? null,
          status: p.status,
        })),
      },
    };
  }

  // ─── User experience endpoints ───────────────────────────────────────────────

  async getMyWeeklyDistribution(
    userId: string,
    organizationId: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting weekly distribution context for user ${userId}`);

    const weekKey = this.getCurrentWeekKey();

    const assignment = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        assignedUserId: userId,
        weekKey,
        organizationId,
      },
      include: {
        group: {
          select: { id: true, name: true },
        },
      },
    });

    if (!assignment) {
      return { data: { isDistributor: false } };
    }

    const families = await this.prisma.family.findMany({
      where: {
        groupId: assignment.groupId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        familyName: true,
        contactPhone: true,
        address: true,
      },
      orderBy: { familyName: 'asc' },
    });

    const familyIds = families.map((f) => f.id);

    const [deliveries, orders] = await Promise.all([
      this.prisma.weeklyFamilyDelivery.findMany({
        where: {
          weeklyDistributorAssignmentId: assignment.id,
          familyId: { in: familyIds },
          organizationId,
        },
        select: {
          familyId: true,
          delivered: true,
          deliveredAt: true,
        },
      }),
      this.prisma.weeklyOrder.findMany({
        where: {
          familyId: { in: familyIds },
          weekKey,
          organizationId,
        },
        select: {
          familyId: true,
          shoppingListJson: true,
        },
      }),
    ]);

    const deliveryMap = new Map(deliveries.map((d) => [d.familyId, d]));
    const orderMap = new Map(orders.map((o) => [o.familyId, o]));

    const familiesWithStatus = families.map((family) => {
      const delivery = deliveryMap.get(family.id);
      const order = orderMap.get(family.id);

      let weeklyOrderContent: string | null = null;
      if (order?.shoppingListJson != null) {
        const json = order.shoppingListJson as Record<string, unknown>;
        if (typeof json === 'object' && !Array.isArray(json) && typeof json['text'] === 'string') {
          weeklyOrderContent = json['text'];
        } else if (Array.isArray(json)) {
          weeklyOrderContent = JSON.stringify(json);
        }
      }

      return {
        id: family.id,
        name: family.familyName,
        contactPhone: family.contactPhone ?? null,
        address: family.address ?? null,
        weeklyOrderContent,
        delivered: delivery?.delivered ?? false,
        deliveredAt: delivery?.deliveredAt?.toISOString() ?? null,
      };
    });

    const deliveredCount = familiesWithStatus.filter((f) => f.delivered).length;

    return {
      data: {
        isDistributor: true,
        assignmentId: assignment.id,
        weekStart: this.weekKeyToMondayIso(weekKey),
        groupName: assignment.group.name,
        families: familiesWithStatus,
        totalCount: families.length,
        deliveredCount,
      },
    };
  }

  async markFamilyDelivery(
    userId: string,
    organizationId: string,
    familyId: string,
    delivered: boolean,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Marking delivery for family ${familyId} by user ${userId}`);

    const weekKey = this.getCurrentWeekKey();

    const assignment = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        assignedUserId: userId,
        weekKey,
        organizationId,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('אינך המחלק השבועי');
    }

    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        groupId: assignment.groupId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה בקבוצה');
    }

    const deliveryRecord = await this.prisma.weeklyFamilyDelivery.upsert({
      where: {
        weeklyDistributorAssignmentId_familyId: {
          weeklyDistributorAssignmentId: assignment.id,
          familyId,
        },
      },
      create: {
        organizationId,
        weeklyDistributorAssignmentId: assignment.id,
        familyId,
        delivered,
        deliveredAt: delivered ? new Date() : null,
        markedByUserId: userId,
      },
      update: {
        delivered,
        deliveredAt: delivered ? new Date() : null,
        markedByUserId: userId,
      },
    });

    return {
      data: {
        id: deliveryRecord.id,
        familyId: deliveryRecord.familyId,
        delivered: deliveryRecord.delivered,
        deliveredAt: deliveryRecord.deliveredAt?.toISOString() ?? null,
      },
    };
  }

  async getMyGroupView(
    userId: string,
    organizationId: string,
  ): Promise<{ data: Record<string, unknown> }> {
    this.logger.log(`Getting group view for user ${userId}`);

    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('אינך חבר בקבוצה');
    }

    const groupId = membership.groupId;

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    const currentMonth = this.getCurrentMonthKey();
    const weekKey = this.getCurrentWeekKey();

    const [allMemberships, distributorAssignment, families] = await Promise.all([
      this.prisma.groupMembership.findMany({
        where: {
          groupId,
          organizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              payments: {
                where: {
                  monthKey: currentMonth,
                  status: 'COMPLETED',
                  organizationId,
                },
                select: { id: true },
              },
            },
          },
        },
        orderBy: { user: { fullName: 'asc' } },
      }),
      this.prisma.weeklyDistributorAssignment.findUnique({
        where: {
          groupId_weekKey: { groupId, weekKey },
        },
        include: {
          assignedUser: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      }),
      this.prisma.family.findMany({
        where: {
          groupId,
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          familyName: true,
          contactPhone: true,
          address: true,
          childrenMinorCount: true,
          totalMemberCount: true,
          notes: true,
        },
        orderBy: { familyName: 'asc' },
      }),
    ]);

    const members = allMemberships.map((m) => ({
      userId: m.user.id,
      fullName: m.user.fullName,
      paidThisMonth: m.user.payments.length > 0,
    }));

    const currentDistributor = distributorAssignment
      ? {
          userId: distributorAssignment.assignedUser.id,
          fullName: distributorAssignment.assignedUser.fullName,
          phone: distributorAssignment.assignedUser.phone,
        }
      : null;

    const familiesView = families.map((f) => ({
      id: f.id,
      name: f.familyName,
      contactPhone: f.contactPhone ?? null,
      address: f.address ?? null,
      childrenMinorCount: f.childrenMinorCount ?? null,
      totalMemberCount: f.totalMemberCount ?? null,
      notes: f.notes ?? null,
    }));

    return {
      data: {
        group: { id: group.id, name: group.name },
        members,
        currentDistributor,
        families: familiesView,
      },
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getCurrentWeekKey(): string {
    const now = new Date();
    return this.dateToWeekKey(now);
  }

  private dateToWeekKey(date: Date): string {
    // ISO 8601 week: Thursday determines the year.
    // We use a simple approach matching the existing style in the codebase.
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
    );
    return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  private weekKeyToMondayIso(weekKey: string): string {
    // Parse "YYYY-WNN" and return the ISO string for the Monday of that week.
    const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
      return weekKey; // Fallback: return as-is if format unknown
    }
    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);

    // Jan 1 of year
    const jan1 = new Date(year, 0, 1);
    // Day of week for Jan 1 (0=Sun, 1=Mon, ...)
    const jan1Day = jan1.getDay();
    // Days to the first Monday: if jan1 is Mon(1) -> 0 days, Tue(2) -> 6 days, etc.
    const daysToFirstMonday = jan1Day === 0 ? 1 : jan1Day === 1 ? 0 : 8 - jan1Day;
    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
    // Add (week - 1) * 7 days
    const monday = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000);
    return monday.toISOString().split('T')[0];
  }

  private weekKeyNWeeksAgo(n: number): string {
    const now = new Date();
    const past = new Date(now.getTime() - n * 7 * 86400000);
    return this.dateToWeekKey(past);
  }
}
