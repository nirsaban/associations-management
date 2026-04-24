import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { SystemRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+972')) return trimmed;
  if (trimmed.startsWith('0')) return '+972' + trimmed.slice(1);
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
    const fullName = stripHtml(createUserDto.fullName);

    // Phone is unique within an organization — check both normalized and raw formats
    const existingByPhone = await this.prisma.user.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [{ phone }, { phone: rawPhone }],
      },
    });

    if (existingByPhone) {
      throw new ConflictException('משתמש עם מספר טלפון זה כבר קיים בעמותה');
    }

    // Email uniqueness within org only
    if (createUserDto.email) {
      const existingByEmail = await this.prisma.user.findFirst({
        where: { email: createUserDto.email, organizationId, deletedAt: null },
      });
      if (existingByEmail) {
        throw new ConflictException('משתמש עם כתובת אימייל זו כבר קיים בעמותה');
      }
    }

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
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: UserResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding users for organization ${organizationId}, page ${page}, search: ${search}`);

    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 10;
    const skip = (safePage - 1) * safeLimit;

    const where = {
      organizationId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
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
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user ${id} in organization ${organizationId}`);

    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('משתמש לא נמצא');
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

  private mapToDto(user: Record<string, unknown>): UserResponseDto {
    return {
      id: user.id as string,
      organizationId: user.organizationId as string,
      email: user.email as string | undefined,
      fullName: user.fullName as string,
      phone: user.phone as string,
      systemRole: user.systemRole as string,
      isActive: user.isActive as boolean,
      createdAt: user.createdAt as Date,
      updatedAt: user.updatedAt as Date,
    };
  }
}
