import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateAssociationDto } from './dto/create-association.dto';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';
import { AssociationResponseDto, AssociationWithAdminDto } from './dto/association-response.dto';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new association (organization)
   * Only SUPER_ADMIN can call this
   */
  async createAssociation(createAssociationDto: CreateAssociationDto): Promise<AssociationResponseDto> {
    this.logger.log(`Creating new association: ${createAssociationDto.name}`);

    // Generate slug from name if not provided
    const slug = createAssociationDto.slug || this.generateSlug(createAssociationDto.name);

    // Check if slug already exists
    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`An organization with slug "${slug}" already exists`);
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: createAssociationDto.name,
        slug,
        email: createAssociationDto.contactEmail,
        phone: createAssociationDto.contactPhone,
        isActive: true,
        setupCompleted: false, // First admin hasn't completed wizard yet
      },
    });

    return this.mapToDto(organization);
  }

  /**
   * Create the first admin user for an association
   * Sets systemRole to ADMIN, registrationCompleted to false (needs to log in first time)
   */
  async createFirstAdmin(
    associationId: string,
    createFirstAdminDto: CreateFirstAdminDto,
  ): Promise<{ admin: Record<string, unknown>; association: AssociationResponseDto }> {
    this.logger.log(`Creating first admin for association ${associationId}`);

    // Verify association exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: associationId },
    });

    if (!organization) {
      throw new NotFoundException('Association not found');
    }

    // Check if phone already exists in this organization
    const existingUser = await this.prisma.user.findFirst({
      where: {
        organizationId: associationId,
        phone: createFirstAdminDto.phone,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this phone number already exists in this organization',
      );
    }

    // Create admin user
    const admin = await this.prisma.user.create({
      data: {
        organizationId: associationId,
        phone: createFirstAdminDto.phone,
        fullName: createFirstAdminDto.fullName,
        email: createFirstAdminDto.email,
        systemRole: 'ADMIN',
        isActive: true,
        registrationCompleted: false, // Will complete on first login
      },
    });

    return {
      admin,
      association: this.mapToDto(organization),
    };
  }

  /**
   * Get all associations with pagination and search
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: 'active' | 'inactive' | 'all',
  ): Promise<{ data: AssociationResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding all associations (page ${page}, limit ${limit})`);

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
   * Get a single association with first admin details
   */
  async findOne(id: string): Promise<AssociationWithAdminDto> {
    this.logger.log(`Finding association ${id}`);

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
      throw new NotFoundException('Association not found');
    }

    const dto = this.mapToDto(organization) as AssociationWithAdminDto;

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
   * Toggle association active status
   */
  async toggleStatus(id: string, isActive: boolean): Promise<AssociationResponseDto> {
    this.logger.log(`Setting association ${id} isActive=${isActive}`);

    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new NotFoundException('Association not found');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { isActive },
    });

    return this.mapToDto(updated);
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
