import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UpdateLandingDto, RESERVED_SLUGS } from './dto/update-landing.dto';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto/section.dto';
import { SubmitReviewDto, ModerateReviewDto } from './dto/review.dto';
import { SubmitLeadDto } from './dto/lead.dto';

@Injectable()
export class LandingService {
  constructor(private readonly prisma: PrismaService) {}

  // =============== LANDING PAGE CRUD ===============

  async getOrCreate(organizationId: string) {
    let landing = await this.prisma.landingPage.findUnique({
      where: { organizationId },
      include: {
        sections: { orderBy: { position: 'asc' } },
        organization: {
          select: { name: true, slug: true, primaryColor: true, accentColor: true, paymentLink: true },
        },
      },
    });

    if (!landing) {
      const org = await this.prisma.organization.findFirst({
        where: { id: organizationId, deletedAt: null },
      });
      if (!org) throw new NotFoundException('Organization not found');

      // Generate a unique slug based on org slug
      let slug = org.slug;
      const existing = await this.prisma.landingPage.findUnique({ where: { slug } });
      if (existing) {
        slug = `${org.slug}-landing`;
      }

      landing = await this.prisma.landingPage.create({
        data: {
          organizationId,
          slug,
          title: org.name,
        },
        include: {
          sections: { orderBy: { position: 'asc' } },
          organization: {
            select: { name: true, slug: true, primaryColor: true, accentColor: true, paymentLink: true },
          },
        },
      });
    }

    return landing;
  }

  async update(organizationId: string, dto: UpdateLandingDto) {
    const landing = await this.prisma.landingPage.findUnique({
      where: { organizationId },
    });
    if (!landing) throw new NotFoundException('Landing page not found');

    if (dto.slug) {
      if (RESERVED_SLUGS.includes(dto.slug)) {
        throw new BadRequestException(`Slug "${dto.slug}" is reserved`);
      }
      const existing = await this.prisma.landingPage.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== landing.id) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    return this.prisma.landingPage.update({
      where: { id: landing.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
        ...(dto.theme !== undefined && { theme: dto.theme as 'WARM' | 'MODERN' | 'MINIMAL' | 'BOLD' }),
      },
      include: {
        sections: { orderBy: { position: 'asc' } },
        organization: {
          select: { name: true, slug: true, primaryColor: true, accentColor: true, paymentLink: true },
        },
      },
    });
  }

  async publish(organizationId: string) {
    const landing = await this.prisma.landingPage.findUnique({ where: { organizationId } });
    if (!landing) throw new NotFoundException('Landing page not found');

    return this.prisma.landingPage.update({
      where: { id: landing.id },
      data: { published: true, publishedAt: new Date() },
    });
  }

  async unpublish(organizationId: string) {
    const landing = await this.prisma.landingPage.findUnique({ where: { organizationId } });
    if (!landing) throw new NotFoundException('Landing page not found');

    return this.prisma.landingPage.update({
      where: { id: landing.id },
      data: { published: false },
    });
  }

  // =============== SECTIONS ===============

  async addSection(organizationId: string, dto: CreateSectionDto) {
    const landing = await this.prisma.landingPage.findUnique({ where: { organizationId } });
    if (!landing) throw new NotFoundException('Landing page not found');

    // Get max position
    const lastSection = await this.prisma.landingPageSection.findFirst({
      where: { landingPageId: landing.id },
      orderBy: { position: 'desc' },
    });
    const position = lastSection ? lastSection.position + 1 : 0;

    // Sanitize data if it contains rich text
    const sanitizedData = this.sanitizeSectionData(dto.data || {});

    return this.prisma.landingPageSection.create({
      data: {
        landingPageId: landing.id,
        type: dto.type,
        position,
        data: sanitizedData as object,
      },
    });
  }

