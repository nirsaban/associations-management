import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { GroupRole, Prisma, SystemRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

export type UserRoleFilter = 'all' | 'ADMIN' | 'USER' | 'GROUP_MANAGER' | 'GROUP_MEMBER';

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+972')) return '0' + trimmed.slice(4);
  if (trimmed.startsWith('972')) return '0' + trimmed.slice(3);
  return trimmed;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating user for organization ${organizationId}`);

    const phone = normalizePhone(createUserDto.phone);
    const rawPhone = createUserDto.phone.trim();
    // Also normalize the inverse — if someone enters 0XX we check +972XX too,
    // and vice versa. The DB has historical data in both formats.
    const legacyIntlPhone = phone.startsWith('0') ? `+972${phone.slice(1)}` : null;
    const fullName = stripHtml(createUserDto.fullName);

    // Look across ALL rows (including soft-deleted) because the UNIQUE
    // constraint (organizationId, phone) doesn't honour deletedAt. We use
    // $queryRaw so PrismaService's global soft-delete middleware (which
    // auto-injects `deletedAt: null` on findMany) doesn't hide rows we need
    // to restore — otherwise the create below trips a P2002 (500).
    const phoneVariants = [phone, rawPhone, legacyIntlPhone].filter(Boolean) as string[];
    const matching = await this.prisma.$queryRaw<
      Array<{
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
        deletedAt: Date | null;
      }>
    >`
      SELECT id, "fullName", phone, email, "deletedAt"
      FROM users
      WHERE "organizationId" = ${organizationId}
        AND phone IN (${Prisma.join(phoneVariants)})
    `;

    const activeMatch = matching.find(u => !u.deletedAt);
    if (activeMatch) {
      throw new ConflictException('משתמש עם מספר טלפון זה כבר קיים בעמותה');
    }

    // All matches are soft-deleted — restore the most recent one instead of
    // inserting a duplicate (which would trip the DB UNIQUE constraint).
    const softDeletedMatch = matching
      .filter(u => u.deletedAt)
      .sort((a, b) => (b.deletedAt!.getTime() - a.deletedAt!.getTime()))[0];
    if (softDeletedMatch) {
      this.logger.log(
        `Restoring soft-deleted user ${softDeletedMatch.id} for phone ${phone}`,
      );
      const restored = await this.prisma.user.update({
        where: { id: softDeletedMatch.id },
        data: {
          deletedAt: null,
          fullName,
          phone, // normalize to current canonical format (0...)
          email: createUserDto.email ?? softDeletedMatch.email,
          isActive: true,
        },
      });
      return this.mapToDto(restored);
    }

    // Email uniqueness within org only (also check soft-deleted to avoid DB conflicts)
    if (createUserDto.email) {
      const existingByEmail = await this.prisma.user.findFirst({
        where: { email: createUserDto.email, organizationId, deletedAt: null },
      });
      if (existingByEmail) {
        throw new ConflictException('משתמש עם כתובת אימייל זו כבר קיים בעמותה');
      }
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          organizationId,
          email: createUserDto.email ?? null,
          fullName,
          phone,
          systemRole: SystemRole.USER,
        },
      });

      return this.mapToDto(user);
    } catch (err) {
      // Safety net: if a row slipped through the lookup above (e.g. race
      // condition or a phone-format variant we didn't anticipate), surface a
      // proper 409 instead of leaking a Prisma 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined)?.join(',') ?? '';
        if (target.includes('phone')) {
          throw new ConflictException('משתמש עם מספר טלפון זה כבר קיים בעמותה');
        }
        if (target.includes('email')) {
          throw new ConflictException('משתמש עם כתובת אימייל זו כבר קיים בעמותה');
        }
        throw new ConflictException('משתמש עם נתונים אלו כבר קיים בעמותה');
      }
      throw err;
    }
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: UserRoleFilter,
  ): Promise<{ data: UserResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(
      `Finding users for organization ${organizationId}, page ${page}, search: ${search}, role: ${role}`,
    );

    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 10;
    const skip = (safePage - 1) * safeLimit;

    const searchClause = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    // Build role-specific filter. SystemRole filters go on User directly.
    // GroupRole filters require a join through GroupMembership.
    let roleClause: object = {};
    if (role === 'ADMIN') {
      roleClause = { systemRole: SystemRole.ADMIN };
    } else if (role === 'USER') {
      // Plain users: systemRole USER with no active MANAGER membership
      roleClause = {
        systemRole: SystemRole.USER,
        groupMemberships: {
          none: {
            status: 'ACTIVE',
            role: GroupRole.MANAGER,
          },
        },
      };
    } else if (role === 'GROUP_MANAGER') {
      roleClause = {
        groupMemberships: {
          some: {
            status: 'ACTIVE',
            role: GroupRole.MANAGER,
          },
        },
      };
    } else if (role === 'GROUP_MEMBER') {
      roleClause = {
        groupMemberships: {
          some: {
            status: 'ACTIVE',
            role: GroupRole.MEMBER,
          },
        },
      };
    }

    const where = {
      organizationId,
      deletedAt: null,
      ...searchClause,
      ...roleClause,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          groupMemberships: {
            where: { status: 'ACTIVE' },
            select: { groupId: true, role: true, group: { select: { name: true } } },
            take: 1,
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.mapToDto(user)),
      meta: { total, page: safePage, limit: safeLimit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<UserResponseDto> {
    this.logger.log(`Finding user ${id} in organization ${organizationId}`);

    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        groupMemberships: {
          where: { status: 'ACTIVE' },
          select: { groupId: true, role: true, group: { select: { name: true } } },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('משתמש לא נמצא');
    }

    return this.mapToDto(user);
  }

  async update(
    organizationId: string,
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user ${id} in organization ${organizationId}`);

    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('משתמש לא נמצא');
    }

    // Prevent admin from demoting themselves
    if (updateUserDto.systemRole && currentUserId === id && updateUserDto.systemRole !== user.systemRole) {
      throw new ForbiddenException('לא ניתן לשנות את התפקיד של עצמך');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          organizationId,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ConflictException('כתובת אימייל זו כבר בשימוש בעמותה');
      }
    }

    const fullName = updateUserDto.fullName !== undefined
      ? stripHtml(updateUserDto.fullName)
      : undefined;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(updateUserDto.email !== undefined && { email: updateUserDto.email }),
        ...(updateUserDto.isActive !== undefined && { isActive: updateUserDto.isActive }),
        ...(updateUserDto.systemRole !== undefined && { systemRole: updateUserDto.systemRole as SystemRole }),
      },
      include: {
        groupMemberships: {
          where: { status: 'ACTIVE' },
          select: { groupId: true, role: true, group: { select: { name: true } } },
          take: 1,
        },
      },
    });

    return this.mapToDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    this.logger.log(`Soft deleting user ${id} in organization ${organizationId}`);

    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('משתמש לא נמצא');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Hard delete: physically remove a user and all of their owned auxiliary
   * records. Used by ADMIN ("מחיקה לצמיתות") and SUPER_ADMIN.
   *
   * Several FKs to User don't have ON DELETE rules in the schema (default
   * RESTRICT in Postgres) — alerts, alert templates, tehillim activity,
   * pass-it-on items, weekly delivery markings — so deleting the row directly
   * would raise a FK violation. We clean those up inside a single transaction
   * and then delete the user; the Cascade/SetNull FKs (memberships, payments,
   * notifications, push subs, etc.) take care of themselves.
   */
  async hardRemove(organizationId: string, id: string, currentUserId?: string): Promise<void> {
    this.logger.log(`Hard deleting user ${id} in organization ${organizationId}`);

    if (currentUserId === id) {
      throw new ForbiddenException('לא ניתן למחוק את עצמך');
    }

    // $queryRaw bypasses both the soft-delete middleware (we want to delete
    // soft-deleted rows too) and the tenant middleware (we filter explicitly).
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; systemRole: string }>
    >`
      SELECT id, "systemRole"
      FROM users
      WHERE id = ${id} AND "organizationId" = ${organizationId}
    `;

    if (rows.length === 0) {
      throw new NotFoundException('משתמש לא נמצא');
    }

    const target = rows[0];

    if (target.systemRole === 'ADMIN') {
      const otherAdmins = await this.prisma.user.count({
        where: {
          organizationId,
          systemRole: SystemRole.ADMIN,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException('לא ניתן למחוק את האדמין האחרון של העמותה');
      }
    }

    await this.prisma.$transaction([
      // Nullable FKs without a SetNull rule — detach instead of cascading.
      this.prisma.passItOnItem.updateMany({
        where: { organizationId, claimedById: id },
        data: { claimedById: null },
      }),
      // RESTRICT FKs — must delete the dependent rows first.
      this.prisma.tehillimReading.deleteMany({ where: { userId: id } }),
      this.prisma.tehillimDedication.deleteMany({ where: { userId: id } }),
      this.prisma.weeklyFamilyDelivery.deleteMany({ where: { markedByUserId: id } }),
      this.prisma.passItOnItem.deleteMany({ where: { postedById: id } }),
      this.prisma.alert.deleteMany({ where: { publishedById: id } }),
      this.prisma.alertTemplate.deleteMany({ where: { createdById: id } }),
      // Now the user row — Cascade/SetNull FKs handle the rest.
      this.prisma.user.delete({ where: { id } }),
    ]);
  }

  private mapToDto(user: Record<string, unknown>): UserResponseDto {
    const memberships = (user.groupMemberships ?? []) as Array<{
      groupId: string;
      role: string;
      group: { name: string };
    }>;
    const membership = memberships[0] ?? null;

    return {
      id: user.id as string,
      organizationId: user.organizationId as string,
      email: user.email as string | undefined,
      fullName: user.fullName as string,
      phone: user.phone as string,
      systemRole: user.systemRole as string,
      isActive: user.isActive as boolean,
      groupId: membership?.groupId,
      groupName: membership?.group?.name,
      groupRole: membership?.role,
      createdAt: user.createdAt as Date,
      updatedAt: user.updatedAt as Date,
    };
  }
}
