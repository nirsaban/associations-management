import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { FeatureFlagGuard, FeatureFlag } from '@common/guards/feature-flag.guard';
import { FEATURE_FLAGS } from '@common/feature-flags';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { BusinessesService } from './businesses.service';
import { UpsertBusinessDto } from './dto/upsert-business.dto';

@ApiTags('Community - Businesses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag(FEATURE_FLAGS.COMMUNITY_PROFESSIONS)
@Controller('community/businesses')
export class BusinessesController {
  constructor(private readonly service: BusinessesService) {}

  @Get()
  @ApiOperation({ summary: 'רשימת עסקים פעילים לסליידר הקהילתי' })
  async list(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const data = await this.service.listForOrg(user.organizationId);
    return { data };
  }

  @Get('me')
  @ApiOperation({ summary: 'העסק שלי' })
  async getMine(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const data = await this.service.getMine(user.organizationId, user.sub);
    return { data };
  }

  @Put('me')
  @ApiOperation({ summary: 'יצירה/עדכון של העסק שלי (upsert)' })
  async upsertMine(@CurrentUser() user: ICurrentUser, @Body() dto: UpsertBusinessDto) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const data = await this.service.upsertMine(user.organizationId, user.sub, dto);
    return { data };
  }

  @Delete('me')
  @ApiOperation({ summary: 'מחיקת העסק שלי (soft delete)' })
  async deleteMine(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    await this.service.deleteMine(user.organizationId, user.sub);
    return { data: { success: true } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'פרטי עסק לפי מזהה' })
  async findOne(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const data = await this.service.findById(user.organizationId, id);
    return { data };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException('רק PNG/JPG/WebP/SVG'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'העלאת לוגו / תמונת כיסוי' })
  async upload(@CurrentUser() user: ICurrentUser, @UploadedFile() file: Express.Multer.File) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    if (!file) throw new BadRequestException('חסר קובץ');
    const url = await this.service.uploadImage(user.organizationId, file);
    return { data: { url } };
  }
}
