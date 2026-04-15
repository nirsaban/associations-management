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

    // Verify user is manager of a group
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

    // Get all members with payment status (paid/unpaid only, NO amounts)
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

    // Get all families in the group
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

    // Get orders for this week
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

    // Verify user is manager
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

    // Verify family belongs to manager's group
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

    // Check if order already exists (unique per familyId + weekKey)
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

    // Verify user is manager
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

    // Verify order belongs to manager's group
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

    // Verify user is manager
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

    // Verify assignee is a member of the group
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

    // Upsert distributor assignment
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
