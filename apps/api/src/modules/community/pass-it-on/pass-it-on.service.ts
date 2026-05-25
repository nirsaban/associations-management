import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CloudinaryService } from '@common/services/cloudinary.service';
import { PassItOnCategory, PassItOnStatus, Prisma } from '@prisma/client';
import { CreatePassItOnItemDto } from './dto/create-item.dto';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

interface ListFilters {
  status?: PassItOnStatus;
  category?: PassItOnCategory;
  cursor?: string;
  limit?: number;
  q?: string;
}

@Injectable()
export class PassItOnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async uploadImage(organizationId: string, file: Express.Multer.File): Promise<string> {
    const result = await this.cloudinary.uploadAsset(
      file,
      `amutot/${organizationId}/pass-it-on`,
    );
    return result.secureUrl;
  }

  async create(organizationId: string, userId: string, dto: CreatePassItOnItemDto) {
    return this.prisma.passItOnItem.create({
      data: {
        organizationId,
        postedById: userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        images: dto.images ?? [],
        location: dto.location ?? null,
        contactPhone: dto.contactPhone ?? null,
        status: PassItOnStatus.AVAILABLE,
      },
      include: this.includePoster(),
    });
  }

  async list(organizationId: string, filters: ListFilters) {
    const limit = Math.min(filters.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const where: Prisma.PassItOnItemWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.q && filters.q.trim().length > 0) {
      const q = filters.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.passItOnItem.findMany({
      where,
      include: this.includePoster(),
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, nextCursor };
  }

  async findOne(organizationId: string, id: string) {
    const item = await this.prisma.passItOnItem.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { ...this.includePoster(), claimedBy: { select: { id: true, fullName: true } } },
    });
    if (!item) throw new NotFoundException('הפריט לא נמצא');
    return item;
  }

  async claim(organizationId: string, itemId: string, userId: string) {
    const item = await this.findOne(organizationId, itemId);
    if (item.status !== PassItOnStatus.AVAILABLE) {
      throw new BadRequestException('הפריט כבר נתפס');
    }
    if (item.postedById === userId) {
      throw new BadRequestException('לא ניתן לקחת פריט שאתה פרסמת');
    }
    return this.prisma.passItOnItem.update({
      where: { id: itemId },
      data: {
        status: PassItOnStatus.RESERVED,
        claimedById: userId,
        claimedAt: new Date(),
      },
      include: this.includePoster(),
    });
  }

  async markTaken(organizationId: string, itemId: string, userId: string) {
    const item = await this.findOne(organizationId, itemId);
    if (item.postedById !== userId) {
      throw new ForbiddenException('רק מי שפרסם יכול לסמן כנמסר');
    }
    return this.prisma.passItOnItem.update({
      where: { id: itemId },
      data: { status: PassItOnStatus.TAKEN, takenAt: new Date() },
      include: this.includePoster(),
    });
  }

  async release(organizationId: string, itemId: string, userId: string) {
    const item = await this.findOne(organizationId, itemId);
    const isClaimer = item.claimedById === userId;
    const isOwner = item.postedById === userId;
    if (!isClaimer && !isOwner) {
      throw new ForbiddenException('אין הרשאה לשחרר פריט זה');
    }
    return this.prisma.passItOnItem.update({
      where: { id: itemId },
      data: { status: PassItOnStatus.AVAILABLE, claimedById: null, claimedAt: null },
      include: this.includePoster(),
    });
  }

  async remove(organizationId: string, itemId: string, userId: string, isAdmin: boolean) {
    const item = await this.findOne(organizationId, itemId);
    if (item.postedById !== userId && !isAdmin) {
      throw new ForbiddenException('רק המפרסם או מנהל יכולים למחוק');
    }
    await this.prisma.passItOnItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });
  }

  private includePoster() {
    return {
      postedBy: { select: { id: true, fullName: true, phone: true, avatarUrl: true } },
    };
  }
}
