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

type GroupWithCounts = Prisma.GroupGetPayload<{
  include: {
    _count: { select: { memberships: true; families: true } };
    manager: { select: { fullName: true; phone: true } };
  };
}>;

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

    const group = await this.prisma.group.create({
      data: {
        organizationId,
        name: createGroupDto.name,
        managerUserId: createGroupDto.managerId ?? null,
      },
      include: {
        _count: { select: { memberships: true, families: true } },
        manager: { select: { fullName: true, phone: true } },
      },
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
        include: {
          _count: { select: { memberships: true, families: true } },
          manager: { select: { fullName: true, phone: true } },
        },
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
      include: {
        _count: { select: { memberships: true, families: true } },
        manager: { select: { fullName: true, phone: true } },
      },
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

    // Validate new manager belongs to org if changing manager
    if (updateGroupDto.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: updateGroupDto.managerId, organizationId, deletedAt: null },
      });
      if (!manager) {
        throw new BadRequestException('מנהל הקבוצה לא נמצא בעמותה');
      }
    }

    const updated = await this.prisma.group.update({
      where: { id },
      data: {
        ...(updateGroupDto.name !== undefined && { name: updateGroupDto.name }),
        ...(updateGroupDto.managerId !== undefined && { managerUserId: updateGroupDto.managerId }),
      },
      include: {
        _count: { select: { memberships: true, families: true } },
        manager: { select: { fullName: true, phone: true } },
      },
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

  async assignManager(
    organizationId: string,
    groupId: string,
    assignManagerDto: AssignManagerDto,
  ): Promise<GroupResponseDto> {
    this.logger.log(
      `Assigning manager ${assignManagerDto.userId} to group ${groupId}`,
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

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { managerUserId: assignManagerDto.userId },
      include: {
        _count: { select: { memberships: true, families: true } },
        manager: { select: { fullName: true, phone: true } },
      },
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
        ...member.user,
      })),
    };
  }

  private mapToDto(group: GroupWithCounts | Record<string, unknown>): GroupResponseDto {
    const g = group as GroupWithCounts;
    return {
      id: g.id,
      organizationId: g.organizationId,
      name: g.name,
      managerId: g.managerUserId ?? undefined,
      managerName: g.manager?.fullName ?? undefined,
      managerPhone: g.manager?.phone ?? undefined,
      memberCount: g._count?.memberships,
      familyCount: g._count?.families,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }
}
