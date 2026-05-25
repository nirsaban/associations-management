import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { FeatureFlagGuard, FeatureFlag } from '@common/guards/feature-flag.guard';
import { FEATURE_FLAGS } from '@common/feature-flags';
import { ProfessionsService } from './professions.service';
import {
  ProfessionCategoryDto,
  ProfessionSearchResultDto,
} from './dto/profession-list.dto';

@ApiTags('Community - Professions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag(FEATURE_FLAGS.COMMUNITY_PROFESSIONS)
@Controller('professions')
export class ProfessionsController {
  constructor(private readonly professionsService: ProfessionsService) {}

  @Get()
  @ApiOperation({
    summary: 'קטלוג מקצועות',
    description: 'מחזיר את כל הקטגוריות והמקצועות. ניתן לשמירה במטמון.',
  })
  async getCatalog(
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: ProfessionCategoryDto[] }> {
    res.setHeader('Cache-Control', 'public, max-age=300');
    const categories = await this.professionsService.getCatalog();
    return { data: categories };
  }

  @Get('search')
  @ApiOperation({
    summary: 'חיפוש מקצועות',
    description: 'חיפוש מקצועות לפי שם או שם קטגוריה. מוגבל ל-30 תוצאות.',
  })
  @ApiQuery({ name: 'q', required: true, description: 'מחרוזת חיפוש (מינימום תו אחד)' })
  async search(
    @Query('q') q: string,
  ): Promise<{ data: ProfessionSearchResultDto[] }> {
    if (!q || q.trim().length < 1) {
      throw new BadRequestException('חיפוש דורש לפחות תו אחד');
    }
    const results = await this.professionsService.search(q.trim());
    return { data: results };
  }
}
