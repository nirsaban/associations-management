import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { FeatureFlagGuard, FeatureFlag } from '@common/guards/feature-flag.guard';
import { FEATURE_FLAGS } from '@common/feature-flags';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { TehillimService } from './tehillim.service';
import { DedicateTehillimDto } from './dto/dedicate.dto';

@ApiTags('Community - Tehillim')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag(FEATURE_FLAGS.COMMUNITY_PROFESSIONS)
@Controller('community/tehillim')
export class TehillimController {
  constructor(private readonly service: TehillimService) {}

  @Get('today')
  @ApiOperation({ summary: 'התהילים היומי + סטטוס המשתמש' })
  async today(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const data = await this.service.getToday(user.organizationId, user.sub);
    return { data };
  }

  @Post('dedicate')
  @ApiOperation({ summary: 'שריון מקום והקדשה (היום או מחר)' })
  @ApiQuery({ name: 'for', required: false, enum: ['today', 'tomorrow'] })
  async dedicate(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: DedicateTehillimDto,
    @Query('for') forDate?: 'today' | 'tomorrow',
  ) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const data = await this.service.dedicate(
      user.organizationId,
      user.sub,
      dto,
      forDate === 'tomorrow',
    );
    return { data };
  }

  @Post('read')
  @ApiOperation({ summary: 'אישור קריאת הפרק' })
  async read(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const data = await this.service.confirmRead(user.organizationId, user.sub);
    return { data };
  }
}