  async updateSection(organizationId: string, sectionId: string, dto: UpdateSectionDto) {
    const landing = await this.prisma.landingPage.findUnique({ where: { organizationId } });
    if (!landing) throw new NotFoundException('Landing page not found');

    const section = await this.prisma.landingPageSection.findFirst({
      where: { id: sectionId, landingPageId: landing.id },
    });
    if (!section) throw new NotFoundException('Section not found');

    return this.prisma.landingPageSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.visible !== undefined && { visible: dto.visible }),
        ...(dto.data !== undefined && { data: this.sanitizeSectionData(dto.data) as object }),
      },
    });
  }

  async deleteSection(organizationId: string, sectionId: string) {
    const landing = await this.prisma.landingPage.findUnique({ where: { organizationId } });
    if (!landing) throw new NotFoundException('Landing page not found');

    const section = await this.prisma.landingPageSection.findFirst({
      where: { id: sectionId, landingPageId: landing.id },
    });
    if (!section) throw new NotFoundException('Section not found');

    await this.prisma.landingPageSection.delete({ where: { id: sectionId } });

    // Re-order remaining sections
    const remaining = await this.prisma.landingPageSection.findMany({
      where: { landingPageId: landing.id },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await this.prisma.landingPageSection.update({
          where: { id: remaining[i].id },
          data: { position: i },
        });
      }
    }

    return { success: true };
  }

  async reorderSections(organizationId: string, dto: ReorderSectionsDto) {
    const landing = await this.prisma.landingPage.findUnique({ where: { organizationId } });
    if (!landing) throw new NotFoundException('Landing page not found');

    // Validate all sections belong to this landing page
    const existingSections = await this.prisma.landingPageSection.findMany({
      where: { landingPageId: landing.id },
    });
    const existingIds = new Set(existingSections.map(s => s.id));

    for (const item of dto.items) {
      if (!existingIds.has(item.id)) {
        throw new BadRequestException(`Section ${item.id} does not belong to this landing page`);
      }
    }

    // Check for duplicate positions
    const positions = dto.items.map(i => i.position);
    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException('Duplicate positions are not allowed');
    }

    // Update positions
    await Promise.all(
      dto.items.map(item =>
        this.prisma.landingPageSection.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );

    return this.prisma.landingPageSection.findMany({
      where: { landingPageId: landing.id },
      orderBy: { position: 'asc' },
    });
  }

  // =============== PUBLIC ===============

  async getPublicPage(slug: string) {
    const landing = await this.prisma.landingPage.findUnique({
      where: { slug },
      include: {
        sections: {
          where: { visible: true },
          orderBy: { position: 'asc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            accentColor: true,
            aboutShort: true,
            contactPhone: true,
            contactEmail: true,
            facebookUrl: true,
            instagramUrl: true,
            whatsappUrl: true,
            websiteUrl: true,
            paymentLink: true,
          },
        },
      },
    });

    if (!landing) throw new NotFoundException('Page not found');
    if (!landing.published) throw new NotFoundException('Page not found');

    return landing;
  }

  async getPreviewPage(slug: string) {
    // Same as public but doesn't check published status
    const landing = await this.prisma.landingPage.findUnique({
      where: { slug },
      include: {
        sections: {
          where: { visible: true },
          orderBy: { position: 'asc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            accentColor: true,
            aboutShort: true,
            contactPhone: true,
            contactEmail: true,
            facebookUrl: true,
            instagramUrl: true,
            whatsappUrl: true,
            websiteUrl: true,
            paymentLink: true,
          },
        },
      },
    });

    if (!landing) throw new NotFoundException('Page not found');
    return landing;
  }

  async trackView(slug: string) {
    const landing = await this.prisma.landingPage.findUnique({ where: { slug } });
    if (!landing) return;

    await this.prisma.landingPage.update({
      where: { id: landing.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  // =============== REVIEWS ===============

  async getReviews(organizationId: string, status?: string) {
    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status.toUpperCase();

    return this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApprovedReviews(organizationId: string) {
    return this.prisma.review.findMany({
      where: { organizationId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        authorName: true,
        rating: true,
        body: true,
        submittedAt: true,
      },
    });
  }

  async submitReview(slug: string, dto: SubmitReviewDto) {
    // Honeypot check
    if (dto.website) {
      // Silently accept but don't store (bot trap)
      return { success: true };
    }

    const landing = await this.prisma.landingPage.findUnique({
      where: { slug },
      select: { organization: { select: { id: true } } },
    });
    if (!landing) throw new NotFoundException('Page not found');

    const sanitizedBody = this.sanitizeHtml(dto.body);

    await this.prisma.review.create({
      data: {
        organizationId: landing.organization.id,
        authorName: dto.authorName,
        authorEmail: dto.authorEmail,
        rating: dto.rating,
        body: sanitizedBody,
        status: 'PENDING',
      },
    });

    return { success: true };
  }

  async moderateReview(organizationId: string, reviewId: string, dto: ModerateReviewDto, userId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, organizationId },
    });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: dto.status,
        ...(dto.status === 'APPROVED' && {
          approvedAt: new Date(),
          approvedById: userId,
        }),
      },
    });
  }

  // =============== LEADS ===============

  async submitLead(slug: string, dto: SubmitLeadDto, ip?: string, userAgent?: string) {
    const landing = await this.prisma.landingPage.findUnique({
      where: { slug },
      select: { organization: { select: { id: true } } },
    });
    if (!landing) throw new NotFoundException('Page not found');

    return this.prisma.landingLead.create({
      data: {
        organizationId: landing.organization.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        sourceSectionId: dto.sourceSectionId,
        ip,
        userAgent,
      },
    });
  }

  // =============== ASSETS ===============

  async uploadAsset(organizationId: string, file: Express.Multer.File, userId: string) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3003';
    const url = `${baseUrl}/uploads/assets/${file.filename}`;

    return this.prisma.asset.create({
      data: {
        organizationId,
        kind: file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        url,
        mime: file.mimetype,
        bytes: file.size,
        createdById: userId,
      },
    });
  }

  // =============== HELPERS ===============

  private sanitizeHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/<link\b[^>]*>/gi, '')
      .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript\s*:/gi, '');
  }

  private sanitizeSectionData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };
    // Sanitize any string fields that might contain HTML
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'string') {
        const val = sanitized[key] as string;
        if (val.includes('<') || val.includes('javascript:')) {
          sanitized[key] = this.sanitizeHtml(val);
        }
      }
    }

    // Validate video URLs to prevent SSRF
    if (sanitized.source === 'youtube' || sanitized.source === 'vimeo') {
      const url = sanitized.url_or_asset_id as string;
      if (url && typeof url === 'string') {
        const allowed = [
          'youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com',
          'youtu.be',
          'vimeo.com', 'www.vimeo.com', 'player.vimeo.com',
        ];
        try {
          const parsed = new URL(url);
          if (!allowed.includes(parsed.hostname)) {
            throw new BadRequestException('Video URL must be from YouTube or Vimeo');
          }
        } catch (e) {
          if (e instanceof BadRequestException) throw e;
          // Not a valid URL — might be an asset ID, which is fine
        }
      }
    }

    return sanitized;
  }
}
