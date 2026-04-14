import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';
import { SetupAssociationDto } from './dto/setup-association.dto';
import { AssociationResponseDto } from '@modules/platform/dto/association-response.dto';

@Injectable()
export class AssociationsService {
  private readonly logger = new Logger(AssociationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user's organization
   * Only works for users who have an organizationId (not SUPER_ADMIN)
   */
  async getMyAssociation(userId: string, organizationId: string): Promise<AssociationResponseDto> {
    this.logger.log(`Getting association for user ${userId} in org ${organizationId}`);

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
    setupDto: SetupAssociationDto,
  ): Promise<AssociationResponseDto> {
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
    if (setupDto.slug !== organization.slug) {
      const existingSlug = await this.prisma.organization.findUnique({
        where: { slug: setupDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException(`Slug "${setupDto.slug}" is already taken`);
      }
    }

    // Update organization
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: setupDto.name,
        slug: setupDto.slug,
        email: setupDto.contactEmail,
        phone: setupDto.contactPhone,
        address: setupDto.address,
        settings: (setupDto.settings ?? undefined) as Prisma.InputJsonValue | undefined,
        setupCompleted: true, // Mark wizard as completed
      },
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
  ): Promise<AssociationResponseDto> {
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

  private mapToDto(organization: Record<string, unknown>): AssociationResponseDto {
    return {
      id: organization.id as string,
      name: organization.name as string,
      slug: organization.slug as string,
      email: (organization.email as string) || undefined,
      phone: (organization.phone as string) || undefined,
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
