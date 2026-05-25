import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import {
  ProfessionCategoryDto,
  ProfessionSearchResultDto,
} from './dto/profession-list.dto';

@Injectable()
export class ProfessionsService {
  private readonly logger = new Logger(ProfessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the full profession catalog ordered by sortOrder then nameHe.
   * Platform-level — not tenant-scoped.
   */
  async getCatalog(): Promise<ProfessionCategoryDto[]> {
    this.logger.log('Fetching profession catalog');

    const categories = await this.prisma.professionCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameHe: 'asc' }],
      include: {
        professions: {
          orderBy: [{ sortOrder: 'asc' }, { nameHe: 'asc' }],
          select: { id: true, nameHe: true, sortOrder: true },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      nameHe: cat.nameHe,
      sortOrder: cat.sortOrder,
      professions: cat.professions,
    }));
  }

  /**
   * Case-insensitive search across Profession.nameHe and ProfessionCategory.nameHe.
   * Returns professions whose own name matches OR whose category name matches.
   * Capped at 30 results.
   */
  async search(q: string): Promise<ProfessionSearchResultDto[]> {
    this.logger.log(`Searching professions with query: "${q}"`);

    const professions = await this.prisma.profession.findMany({
      where: {
        OR: [
          { nameHe: { contains: q, mode: 'insensitive' } },
          { category: { nameHe: { contains: q, mode: 'insensitive' } } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { nameHe: 'asc' }],
      take: 30,
      select: {
        id: true,
        nameHe: true,
        category: { select: { id: true, nameHe: true } },
      },
    });

    return professions;
  }
}
