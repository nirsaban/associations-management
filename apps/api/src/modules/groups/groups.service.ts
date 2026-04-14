import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { GroupResponseDto } from './dto/group-response.dto';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, createGroupDto: CreateGroupDto): Promise<GroupResponseDto> {
    this.logger.log(`Creating group for organization ${organizationId}`);

    const group = await this.prisma.group.create({
      data: {
        organizationId,
        name: createGroupDto.name,
        managerId: createGroupDto.managerId,
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

    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.group.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: groups.map((group) => this.mapToDto(group)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(organizationId: string, id: string): Promise<GroupResponseDto> {
    this.logger.log(`Finding group ${id} in organization ${organizationId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
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
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const updated = await this.prisma.group.update({
      where: { id },
      data: updateGroupDto,
    });

    return this.mapToDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    this.logger.log(`Soft deleting group ${id} in organization ${organizationId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
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
      where: {
        id: groupId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Verify user exists in organization
    const user = await this.prisma.user.findFirst({
      where: {
        id: assignManagerDto.userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found in organization');
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        managerId: assignManagerDto.userId,
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
      where: {
        id: groupId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.groupMembership.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        organizationId,
        groupId,
        userId,
      },
    });

    return { message: 'Member added successfully' };
  }

  async removeMember(
    organizationId: string,
    groupId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Removing member ${userId} from group ${groupId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.groupMembership.updateMany({
      where: {
        groupId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getMembers(
    organizationId: string,
    groupId: string,
  ): Promise<{ data: Record<string, unknown>[] }> {
    this.logger.log(`Getting members for group ${groupId}`);

    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const members = await this.prisma.groupMembership.findMany({
      where: {
        organizationId,
        groupId,
        deletedAt: null,
      },
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
        ...member.user,
      })),
    };
  }

  private mapToDto(group: Record<string, unknown>): GroupResponseDto {
    return {
      id: group.id as string,
      organizationId: group.organizationId as string,
      name: group.name as string,
      managerId: group.managerId as string | undefined,
      createdAt: group.createdAt as Date,
      updatedAt: group.updatedAt as Date,
    };
  }
}
