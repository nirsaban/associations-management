import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { GroupResponseDto } from './dto/group-response.dto';

const MAX_MANAGERS_PER_GROUP = 2;

const groupInclude = {
  _count: { select: { memberships: true, families: true } },
  manager: { select: { fullName: true, phone: true } },
  families: { where: { deletedAt: null }, select: { familyName: true }, orderBy: { familyName: 'asc' } },
  memberships: {
    where: { role: 'MANAGER', status: 'ACTIVE' },
    include: { user: { select: { id: true, fullName: true, phone: true } } },
    orderBy: { joinedAt: 'asc' },
  },
} as const satisfies Prisma.GroupInclude;

type GroupWithCounts = Prisma.GroupGetPayload<{ include: typeof groupInclude }>;

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
    this.logger.log(`Creating group for organization ${organizationId}`);

    // Validate manager belongs to org if provided
    if (createGroupDto.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: createGroupDto.managerId, organizationId, deletedAt: null },
      });
      if (!manager) {
        throw new BadRequestException('מנהל הקבוצה לא נמצא בעמותה');
      }
    }

    const group = await this.prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          organizationId,
          name: createGroupDto.name,
          managerUserId: createGroupDto.managerId ?? null,
        },
        include: groupInclude,
      });

      if (createGroupDto.managerId) {
        await tx.groupMembership.upsert({
          where: { groupId_userId: { groupId: created.id, userId: createGroupDto.managerId } },
          update: { role: 'MANAGER', status: 'ACTIVE' },
          create: { organizationId, groupId: created.id, userId: createGroupDto.managerId, role: 'MANAGER' },
        });
      }

      // Re-read so memberships array reflects the upsert.
      return tx.group.findUniqueOrThrow({ where: { id: created.id }, include: groupInclude });
    });

    return this.mapToDto(group);
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: GroupResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding groups for organization ${organizationId}, page ${page}`);

    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 10;
    const skip = (safePage - 1) * safeLimit;

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where: { organizationId, deletedAt: null },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: groupInclude,
      }),
      this.prisma.group.count({ where: { organizationId, deletedAt: null } }),
    ]);

    return {
      data: groups.map((group) => this.mapToDto(group)),
      meta: { total, page: safePage, limit: safeLimit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<GroupResponseDto> {
    this.logger.log(`Finding group ${id} in organization ${organizationId}`);

    const group = await this.prisma.group.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: groupInclude,
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    return this.mapToDto(group);
  }

  async update(
    organizationId: string,
    id: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    this.logger.log(`Updating group ${id} in organization ${organizationId}`);

    const group = await this.prisma.group.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    const updated = await this.prisma.group.update({
      where: { id },
      data: {
        ...(updateGroupDto.name !== undefined && { name: updateGroupDto.name }),
      },
      include: groupInclude,
    });

    return this.mapToDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    this.logger.log(`Soft deleting group ${id} in organization ${organizationId}`);

    const group = await this.prisma.group.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    await this.prisma.group.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Add a manager to the group (max 2 active managers). Idempotent for already-managers.
  async assignManager(
    organizationId: string,
    groupId: string,
    assignManagerDto: AssignManagerDto,
  ): Promise<GroupResponseDto> {
    this.logger.log(
      `Adding manager ${assignManagerDto.userId} to group ${groupId}`,
    );

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: assignManagerDto.userId, organizationId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('המשתמש לא נמצא בעמותה');
    }

    const existingManagers = await this.prisma.groupMembership.findMany({
      where: { groupId, role: 'MANAGER', status: 'ACTIVE' },
      select: { userId: true },
    });
    const alreadyManager = existingManagers.some((m) => m.userId === assignManagerDto.userId);

    if (!alreadyManager && existingManagers.length >= MAX_MANAGERS_PER_GROUP) {
      throw new BadRequestException(
        `לקבוצה יכולים להיות עד ${MAX_MANAGERS_PER_GROUP} מנהלים. הסר מנהל קיים לפני הוספת חדש.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.groupMembership.upsert({
        where: { groupId_userId: { groupId, userId: assignManagerDto.userId } },
        update: { role: 'MANAGER', status: 'ACTIVE' },
        create: { organizationId, groupId, userId: assignManagerDto.userId, role: 'MANAGER' },
      });

      // Ensure the denormalized primary manager pointer is filled in.
      if (!group.managerUserId) {
        await tx.group.update({
          where: { id: groupId },
          data: { managerUserId: assignManagerDto.userId },
        });
      }

      return tx.group.findUniqueOrThrow({ where: { id: groupId }, include: groupInclude });
    });

    return this.mapToDto(updated);
  }

  // Demote a manager back to MEMBER (keeps them in the group). If they were the
  // denormalized primary, the pointer is reassigned to the remaining manager (or nulled).
  async removeManager(
    organizationId: string,
    groupId: string,
    userId: string,
  ): Promise<GroupResponseDto> {
    this.logger.log(`Removing manager ${userId} from group ${groupId}`);

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    const membership = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership || membership.role !== 'MANAGER' || membership.status !== 'ACTIVE') {
      throw new BadRequestException('המשתמש אינו מנהל פעיל של הקבוצה');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.groupMembership.update({
        where: { groupId_userId: { groupId, userId } },
        data: { role: 'MEMBER' },
      });

      if (group.managerUserId === userId) {
        const nextManager = await tx.groupMembership.findFirst({
          where: { groupId, role: 'MANAGER', status: 'ACTIVE', userId: { not: userId } },
          orderBy: { joinedAt: 'asc' },
          select: { userId: true },
        });
        await tx.group.update({
          where: { id: groupId },
          data: { managerUserId: nextManager?.userId ?? null },
        });
      }

      return tx.group.findUniqueOrThrow({ where: { id: groupId }, include: groupInclude });
    });

    return this.mapToDto(updated);
  }

  async addMember(
    organizationId: string,
    groupId: string,
    userId: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Adding member ${userId} to group ${groupId}`);

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('משתמש לא נמצא בעמותה');
    }

    await this.prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { status: 'ACTIVE' },
      create: { organizationId, groupId, userId },
    });

    return { message: 'החבר נוסף לקבוצה בהצלחה' };
  }

  async removeMember(
    organizationId: string,
    groupId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Removing member ${userId} from group ${groupId}`);

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    await this.prisma.groupMembership.updateMany({
      where: { groupId, userId, organizationId },
      data: { status: 'INACTIVE' },
    });
  }

  async getMembers(
    organizationId: string,
    groupId: string,
  ): Promise<{ data: Record<string, unknown>[] }> {
    this.logger.log(`Getting members for group ${groupId}`);

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    const members = await this.prisma.groupMembership.findMany({
      where: { organizationId, groupId, status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            systemRole: true,
          },
        },
      },
    });

    return {
      data: members.map((member) => ({
        memberId: member.id,
        joinedAt: member.joinedAt,
        role: member.role,
        ...member.user,
      })),
    };
  }

  private mapToDto(group: GroupWithCounts): GroupResponseDto {
    const managers = (group.memberships ?? [])
      .filter((m) => m.role === 'MANAGER' && m.status === 'ACTIVE' && m.user)
      .map((m) => ({
        id: m.user.id,
        fullName: m.user.fullName ?? undefined,
        phone: m.user.phone,
      }));

    // Surface the denormalized primary first so the legacy single-manager fields
    // (managerId/Name/Phone) and managers[0] stay aligned for existing consumers.
    if (group.managerUserId) {
      const idx = managers.findIndex((m) => m.id === group.managerUserId);
      if (idx > 0) {
        const [primary] = managers.splice(idx, 1);
        managers.unshift(primary);
      }
    }

    const primary = managers[0];

    return {
      id: group.id,
      organizationId: group.organizationId,
      name: group.name,
      managerId: primary?.id ?? group.managerUserId ?? undefined,
      managerName: primary?.fullName ?? group.manager?.fullName ?? undefined,
      managerPhone: primary?.phone ?? group.manager?.phone ?? undefined,
      managers,
      memberCount: group._count?.memberships,
      familyCount: group._count?.families,
      familyNames: group.families?.map((f) => f.familyName) ?? [],
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
