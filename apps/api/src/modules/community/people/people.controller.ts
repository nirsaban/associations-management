import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { FeatureFlagGuard, FeatureFlag } from '@common/guards/feature-flag.guard';
import { FEATURE_FLAGS } from '@common/feature-flags';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { PeopleService } from './people.service';
import { PeopleSearchQueryDto } from './dto/people-search-query.dto';
import { PeopleSearchResultDto } from './dto/people-result.dto';

@ApiTags('Community - People')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag(FEATURE_FLAGS.COMMUNITY_PROFESSIONS)
@Controller('community/people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  @ApiOperation({
    summary: 'חיפוש אנשים בקהילה',
    description: 'מחזיר רשימה ממוספרת (cursor) של משתמשים שהסכימו להיות גלויים בקהילה.',
  })
  @ApiQuery({ name: 'name', required: false, description: 'חיפוש לפי שם' })
  @ApiQuery({ name: 'professionId', required: false, description: 'סינון לפי מזהה מקצוע' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'סינון לפי מזהה קטגוריה' })
  @ApiQuery({ name: 'q', required: false, description: 'חיפוש חופשי על שם ותיאור' })
  @ApiQuery({ name: 'cursor', required: false, description: 'cursor לדפדוף (מזהה המשתמש האחרון)' })
  @ApiQuery({ name: 'limit', required: false, description: 'מספר תוצאות לדף (ברירת מחדל 20, מקסימום 50)' })
  async search(
    @CurrentUser() user: ICurrentUser,
    @Query() query: PeopleSearchQueryDto,
  ): Promise<{ data: PeopleSearchResultDto }> {
    const result = await this.peopleService.search(user, query);
    return { data: result };
  }
}
