import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';
import { SetupOrganizationDto } from './dto/setup-organization.dto';
import { OrganizationResponseDto } from '@modules/platform/dto/organization-response.dto';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user's organization
   * Only works for users who have an organizationId (not SUPER_ADMIN)
   */
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

  /**
   * Complete organization setup wizard
   * Sets setupCompleted to true after successful update
   * Only ADMIN users can complete setup
   */
  async completeSetup(
    userId: string,
    organizationId: string,
    setupDto: SetupOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Completing setup for organization ${organizationId} by user ${userId}`);

    // Verify user is an ADMIN in this organization
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

    // Verify organization exists
    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if slug is unique (if changed)
    if (setupDto.slug && setupDto.slug !== organization.slug) {
      const existingSlug = await this.prisma.organization.findUnique({
        where: { slug: setupDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException(`Slug "${setupDto.slug}" is already taken`);
      }
    }

    // Build update data — only include defined fields
    const updateData: Prisma.OrganizationUpdateInput = {};
    if (setupDto.name !== undefined) updateData.name = setupDto.name;
    if (setupDto.slug !== undefined) updateData.slug = setupDto.slug;
    if (setupDto.logoUrl !== undefined) updateData.logoUrl = setupDto.logoUrl;
    if (setupDto.contactEmail !== undefined) updateData.contactEmail = setupDto.contactEmail;
    if (setupDto.contactPhone !== undefined) updateData.contactPhone = setupDto.contactPhone;
    if (setupDto.address !== undefined) updateData.address = setupDto.address;
    if (setupDto.settings !== undefined) updateData.settings = setupDto.settings as Prisma.InputJsonValue;
    // If caller explicitly sets setupCompleted=true, mark the wizard as done
    if (setupDto.setupCompleted === true) updateData.setupCompleted = true;

    // Update organization
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    this.logger.log(`Setup completed for organization ${organizationId}`);

    return this.mapToDto(updated);
  }

  /**
   * Upload organization logo
   * In production, this would integrate with cloud storage (S3, GCS, etc.)
   * For MVP, we'll store in public/uploads directory
   */
  async uploadLogo(
    userId: string,
    organizationId: string,
    logoUrl: string,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Uploading logo for organization ${organizationId}`);

    // Verify user is an ADMIN in this organization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
        systemRole: 'ADMIN',
        deletedAt: null,
      },
    });

    if (!user) {
      throw new ForbiddenException('Only organization admins can upload logos');
    }

    // Update logo URL
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        logoUrl,
      },
    });

    return this.mapToDto(updated);
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
      isActive: organization.isActive as boolean,
      setupCompleted: organization.setupCompleted as boolean,
      settings: (organization.settings as Record<string, unknown>) || undefined,
      createdAt: organization.createdAt as Date,
      updatedAt: organization.updatedAt as Date,
    };
  }
}
