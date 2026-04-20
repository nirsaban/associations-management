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

  async uploadLogo(
    userId: string,
    organizationId: string,
    logoUrl: string,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Uploading logo for organization ${organizationId}`);

    await this.verifyAdminAccess(userId, organizationId);

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { logoUrl },
    });

    return this.mapToDto(updated);
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

  private mapToDto(organization: Record<string, unknown>): OrganizationResponseDto {
    return {
      id: organization.id as string,
      name: organization.name as string,
      slug: organization.slug as string,
      email: (organization.contactEmail as string) || undefined,
      phone: (organization.contactPhone as string) || undefined,
      address: (organization.address as string) || undefined,
      logoUrl: (organization.logoUrl as string) || undefined,
      description: (organization.description as string) || undefined,
      paymentLink: (organization.paymentLink as string) || undefined,
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
