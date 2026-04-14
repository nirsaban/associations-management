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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating user for organization ${organizationId}`);

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: createUserDto.email }, { phone: createUserDto.phone }],
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        organizationId,
        email: createUserDto.email,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        systemRole: createUserDto.systemRole as SystemRole,
      },
    });

    return this.mapToDto(user);
  }

  async findAll(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: UserResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Finding users for organization ${organizationId}, page ${page}`);

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: users.map((user) => this.mapToDto(user)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(organizationId: string, id: string): Promise<UserResponseDto> {
    this.logger.log(`Finding user ${id} in organization ${organizationId}`);

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToDto(user);
  }

  async update(
    organizationId: string,
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user ${id} in organization ${organizationId}`);

    // Verify user exists in this organization
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for email/phone uniqueness if provided
    if (updateUserDto.email || updateUserDto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { email: updateUserDto.email || undefined },
                { phone: updateUserDto.phone || undefined },
              ],
            },
            { deletedAt: null },
          ],
        },
      });

      if (existing) {
        throw new ConflictException('Email or phone already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.fullName !== undefined && { fullName: updateUserDto.fullName }),
        ...(updateUserDto.phone !== undefined && { phone: updateUserDto.phone }),
        ...(updateUserDto.email !== undefined && { email: updateUserDto.email }),
        ...(updateUserDto.systemRole !== undefined && { systemRole: updateUserDto.systemRole as SystemRole }),
      },
    });

    return this.mapToDto(updated);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    this.logger.log(`Soft deleting user ${id} in organization ${organizationId}`);

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private mapToDto(user: Record<string, unknown>): UserResponseDto {
    return {
      id: user.id as string,
      organizationId: user.organizationId as string,
      email: user.email as string,
      fullName: user.fullName as string,
      phone: user.phone as string,
      systemRole: user.systemRole as string,
      createdAt: user.createdAt as Date,
      updatedAt: user.updatedAt as Date,
    };
  }
}
