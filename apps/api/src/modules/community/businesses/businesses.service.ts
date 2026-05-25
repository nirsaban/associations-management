import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CloudinaryService } from '@common/services/cloudinary.service';
import { UpsertBusinessDto } from './dto/upsert-business.dto';

const PUBLIC_USER_FIELDS = {
  id: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
} as const;

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async listForOrg(organizationId: string) {
    const businesses = await this.prisma.userBusiness.findMany({
      where: { organizationId, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: PUBLIC_USER_FIELDS } },
    });
    return businesses;
  }

  async findById(organizationId: string, id: string) {
    const business = await this.prisma.userBusiness.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { user: { select: PUBLIC_USER_FIELDS } },
    });
    if (!business) throw new NotFoundException('העסק לא נמצא');
    return business;
  }

  async getMine(organizationId: string, userId: string) {
    return this.prisma.userBusiness.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
  }

  /**
   * Upserts the business profile for the given user — one business per user.
   * If a soft-deleted row exists we restore it (avoids unique conflict).
   */
  async upsertMine(organizationId: string, userId: string, dto: UpsertBusinessDto) {
    const existing = await this.prisma.userBusiness.findUnique({ where: { userId } });

    if (existing) {
      if (existing.organizationId !== organizationId) {
        throw new BadRequestException('העסק שייך לעמותה אחרת');
      }
      return this.prisma.userBusiness.update({
        where: { id: existing.id },
        data: {
          ...dto,
          deletedAt: null, // restore if soft-deleted
          isActive: dto.isActive ?? true,
        },
      });
    }

    return this.prisma.userBusiness.create({
      data: {
        organizationId,
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category ?? null,
        logoUrl: dto.logoUrl ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        website: dto.website ?? null,
        whatsappUrl: dto.whatsappUrl ?? null,
        facebookUrl: dto.facebookUrl ?? null,
        instagramUrl: dto.instagramUrl ?? null,
        tiktokUrl: dto.tiktokUrl ?? null,
        youtubeUrl: dto.youtubeUrl ?? null,
        linkedinUrl: dto.linkedinUrl ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async deleteMine(organizationId: string, userId: string) {
    const existing = await this.prisma.userBusiness.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('אין לך עסק רשום');
    await this.prisma.userBusiness.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async uploadImage(organizationId: string, file: Express.Multer.File): Promise<string> {
    const result = await this.cloudinary.uploadAsset(
      file,
      `amutot/${organizationId}/businesses`,
    );
    return result.secureUrl;
  }
}
