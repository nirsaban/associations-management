import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { CurrentUser } from '@common/decorators/current-user.decorator';
import { PeopleSearchQueryDto } from './dto/people-search-query.dto';
import { PeopleSearchResultDto, PersonResultDto } from './dto/people-result.dto';

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(
    currentUser: CurrentUser,
    query: PeopleSearchQueryDto,
  ): Promise<PeopleSearchResultDto> {
    const organizationId = currentUser.organizationId;
    const requestingUserId = currentUser.sub;
    const limit = Math.min(query.limit ?? 20, 50);

    this.logger.log(
      `People search in org ${organizationId} by user ${requestingUserId}`,
    );

    // Build where clause
    const where: Prisma.UserWhereInput = {
      organizationId,
      deletedAt: null,
      showInCommunitySearch: true,
      // Exclude the requesting user
      id: { not: requestingUserId },
      // Exclude SUPER_ADMIN users (defensive)
      platformRole: null,
    };

    // Name filter
    if (query.name) {
      where.fullName = { contains: query.name, mode: 'insensitive' };
    }

    // Profession filter
    if (query.professionId) {
      where.userProfessions = {
        some: { professionId: query.professionId, organizationId },
      };
    }

    // Category filter
    if (query.categoryId) {
      where.userProfessions = {
        some: {
          organizationId,
          profession: { categoryId: query.categoryId },
        },
      };
    }

    // Full-text-ish filter on name OR bio
    if (query.q) {
      where.OR = [
        { fullName: { contains: query.q, mode: 'insensitive' } },
        { shortBio: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    // Cursor pagination
    if (query.cursor) {
      where.id = { gt: query.cursor };
    }

    // Fetch limit+1 to detect if there is a next page
    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        otherProfession: true,
        shortBio: true,
        phone: true,
        userProfessions: {
          where: { organizationId },
          select: {
            isPrimary: true,
            profession: {
              select: {
                id: true,
                nameHe: true,
                category: { select: { id: true, nameHe: true } },
              },
            },
          },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    const hasNextPage = users.length > limit;
    const pageUsers = hasNextPage ? users.slice(0, limit) : users;

    const items: PersonResultDto[] = pageUsers.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl ?? null,
      professions: u.userProfessions.map((up) => ({
        id: up.profession.id,
        nameHe: up.profession.nameHe,
        isPrimary: up.isPrimary,
        category: up.profession.category,
      })),
      otherProfession: u.otherProfession ?? null,
      shortBio: u.shortBio ?? null,
      phone: u.phone ?? null,
    }));

    return {
      items,
      nextCursor: hasNextPage ? pageUsers[pageUsers.length - 1].id : null,
    };
  }
}
