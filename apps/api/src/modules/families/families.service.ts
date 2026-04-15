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

    // Validate groupId belongs to org if provided
    if (createFamilyDto.groupId) {
      const group = await this.prisma.group.findFirst({
        where: { id: createFamilyDto.groupId, organizationId, deletedAt: null },
      });
      if (!group) {
        throw new BadRequestException('הקבוצה לא נמצאה בעמותה');
      }
    }

    const family = await this.prisma.family.create({
      data: {
        organizationId,
        familyName: createFamilyDto.familyName,
        contactPhone: createFamilyDto.contactPhone ?? null,
        address: createFamilyDto.address ?? null,
        notes: createFamilyDto.notes ?? null,
        groupId: createFamilyDto.groupId ?? null,
      },
    });

    return this.mapToDto(family);
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
    groupId?: string,
  ): Promise<{ data: FamilyResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding families for organization ${organizationId}, page ${page}`);

    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      deletedAt: null,
      ...(groupId ? { groupId } : {}),
    };

    const [families, total] = await Promise.all([
      this.prisma.family.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.family.count({ where }),
    ]);

    return {
      data: families.map((family) => this.mapToDto(family)),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async findOne(organizationId: string, id: string): Promise<FamilyResponseDto> {
    this.logger.log(`Finding family ${id} in organization ${organizationId}`);

    const family = await this.prisma.family.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה');
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
      where: { id, organizationId, deletedAt: null },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה');
    }

    const updated = await this.prisma.family.update({
      where: { id },
      data: {
        ...(updateFamilyDto.familyName !== undefined && { familyName: updateFamilyDto.familyName }),
        ...(updateFamilyDto.contactPhone !== undefined && { contactPhone: updateFamilyDto.contactPhone }),
        ...(updateFamilyDto.address !== undefined && { address: updateFamilyDto.address }),
        ...(updateFamilyDto.notes !== undefined && { notes: updateFamilyDto.notes }),
      },
    });

    return this.mapToDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    this.logger.log(`Soft deleting family ${id} in organization ${organizationId}`);

    const family = await this.prisma.family.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה');
    }

    await this.prisma.family.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async linkToGroup(organizationId: string, familyId: string, groupId: string): Promise<FamilyResponseDto> {
    this.logger.log(`Linking family ${familyId} to group ${groupId}`);

    const family = await this.prisma.family.findFirst({
      where: { id: familyId, organizationId, deletedAt: null },
    });

    if (!family) {
      throw new NotFoundException('משפחה לא נמצאה');
    }

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
    });

    if (!group) {
      throw new BadRequestException('הקבוצה לא נמצאה בעמותה');
    }

    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { groupId },
    });

    return this.mapToDto(updated);
  }

  private mapToDto(family: Record<string, unknown>): FamilyResponseDto {
    return {
      id: family.id as string,
      organizationId: family.organizationId as string,
      familyName: family.familyName as string,
      groupId: (family.groupId as string) || undefined,
      contactName: (family.contactName as string) || undefined,
      contactPhone: (family.contactPhone as string) || undefined,
      address: (family.address as string) || undefined,
      notes: (family.notes as string) || undefined,
      createdAt: family.createdAt as Date,
      updatedAt: family.updatedAt as Date,
    };
  }
}
