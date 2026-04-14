import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyResponseDto } from './dto/family-response.dto';

@Injectable()
export class FamiliesService {
  private readonly logger = new Logger(FamiliesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, createFamilyDto: CreateFamilyDto): Promise<FamilyResponseDto> {
    this.logger.log(`Creating family for organization ${organizationId}`);

    const family = await this.prisma.family.create({
      data: {
        organizationId,
        familyName: createFamilyDto.familyName,
        contactPhone: createFamilyDto.contactPhone,
        address: createFamilyDto.address || null,
        notes: createFamilyDto.notes || null,
      },
    });

    return this.mapToDto(family);
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: FamilyResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding families for organization ${organizationId}, page ${page}`);

    const skip = (page - 1) * limit;

    const [families, total] = await Promise.all([
      this.prisma.family.findMany({
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
      this.prisma.family.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: families.map((family) => this.mapToDto(family)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(organizationId: string, id: string): Promise<FamilyResponseDto> {
    this.logger.log(`Finding family ${id} in organization ${organizationId}`);

    const family = await this.prisma.family.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return this.mapToDto(family);
  }

  async update(
    organizationId: string,
    id: string,
    updateFamilyDto: UpdateFamilyDto,
  ): Promise<FamilyResponseDto> {
    this.logger.log(`Updating family ${id} in organization ${organizationId}`);

    const family = await this.prisma.family.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const updated = await this.prisma.family.update({
      where: { id },
      data: updateFamilyDto,
    });

    return this.mapToDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    this.logger.log(`Soft deleting family ${id} in organization ${organizationId}`);

    const family = await this.prisma.family.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    await this.prisma.family.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async linkToGroup(organizationId: string, familyId: string, groupId: string): Promise<FamilyResponseDto> {
    this.logger.log(`Linking family ${familyId} to group ${groupId}`);

    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new BadRequestException('Group not found');
    }

    await this.prisma.groupFamily.upsert({
      where: {
        groupId_familyId: {
          groupId,
          familyId,
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        organizationId,
        groupId,
        familyId,
      },
    });

    return this.mapToDto(family);
  }

  async unlinkFromGroup(organizationId: string, familyId: string, groupId: string): Promise<FamilyResponseDto> {
    this.logger.log(`Unlinking family ${familyId} from group ${groupId}`);

    const family = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    await this.prisma.groupFamily.updateMany({
      where: {
        groupId,
        familyId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return this.mapToDto(family);
  }

  private mapToDto(family: Record<string, unknown>): FamilyResponseDto {
    return {
      id: family.id as string,
      organizationId: family.organizationId as string,
      familyName: family.familyName as string,
      contactPhone: family.contactPhone as string,
      address: family.address as string | undefined,
      notes: family.notes as string | undefined,
      createdAt: family.createdAt as Date,
      updatedAt: family.updatedAt as Date,
    };
  }
}
