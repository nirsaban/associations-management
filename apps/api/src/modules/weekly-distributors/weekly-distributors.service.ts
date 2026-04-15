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
    const weekKey = assignDistributorDto.weekKey || this.getCurrentWeekKey();

    this.logger.log(
      `Assigning distributor ${assignDistributorDto.userId} to group ${groupId} for week ${weekKey}`,
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
      },
    });

    if (!groupMembership) {
      throw new BadRequestException('User is not a member of this group');
    }

    // Create or update distributor assignment
    const distributor = await this.prisma.weeklyDistributorAssignment.upsert({
      where: {
        groupId_weekKey: {
          groupId,
          weekKey,
        },
      },
      update: {
        assignedUserId: assignDistributorDto.userId,
      },
      create: {
        organizationId,
        groupId,
        assignedUserId: assignDistributorDto.userId,
        weekKey,
      },
    });

    return this.mapToDto(distributor);
  }

  async getCurrentDistributor(
    organizationId: string,
    groupId: string,
    weekKey?: string,
  ): Promise<DistributorResponseDto | null> {
    const week = weekKey || this.getCurrentWeekKey();
    this.logger.log(`Getting current distributor for group ${groupId}, week ${week}`);

    const distributor = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        organizationId,
        groupId,
        weekKey: week,
      },
    });

    return distributor ? this.mapToDto(distributor) : null;
  }

  async getDistributorsForWeek(
    organizationId: string,
    weekKey: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: DistributorResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Getting distributors for week ${weekKey}`);

    const skip = (page - 1) * limit;

    const [distributors, total] = await Promise.all([
      this.prisma.weeklyDistributorAssignment.findMany({
        where: {
          organizationId,
          weekKey,
        },
        skip,
        take: limit,
      }),
      this.prisma.weeklyDistributorAssignment.count({
        where: {
          organizationId,
          weekKey,
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

  async removeDistributor(organizationId: string, groupId: string, weekKey: string): Promise<void> {
    this.logger.log(`Removing distributor from group ${groupId} for week ${weekKey}`);

    const distributor = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        organizationId,
        groupId,
        weekKey,
      },
    });

    if (!distributor) {
      throw new NotFoundException('Distributor assignment not found');
    }

    await this.prisma.weeklyDistributorAssignment.delete({
      where: { id: distributor.id },
    });
  }

  private getCurrentWeekKey(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  private mapToDto(distributor: Record<string, unknown>): DistributorResponseDto {
    return {
      id: distributor.id as string,
      organizationId: distributor.organizationId as string,
      groupId: distributor.groupId as string,
      userId: (distributor.assignedUserId as string),
      weekKey: distributor.weekKey as string,
      createdAt: distributor.createdAt as Date,
      updatedAt: distributor.updatedAt as Date,
    };
  }
}
