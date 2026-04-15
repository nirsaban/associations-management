import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';
import { OrganizationResponseDto, OrganizationWithAdminDto } from './dto/organization-response.dto';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new organization
   * Only SUPER_ADMIN can call this
   */
  async createOrganization(createOrganizationDto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    this.logger.log(`Creating new organization: ${createOrganizationDto.name}`);

    // Generate slug from name if not provided
    const slug = createOrganizationDto.slug || this.generateSlug(createOrganizationDto.name);

    // Check if slug already exists
    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`An organization with slug "${slug}" already exists`);
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: createOrganizationDto.name,
        slug,
        contactEmail: createOrganizationDto.contactEmail,
        contactPhone: createOrganizationDto.contactPhone,
        isActive: true,
        setupCompleted: false, // First admin hasn't completed wizard yet
      },
    });

    return this.mapToDto(organization);
  }

  /**
   * Create the first admin user for an organization.
   * Sets systemRole to ADMIN, registrationCompleted to false (needs to log in first time).
   * Phone is normalized from Israeli local format (05XXXXXXXX) before saving.
   */
  async createFirstAdmin(
    organizationId: string,
    createFirstAdminDto: CreateFirstAdminDto,
  ): Promise<{ admin: Record<string, unknown>; organization: OrganizationResponseDto }> {
    this.logger.log(`Creating first admin for organization ${organizationId}`);

    const normalizedPhone = this.normalizePhone(createFirstAdminDto.phone);

    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if phone already exists globally (phone is globally unique)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this phone number already exists',
      );
    }

    // Create admin user
    const admin = await this.prisma.user.create({
      data: {
        organizationId: organizationId,
        phone: normalizedPhone,
        fullName: createFirstAdminDto.fullName,
        email: createFirstAdminDto.email,
        systemRole: 'ADMIN',
        isActive: true,
        registrationCompleted: false, // Will complete on first login
      },
    });

    return {
      admin,
      organization: this.mapToDto(organization),
    };
  }

  /**
   * Get all organizations with pagination and search
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: 'active' | 'inactive' | 'all',
  ): Promise<{ data: OrganizationResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding all organizations (page ${page}, limit ${limit})`);

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      data: organizations.map((org) => this.mapToDto(org)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get a single organization with first admin details
   */
  async findOne(id: string): Promise<OrganizationWithAdminDto> {
    this.logger.log(`Finding organization ${id}`);

    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        users: {
          where: {
            systemRole: 'ADMIN',
            deletedAt: null,
          },
          take: 1, // Get first admin
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const dto = this.mapToDto(organization) as OrganizationWithAdminDto;

    // Add first admin if exists
    if (organization.users && organization.users.length > 0) {
      const admin = organization.users[0];
      dto.firstAdmin = {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email || undefined,
        phone: admin.phone,
        registrationCompleted: admin.registrationCompleted,
      };
    }

    return dto;
  }

  /**
   * Toggle organization active status
   */
  async toggleStatus(id: string, isActive: boolean): Promise<OrganizationResponseDto> {
    this.logger.log(`Setting organization ${id} isActive=${isActive}`);

    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { isActive },
    });

    return this.mapToDto(updated);
  }

  /**
   * Update an organization's details (SUPER_ADMIN only)
   */
  async updateOrganization(
    id: string,
    updateDto: Partial<CreateOrganizationDto>,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Updating organization ${id}`);

    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check slug uniqueness if changed
    if (updateDto.slug && updateDto.slug !== organization.slug) {
      const existingSlug = await this.prisma.organization.findUnique({
        where: { slug: updateDto.slug },
      });
      if (existingSlug) {
        throw new ConflictException(`Slug "${updateDto.slug}" is already taken`);
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.slug !== undefined && { slug: updateDto.slug }),
        ...(updateDto.contactEmail !== undefined && { contactEmail: updateDto.contactEmail }),
        ...(updateDto.contactPhone !== undefined && { contactPhone: updateDto.contactPhone }),
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Normalize Israeli phone number to +972 format.
   * Input: "0501234567" → Output: "+9720501234567" stored as-is,
   * but we store the normalized local form for lookup consistency.
   * Strips spaces and ensures leading 0 is preserved.
   */
  private normalizePhone(phone: string): string {
    const stripped = phone.replace(/\s+/g, '').replace(/-/g, '');
    // Convert +972XXXXXXXXX → 0XXXXXXXXX
    if (stripped.startsWith('+972')) {
      return '0' + stripped.slice(4);
    }
    return stripped;
  }

  /**
   * Generate URL-friendly slug from Hebrew/English text
   */
  private generateSlug(name: string): string {
    // Hebrew to English transliteration map (simplified)
    const hebrewMap: Record<string, string> = {
      'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
      'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k',
      'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
      'ע': '', 'פ': 'p', 'ף': 'p', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k',
      'ר': 'r', 'ש': 'sh', 'ת': 't',
    };

    let slug = name
      .toLowerCase()
      .split('')
      .map((char) => hebrewMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
      .substring(0, 100); // Limit length

    // Ensure slug is not empty
    if (!slug) {
      slug = 'org-' + Date.now();
    }

    return slug;
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
