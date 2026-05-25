import {
  Controller,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { FeatureFlagGuard, FeatureFlag } from '@common/guards/feature-flag.guard';
import { FEATURE_FLAGS } from '@common/feature-flags';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { ProfileUpdateService, UserProfessionsResult } from './profile-update.service';
import { UpdateProfessionsDto } from './dto/update-professions.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateBioDto } from './dto/update-bio.dto';

@ApiTags('Community - Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag(FEATURE_FLAGS.COMMUNITY_PROFESSIONS)
@Controller('users/me')
export class ProfileUpdateController {
  constructor(private readonly profileUpdateService: ProfileUpdateService) {}

  @Put('professions')
  @ApiOperation({
    summary: 'עדכון מקצועות משתמש',
    description: 'מחליף את כל המקצועות של המשתמש המחובר. דורש מקצוע ראשי תקין.',
  })
  async updateProfessions(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateProfessionsDto,
  ): Promise<{ data: UserProfessionsResult }> {
    const result = await this.profileUpdateService.updateProfessions(user, dto);
    return { data: result };
  }

  @Put('privacy')
  @ApiOperation({
    summary: 'עדכון הגדרות פרטיות',
    description: 'שינוי נראות המשתמש בחיפוש הקהילה.',
  })
  async updatePrivacy(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdatePrivacyDto,
  ): Promise<{ data: { showInCommunitySearch: boolean } }> {
    const result = await this.profileUpdateService.updatePrivacy(user, dto);
    return { data: result };
  }

  @Put('bio')
  @ApiOperation({
    summary: 'עדכון ביוגרפיה',
    description: 'עדכון תיאור קצר של המשתמש (עד 280 תווים). מחרוזת ריקה מנקה.',
  })
  async updateBio(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateBioDto,
  ): Promise<{ data: { shortBio: string | null } }> {
    const result = await this.profileUpdateService.updateBio(user, dto);
    return { data: result };
  }
}
