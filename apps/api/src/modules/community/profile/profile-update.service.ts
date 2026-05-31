import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { PlatformRole } from '@prisma/client';
import type { CurrentUser } from '@common/decorators/current-user.decorator';
import { UpdateProfessionsDto } from './dto/update-professions.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateBioDto } from './dto/update-bio.dto';

export interface ProfessionWithCategory {
  id: string;
  nameHe: string;
  category: { id: string; nameHe: string };
}

export interface UserProfessionsResult {
  primary: ProfessionWithCategory | null;
  secondary: ProfessionWithCategory[];
  otherProfession: string | null;
}

@Injectable()
export class ProfileUpdateService {
  private readonly logger = new Logger(ProfileUpdateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateProfessions(
    currentUser: CurrentUser,
    dto: UpdateProfessionsDto,
  ): Promise<UserProfessionsResult> {
    // SUPER_ADMIN cannot have professions
    if (currentUser.platformRole === PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException({
        message: 'אין אפשרות לערוך מקצוע עבור סופר אדמין',
        code: 'SUPER_ADMIN_NO_PROFESSION',
      });
    }

    const userId = currentUser.sub;
    const organizationId = currentUser.organizationId;

    // Collect all professionIds to validate in one query.
    // Primary is optional — onboarding allows submitting without any profession.
    const secondaryIds = dto.secondary ?? [];
    const allIds = [...(dto.primary ? [dto.primary] : []), ...secondaryIds];

    // Validate no duplicates between primary and secondary
    if (dto.primary && secondaryIds.includes(dto.primary)) {
      throw new BadRequestException({
        message: 'מקצוע לא תקין',
        code: 'INVALID_PROFESSION',
      });
    }

    // Validate uniqueness in secondary list itself
    const uniqueSecondary = [...new Set(secondaryIds)];
    if (uniqueSecondary.length !== secondaryIds.length) {
      throw new BadRequestException({
        message: 'מקצוע לא תקין',
        code: 'INVALID_PROFESSION',
      });
    }

    // Validate all provided professionIds exist in the catalog
    const foundProfessions =
      allIds.length > 0
        ? await this.prisma.profession.findMany({
            where: { id: { in: allIds } },
            select: {
              id: true,
              nameHe: true,
              category: { select: { id: true, nameHe: true } },
            },
          })
        : [];

    if (foundProfessions.length !== allIds.length) {
      throw new BadRequestException({
        message: 'מקצוע לא תקין',
        code: 'INVALID_PROFESSION',
      });
    }

    const professionMap = new Map(foundProfessions.map((p) => [p.id, p]));
    const primaryProfession = dto.primary
      ? professionMap.get(dto.primary)!
      : null;

    // Transactional: delete all existing rows, then insert new ones + update user
    const otherProfession =
      dto.otherProfession && dto.otherProfession.trim().length > 0
        ? dto.otherProfession.trim()
        : null;

    await this.prisma.$transaction([
      // Delete all existing UserProfession rows for this user
      this.prisma.userProfession.deleteMany({
        where: { userId, organizationId },
      }),

      // Insert primary (if provided)
      ...(dto.primary
        ? [
            this.prisma.userProfession.create({
              data: {
                organizationId,
                userId,
                professionId: dto.primary,
                isPrimary: true,
              },
            }),
          ]
        : []),

      // Insert secondary rows (if any)
      ...uniqueSecondary.map((professionId) =>
        this.prisma.userProfession.create({
          data: {
            organizationId,
            userId,
            professionId,
            isPrimary: false,
          },
        }),
      ),

      // Update otherProfession on User
      this.prisma.user.update({
        where: { id: userId },
        data: { otherProfession },
      }),
    ]);

    this.logger.log(`Updated professions for user ${userId} in org ${organizationId}`);

    return {
      primary: primaryProfession
        ? {
            id: primaryProfession.id,
            nameHe: primaryProfession.nameHe,
            category: primaryProfession.category,
          }
        : null,
      secondary: uniqueSecondary.map((id) => {
        const p = professionMap.get(id)!;
        return { id: p.id, nameHe: p.nameHe, category: p.category };
      }),
      otherProfession,
    };
  }

  async updatePrivacy(
    currentUser: CurrentUser,
    dto: UpdatePrivacyDto,
  ): Promise<{ showInCommunitySearch: boolean }> {
    const userId = currentUser.sub;
    const organizationId = currentUser.organizationId;

    this.logger.log(`Updating privacy for user ${userId} in org ${organizationId}`);

    const updated = await this.prisma.user.update({
      where: { id: userId, organizationId },
      data: { showInCommunitySearch: dto.showInCommunitySearch },
      select: { showInCommunitySearch: true },
    });

    return { showInCommunitySearch: updated.showInCommunitySearch };
  }

  async updateBio(
    currentUser: CurrentUser,
    dto: UpdateBioDto,
  ): Promise<{ shortBio: string | null }> {
    const userId = currentUser.sub;
    const organizationId = currentUser.organizationId;

    this.logger.log(`Updating bio for user ${userId} in org ${organizationId}`);

    const trimmed = dto.shortBio.trim();
    const shortBio = trimmed.length > 0 ? trimmed : null;

    const updated = await this.prisma.user.update({
      where: { id: userId, organizationId },
      data: { shortBio },
      select: { shortBio: true },
    });

    return { shortBio: updated.shortBio };
  }
}
