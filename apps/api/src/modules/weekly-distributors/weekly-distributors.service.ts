import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { AssignDistributorDto } from './dto/assign-distributor.dto';
import { DistributorResponseDto } from './dto/distributor-response.dto';

@Injectable()
export class WeeklyDistributorsService {
  private readonly logger = new Logger(WeeklyDistributorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async assignDistributor(
    organizationId: string,
    groupId: string,
    assignDistributorDto: AssignDistributorDto,
  ): Promise<DistributorResponseDto> {
    this.logger.log(
      `Assigning distributor ${assignDistributorDto.userId} to group ${groupId} for week ${assignDistributorDto.weekStart}`,
    );

    // Verify group exists
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

    // Verify user exists and is a member of the group
    const user = await this.prisma.user.findFirst({
      where: {
        id: assignDistributorDto.userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const groupMembership = await this.prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: assignDistributorDto.userId,
        deletedAt: null,
      },
    });

    if (!groupMembership) {
      throw new BadRequestException('User is not a member of this group');
    }

    // Create or update distributor assignment
    const distributor = await this.prisma.weeklyDistributor.upsert({
      where: {
        groupId_weekStart: {
          groupId,
          weekStart: assignDistributorDto.weekStart,
        },
      },
      update: {
        userId: assignDistributorDto.userId,
      },
      create: {
        organizationId,
        groupId,
        userId: assignDistributorDto.userId,
        weekStart: assignDistributorDto.weekStart,
      },
    });

    return this.mapToDto(distributor);
  }

  async getCurrentDistributor(
    organizationId: string,
    groupId: string,
    weekStart?: Date,
  ): Promise<DistributorResponseDto | null> {
    this.logger.log(`Getting current distributor for group ${groupId}, week ${weekStart}`);

    // If no week specified, use current week
    const week = weekStart || this.getCurrentWeekDate();

    const distributor = await this.prisma.weeklyDistributor.findFirst({
      where: {
        organizationId,
        groupId,
        weekStart: week,
        deletedAt: null,
      },
    });

    return distributor ? this.mapToDto(distributor) : null;
  }

  async getDistributorsForWeek(
    organizationId: string,
    weekStart: Date,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: DistributorResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Getting distributors for week ${weekStart}`);

    const skip = (page - 1) * limit;

    const [distributors, total] = await Promise.all([
      this.prisma.weeklyDistributor.findMany({
        where: {
          organizationId,
          weekStart,
          deletedAt: null,
        },
        skip,
        take: limit,
      }),
      this.prisma.weeklyDistributor.count({
        where: {
          organizationId,
          weekStart,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: distributors.map((d) => this.mapToDto(d)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async removeDistributor(organizationId: string, groupId: string, weekStart: Date): Promise<void> {
    this.logger.log(`Removing distributor from group ${groupId} for week ${weekStart}`);

    const distributor = await this.prisma.weeklyDistributor.findFirst({
      where: {
        organizationId,
        groupId,
        weekStart,
        deletedAt: null,
      },
    });

    if (!distributor) {
      throw new NotFoundException('Distributor assignment not found');
    }

    await this.prisma.weeklyDistributor.update({
      where: { id: distributor.id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private getCurrentWeekDate(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private mapToDto(distributor: Record<string, unknown>): DistributorResponseDto {
    return {
      id: distributor.id as string,
      organizationId: distributor.organizationId as string,
      groupId: distributor.groupId as string,
      userId: distributor.userId as string,
      weekStart: distributor.weekStart as Date,
      createdAt: distributor.createdAt as Date,
      updatedAt: distributor.updatedAt as Date,
    };
  }
}
