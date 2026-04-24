import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';
import { SetupOrganizationDto } from './dto/setup-organization.dto';
import { OnboardingStep1Dto } from './dto/onboarding-step1.dto';
import { OnboardingStep2Dto } from './dto/onboarding-step2.dto';
import { OnboardingStep3Dto } from './dto/onboarding-step3.dto';
import { UpdateOrgProfileDto } from './dto/update-profile.dto';
import { OrganizationResponseDto } from '@modules/platform/dto/organization-response.dto';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyOrganization(userId: string, organizationId: string): Promise<OrganizationResponseDto> {
    this.logger.log(`Getting organization for user ${userId} in org ${organizationId}`);

    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.mapToDto(organization);
  }

  async completeSetup(
    userId: string,
    organizationId: string,
    setupDto: SetupOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Completing setup for organization ${organizationId} by user ${userId}`);

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        systemRole: 'ADMIN',
        deletedAt: null,
      },
    });

    if (!user) {
      throw new ForbiddenException('Only organization admins can complete setup');
    }

    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (setupDto.slug && setupDto.slug !== organization.slug) {
      const existingSlug = await this.prisma.organization.findUnique({
        where: { slug: setupDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException(`Slug "${setupDto.slug}" is already taken`);
      }
    }

    const updateData: Prisma.OrganizationUpdateInput = {};
    if (setupDto.name !== undefined) updateData.name = setupDto.name;
    if (setupDto.slug !== undefined) updateData.slug = setupDto.slug;
    if (setupDto.logoUrl !== undefined) updateData.logoUrl = setupDto.logoUrl;
    if (setupDto.contactEmail !== undefined) updateData.contactEmail = setupDto.contactEmail;
    if (setupDto.contactPhone !== undefined) updateData.contactPhone = setupDto.contactPhone;
    if (setupDto.address !== undefined) updateData.address = setupDto.address;
    if (setupDto.settings !== undefined) updateData.settings = setupDto.settings as Prisma.InputJsonValue;
    if (setupDto.setupCompleted === true) updateData.setupCompleted = true;

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    this.logger.log(`Setup completed for organization ${organizationId}`);

    return this.mapToDto(updated);
  }

  async saveOnboardingStep1(
    userId: string,
    organizationId: string,
    dto: OnboardingStep1Dto,
  ): Promise<OrganizationResponseDto> {
    await this.verifyAdminAccess(userId, organizationId);

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name,
        address: dto.address,
        logoUrl: dto.logoUrl ?? undefined,
        description: dto.description ?? undefined,
      },
    });

    return this.mapToDto(updated);
  }

  async saveOnboardingStep2(
    userId: string,
    organizationId: string,
    dto: OnboardingStep2Dto,
  ): Promise<OrganizationResponseDto> {
    await this.verifyAdminAccess(userId, organizationId);

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        paymentLink: dto.paymentLink,
        paymentDescription: dto.paymentDescription ?? undefined,
      },
    });

    return this.mapToDto(updated);
  }

  async saveOnboardingStep3(
    userId: string,
    organizationId: string,
    dto: OnboardingStep3Dto,
  ): Promise<OrganizationResponseDto> {
    await this.verifyAdminAccess(userId, organizationId);

    // Validate at least one contact field is filled
    const hasContact = dto.contactPhone || dto.contactEmail || dto.facebookUrl ||
      dto.instagramUrl || dto.whatsappUrl || dto.websiteUrl;
    if (!hasContact) {
      throw new BadRequestException('יש למלא לפחות אמצעי קשר אחד');
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        contactPhone: dto.contactPhone ?? undefined,
        contactEmail: dto.contactEmail ?? undefined,
        facebookUrl: dto.facebookUrl ?? undefined,
        instagramUrl: dto.instagramUrl ?? undefined,
        whatsappUrl: dto.whatsappUrl ?? undefined,
        websiteUrl: dto.websiteUrl ?? undefined,
        setupCompleted: true,
      },
    });

    return this.mapToDto(updated);
  }

  async updateProfile(
    userId: string,
    organizationId: string,
    dto: UpdateOrgProfileDto,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Updating profile for organization ${organizationId}`);
    await this.verifyAdminAccess(userId, organizationId);

    // Sanitize rich text fields
    const sanitizedAboutLong = dto.aboutLong
      ? this.sanitizeHtml(dto.aboutLong)
      : dto.aboutLong;

    const updateData: Prisma.OrganizationUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.legalName !== undefined) updateData.legalName = dto.legalName;
    if (dto.taxId !== undefined) updateData.taxId = dto.taxId;
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) updateData.contactPhone = dto.contactPhone;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.primaryColor !== undefined) updateData.primaryColor = dto.primaryColor;
    if (dto.accentColor !== undefined) updateData.accentColor = dto.accentColor;
    if (dto.aboutShort !== undefined) updateData.aboutShort = dto.aboutShort;
    if (sanitizedAboutLong !== undefined) updateData.aboutLong = sanitizedAboutLong;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.defaultPaymentLink !== undefined) updateData.defaultPaymentLink = dto.defaultPaymentLink;
    if (dto.paymentLink !== undefined) updateData.paymentLink = dto.paymentLink;
    if (dto.paymentDescription !== undefined) updateData.paymentDescription = dto.paymentDescription;
    if (dto.facebookUrl !== undefined) updateData.facebookUrl = dto.facebookUrl;
    if (dto.instagramUrl !== undefined) updateData.instagramUrl = dto.instagramUrl;
    if (dto.whatsappUrl !== undefined) updateData.whatsappUrl = dto.whatsappUrl;
    if (dto.websiteUrl !== undefined) updateData.websiteUrl = dto.websiteUrl;

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    return this.mapToDto(updated);
  }

  async uploadLogo(
    userId: string,
    organizationId: string,
    logoUrl: string,
    assetId?: string,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Uploading logo for organization ${organizationId}`);

    await this.verifyAdminAccess(userId, organizationId);

    const data: Prisma.OrganizationUpdateInput = { logoUrl };
    if (assetId) {
      data.logoAsset = { connect: { id: assetId } };
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });

    return this.mapToDto(updated);
  }

  async removeLogo(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Removing logo for organization ${organizationId}`);
    await this.verifyAdminAccess(userId, organizationId);

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { logoUrl: null, logoAssetId: null },
    });

    return this.mapToDto(updated);
  }

  async getPublicProfile(organizationId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        aboutShort: true,
        primaryColor: true,
        accentColor: true,
      },
    });
    return org;
  }

  private async verifyAdminAccess(userId: string, organizationId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        systemRole: 'ADMIN',
        deletedAt: null,
      },
    });

    if (!user) {
      throw new ForbiddenException('Only organization admins can perform this action');
    }
  }

  private sanitizeHtml(html: string): string {
    // Server-side sanitization: strip dangerous tags and attributes
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

  private mapToDto(organization: Record<string, unknown>): OrganizationResponseDto {
    return {
      id: organization.id as string,
      name: organization.name as string,
      slug: organization.slug as string,
      email: (organization.contactEmail as string) || undefined,
      phone: (organization.contactPhone as string) || undefined,
      address: (organization.address as string) || undefined,
      logoUrl: (organization.logoUrl as string) || undefined,
      logoAssetId: (organization.logoAssetId as string) || undefined,
      legalName: (organization.legalName as string) || undefined,
      taxId: (organization.taxId as string) || undefined,
      addressLine2: (organization.addressLine2 as string) || undefined,
      city: (organization.city as string) || undefined,
      postalCode: (organization.postalCode as string) || undefined,
      country: (organization.country as string) || 'IL',
      primaryColor: (organization.primaryColor as string) || '#2563eb',
      accentColor: (organization.accentColor as string) || '#f59e0b',
      aboutShort: (organization.aboutShort as string) || undefined,
      aboutLong: (organization.aboutLong as string) || undefined,
      description: (organization.description as string) || undefined,
      paymentLink: (organization.paymentLink as string) || undefined,
      defaultPaymentLink: (organization.defaultPaymentLink as string) || undefined,
      paymentDescription: (organization.paymentDescription as string) || undefined,
      facebookUrl: (organization.facebookUrl as string) || undefined,
      instagramUrl: (organization.instagramUrl as string) || undefined,
      whatsappUrl: (organization.whatsappUrl as string) || undefined,
      websiteUrl: (organization.websiteUrl as string) || undefined,
      status: organization.status as string,
      setupCompleted: organization.setupCompleted as boolean,
      settings: (organization.settings as Record<string, unknown>) || undefined,
      createdAt: organization.createdAt as Date,
      updatedAt: organization.updatedAt as Date,
    };
  }
}
