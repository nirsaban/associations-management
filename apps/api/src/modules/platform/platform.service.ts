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
import { CreateOrganizationWithAdminDto } from './dto/create-organization-with-admin.dto';
import { OrganizationListItemDto, OrganizationDetailDto } from './dto/organization-list-response.dto';
import { PlatformOverviewResponseDto } from './dto/platform-overview-response.dto';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create organization + first admin in a single transaction
   */
  async createOrganizationWithAdmin(
    dto: CreateOrganizationWithAdminDto,
    superAdminId: string,
  ): Promise<{ organization: OrganizationResponseDto; admin: { id: string; fullName: string; phone: string } }> {
    const sanitizedName = this.sanitizeInput(dto.organization.name);
    this.logger.log(`Creating organization "${sanitizedName}" with first admin`);

    const slug = dto.organization.slug;
    const normalizedPhone = this.normalizePhone(dto.firstAdmin.phone);
    const sanitizedAdminName = this.sanitizeInput(dto.firstAdmin.fullName);

    // Check slug uniqueness
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existingOrg) {
      throw new ConflictException(`כבר קיימת עמותה עם הslug "${slug}"`);
    }

    // Check phone doesn't already exist
    const existingUser = await this.prisma.user.findFirst({
      where: { phone: normalizedPhone, deletedAt: null },
    });
    if (existingUser) {
      throw new ConflictException('מספר הטלפון כבר קיים במערכת');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: sanitizedName,
          slug,
          contactPhone: dto.organization.contactPhone,
          contactEmail: dto.organization.contactEmail,
          address: dto.organization.address ? this.sanitizeInput(dto.organization.address) : undefined,
          status: 'ACTIVE',
          setupCompleted: false,
          createdBySuperAdminId: superAdminId,
        },
      });

      const admin = await tx.user.create({
        data: {
          organizationId: organization.id,
          phone: normalizedPhone,
          fullName: sanitizedAdminName,
          systemRole: 'ADMIN',
          isActive: true,
          registrationCompleted: false,
        },
      });

      return { organization, admin };
    });

    return {
      organization: this.mapToDto(result.organization),
      admin: {
        id: result.admin.id,
        fullName: result.admin.fullName,
        phone: result.admin.phone,
      },
    };
  }

  /**
   * Create a new organization (legacy endpoint)
   */
  async createOrganization(createOrganizationDto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    const sanitizedName = this.sanitizeInput(createOrganizationDto.name);
    this.logger.log(`Creating new organization: ${sanitizedName}`);

    const slug = createOrganizationDto.slug || this.generateSlug(sanitizedName);

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`כבר קיימת עמותה עם הslug "${slug}"`);
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: sanitizedName,
        slug,
        contactEmail: createOrganizationDto.contactEmail,
        contactPhone: createOrganizationDto.contactPhone,
        status: 'ACTIVE',
        setupCompleted: false,
      },
    });

    return this.mapToDto(organization);
  }

  /**
   * Create the first admin user for an organization
   */
  async createFirstAdmin(
    organizationId: string,
    createFirstAdminDto: CreateFirstAdminDto,
  ): Promise<{ admin: Record<string, unknown>; organization: OrganizationResponseDto }> {
    this.logger.log(`Creating first admin for organization ${organizationId}`);

    const normalizedPhone = this.normalizePhone(createFirstAdminDto.phone);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('העמותה לא נמצאה');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        organizationId,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('מספר הטלפון כבר קיים בעמותה זו');
    }

    const admin = await this.prisma.user.create({
      data: {
        organizationId,
        phone: normalizedPhone,
        fullName: createFirstAdminDto.fullName,
        email: createFirstAdminDto.email,
        systemRole: 'ADMIN',
        isActive: true,
        registrationCompleted: false,
      },
    });

    return {
      admin,
      organization: this.mapToDto(organization),
    };
  }

  /**
   * List all organizations with counts
   */
  async findAllWithCounts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: 'active' | 'inactive' | 'all',
  ): Promise<{ data: OrganizationListItemDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding all organizations with counts (page ${page}, limit ${limit})`);

    const skip = (page - 1) * limit;
    const currentMonth = this.getCurrentMonthKey();

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.status = 'ACTIVE';
    } else if (status === 'inactive') {
      where.status = 'INACTIVE';
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              groups: true,
              families: true,
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    const orgIds = organizations.map((o) => o.id);
    const unpaidCounts = await this.getUnpaidCountsByOrg(orgIds, currentMonth);

    const data: OrganizationListItemDto[] = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      setupCompleted: org.setupCompleted,
      contactPhone: org.contactPhone || undefined,
      contactEmail: org.contactEmail || undefined,
      createdAt: org.createdAt,
      counts: {
        usersCount: org._count.users,
        groupsCount: org._count.groups,
        familiesCount: org._count.families,
        unpaidThisMonthCount: unpaidCounts.get(org.id) || 0,
      },
    }));

    return { data, meta: { total, page, limit } };
  }

  /**
   * Get a single organization with admins and counts
   */
  async findOneWithDetails(id: string): Promise<OrganizationDetailDto> {
    this.logger.log(`Finding organization ${id} with details`);

    const currentMonth = this.getCurrentMonthKey();

    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { systemRole: 'ADMIN', deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            registrationCompleted: true,
          },
        },
        _count: {
          select: {
            users: true,
            groups: true,
            families: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('העמותה לא נמצאה');
    }

    const unpaidCounts = await this.getUnpaidCountsByOrg([id], currentMonth);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: organization.status,
      setupCompleted: organization.setupCompleted,
      contactPhone: organization.contactPhone || undefined,
      contactEmail: organization.contactEmail || undefined,
      address: organization.address || undefined,
      logoUrl: organization.logoUrl || undefined,
      settings: (organization.settings as Record<string, unknown>) || undefined,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      counts: {
        usersCount: organization._count.users,
        groupsCount: organization._count.groups,
        familiesCount: organization._count.families,
        unpaidThisMonthCount: unpaidCounts.get(id) || 0,
      },
      admins: organization.users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        phone: u.phone,
        email: u.email || undefined,
        registrationCompleted: u.registrationCompleted,
      })),
    };
  }

  /**
   * Toggle organization status
   */
  async toggleStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<OrganizationResponseDto> {
    this.logger.log(`Setting organization ${id} status=${status}`);

    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });

    if (!organization) {
      throw new NotFoundException('העמותה לא נמצאה');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { status },
    });

    return this.mapToDto(updated);
  }

  /**
   * Update organization details
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
      throw new NotFoundException('העמותה לא נמצאה');
    }

    if (updateDto.slug && updateDto.slug !== organization.slug) {
      const existingSlug = await this.prisma.organization.findUnique({
        where: { slug: updateDto.slug },
      });
      if (existingSlug) {
        throw new ConflictException(`הslug "${updateDto.slug}" כבר תפוס`);
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
   * Platform-wide overview numbers
   */
  async getOverview(): Promise<PlatformOverviewResponseDto> {
    this.logger.log('Getting platform overview');

    const currentMonth = this.getCurrentMonthKey();
    const currentWeek = this.getCurrentWeekKey();

    const [
      totalOrganizations,
      activeOrganizations,
      inactiveOrganizations,
      totalUsers,
      totalAdmins,
      totalSuperAdmins,
      totalGroups,
      totalFamilies,
      unpaidThisMonthAcrossPlatform,
      orgsMissingOrders,
      orgsMissingDistributor,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.organization.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { deletedAt: null, platformRole: null } }),
      this.prisma.user.count({ where: { deletedAt: null, systemRole: 'ADMIN', platformRole: null } }),
      this.prisma.user.count({ where: { deletedAt: null, platformRole: 'SUPER_ADMIN' } }),
      this.prisma.group.count({ where: { deletedAt: null } }),
      this.prisma.family.count({ where: { deletedAt: null } }),
      this.getUnpaidCountAcrossPlatform(currentMonth),
      this.getOrgsMissingWeeklyOrders(currentWeek),
      this.getOrgsMissingWeeklyDistributor(currentWeek),
    ]);

    return {
      totalOrganizations,
      activeOrganizations,
      inactiveOrganizations,
      totalUsers,
      totalAdmins,
      totalSuperAdmins,
      totalGroups,
      totalFamilies,
      unpaidThisMonthAcrossPlatform,
      organizationsMissingWeeklyOrdersThisWeek: orgsMissingOrders,
      organizationsMissingWeeklyDistributorThisWeek: orgsMissingDistributor,
    };
  }

  // ─── Legacy wrappers (backward compat for existing callers) ───────────

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: 'active' | 'inactive' | 'all',
  ): Promise<{ data: OrganizationResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.findAllWithCounts(page, limit, search, status) as unknown as {
      data: OrganizationResponseDto[];
      meta: { total: number; page: number; limit: number };
    };
  }

  async findOne(id: string): Promise<OrganizationWithAdminDto> {
    const detail = await this.findOneWithDetails(id);
    const dto: OrganizationWithAdminDto = {
      id: detail.id,
      name: detail.name,
      slug: detail.slug,
      email: detail.contactEmail,
      phone: detail.contactPhone,
      address: detail.address,
      logoUrl: detail.logoUrl,
      status: detail.status,
      setupCompleted: detail.setupCompleted,
      settings: detail.settings,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
    };
    if (detail.admins && detail.admins.length > 0) {
      dto.firstAdmin = detail.admins[0];
    }
    return dto;
  }

  /**
   * Strip HTML tags from user input to prevent stored XSS
   */
  private sanitizeInput(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim();
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private async getUnpaidCountsByOrg(
    orgIds: string[],
    monthKey: string,
  ): Promise<Map<string, number>> {
    if (orgIds.length === 0) return new Map();

    const results = await this.prisma.user.groupBy({
      by: ['organizationId'],
      where: {
        organizationId: { in: orgIds },
        deletedAt: null,
        isActive: true,
        platformRole: null,
        monthlyPaymentStatuses: {
          none: {
            monthKey,
            isPaid: true,
          },
        },
      },
      _count: true,
    });

    const map = new Map<string, number>();
    for (const r of results) {
      if (r.organizationId) {
        map.set(r.organizationId, r._count);
      }
    }
    return map;
  }

  private async getUnpaidCountAcrossPlatform(monthKey: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
        isActive: true,
        platformRole: null,
        monthlyPaymentStatuses: {
          none: {
            monthKey,
            isPaid: true,
          },
        },
      },
    });
  }

  private async getOrgsMissingWeeklyOrders(weekKey: string): Promise<number> {
    const orgs = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        groups: {
          some: {
            deletedAt: null,
            isActive: true,
            families: {
              some: { deletedAt: null },
            },
            weeklyOrders: {
              none: { weekKey },
            },
          },
        },
      },
      select: { id: true },
    });
    return orgs.length;
  }

  private async getOrgsMissingWeeklyDistributor(weekKey: string): Promise<number> {
    const orgs = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        groups: {
          some: {
            deletedAt: null,
            isActive: true,
            weeklyDistributorAssignments: {
              none: { weekKey },
            },
          },
        },
      },
      select: { id: true },
    });
    return orgs.length;
  }

  private normalizePhone(phone: string): string {
    const stripped = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (stripped.startsWith('+972')) {
      return '0' + stripped.slice(4);
    }
    return stripped;
  }

  private generateSlug(name: string): string {
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
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);

    if (!slug) {
      slug = 'org-' + Date.now();
    }

    return slug;
  }

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getCurrentWeekKey(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
    );
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  private mapToDto(organization: Record<string, unknown>): OrganizationResponseDto {
    const contactEmail = (organization.contactEmail as string) || undefined;
    const contactPhone = (organization.contactPhone as string) || undefined;
    return {
      id: organization.id as string,
      name: organization.name as string,
      slug: organization.slug as string,
      email: contactEmail,
      phone: contactPhone,
      contactEmail,
      contactPhone,
      address: (organization.address as string) || undefined,
      logoUrl: (organization.logoUrl as string) || undefined,
      status: organization.status as string,
      setupCompleted: organization.setupCompleted as boolean,
      settings: (organization.settings as Record<string, unknown>) || undefined,
      createdAt: organization.createdAt as Date,
      updatedAt: organization.updatedAt as Date,
    };
  }
}
