import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { CreateWeeklyOrderDto } from './dto/create-weekly-order.dto';
import { UpdateWeeklyOrderDto } from './dto/update-weekly-order.dto';
import { WeeklyOrderResponseDto } from './dto/weekly-order-response.dto';

@Injectable()
export class WeeklyOrdersService {
  private readonly logger = new Logger(WeeklyOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createWeeklyOrderDto: CreateWeeklyOrderDto,
  ): Promise<WeeklyOrderResponseDto> {
    this.logger.log(`Creating weekly order for organization ${organizationId}`);

    // Verify family exists
    const family = await this.prisma.family.findFirst({
      where: {
        id: createWeeklyOrderDto.familyId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new BadRequestException('Family not found');
    }

    const order = await this.prisma.weeklyOrder.create({
      data: {
        organizationId,
        groupId: createWeeklyOrderDto.groupId,
        familyId: createWeeklyOrderDto.familyId,
        weekKey: createWeeklyOrderDto.weekKey,
        shoppingListJson: (createWeeklyOrderDto.items ?? []) as Prisma.InputJsonValue,
        status: (createWeeklyOrderDto.status || 'DRAFT') as OrderStatus,
        notes: createWeeklyOrderDto.notes || null,
      },
    });

    return this.mapToDto(order);
  }

  async findAll(
    organizationId: string,
    weekKey?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: WeeklyOrderResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding weekly orders for organization ${organizationId}`);

    const skip = (page - 1) * limit;
    const where: Prisma.WeeklyOrderWhereInput = {
      organizationId,
      ...(weekKey && { weekKey }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.weeklyOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          weekKey: 'desc',
        },
      }),
      this.prisma.weeklyOrder.count({
        where,
      }),
    ]);

    return {
      data: orders.map((order) => this.mapToDto(order)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(organizationId: string, id: string): Promise<WeeklyOrderResponseDto> {
    this.logger.log(`Finding weekly order ${id}`);

    const order = await this.prisma.weeklyOrder.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!order) {
      throw new NotFoundException('Weekly order not found');
    }

    return this.mapToDto(order);
  }

  async update(
    organizationId: string,
    id: string,
    updateWeeklyOrderDto: UpdateWeeklyOrderDto,
  ): Promise<WeeklyOrderResponseDto> {
    this.logger.log(`Updating weekly order ${id}`);

    const order = await this.prisma.weeklyOrder.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!order) {
      throw new NotFoundException('Weekly order not found');
    }

    const updated = await this.prisma.weeklyOrder.update({
      where: { id },
      data: {
        ...(updateWeeklyOrderDto.items !== undefined && { shoppingListJson: updateWeeklyOrderDto.items as Prisma.InputJsonValue }),
        ...(updateWeeklyOrderDto.notes !== undefined && { notes: updateWeeklyOrderDto.notes }),
        ...(updateWeeklyOrderDto.status !== undefined && { status: updateWeeklyOrderDto.status as OrderStatus }),
      },
    });

    return this.mapToDto(updated);
  }

  async markCompleted(organizationId: string, id: string): Promise<WeeklyOrderResponseDto> {
    this.logger.log(`Marking weekly order ${id} as completed`);

    const order = await this.prisma.weeklyOrder.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!order) {
      throw new NotFoundException('Weekly order not found');
    }

    const updated = await this.prisma.weeklyOrder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });

    return this.mapToDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    this.logger.log(`Deleting weekly order ${id}`);

    const order = await this.prisma.weeklyOrder.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!order) {
      throw new NotFoundException('Weekly order not found');
    }

    await this.prisma.weeklyOrder.delete({
      where: { id },
    });
  }

  private mapToDto(order: Record<string, unknown>): WeeklyOrderResponseDto {
    return {
      id: order.id as string,
      organizationId: order.organizationId as string,
      groupId: order.groupId as string,
      familyId: order.familyId as string,
      weekKey: order.weekKey as string,
      items: order.shoppingListJson,
      status: order.status as string,
      notes: order.notes as string | undefined,
      createdAt: order.createdAt as Date,
      updatedAt: order.updatedAt as Date,
    };
  }
}
