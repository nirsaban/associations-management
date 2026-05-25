import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { FeatureFlagGuard, FeatureFlag } from '@common/guards/feature-flag.guard';
import { FEATURE_FLAGS } from '@common/feature-flags';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { PassItOnService } from './pass-it-on.service';
import { CreatePassItOnItemDto } from './dto/create-item.dto';
import { PassItOnCategory, PassItOnStatus } from '@prisma/client';

@ApiTags('Community - Pass It On')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag(FEATURE_FLAGS.COMMUNITY_PROFESSIONS)
@Controller('community/pass-it-on')
export class PassItOnController {
  constructor(private readonly service: PassItOnService) {}

  @Get()
  @ApiOperation({ summary: 'רשימת פריטים למסירה' })
  @ApiQuery({ name: 'status', required: false, enum: PassItOnStatus })
  @ApiQuery({ name: 'category', required: false, enum: PassItOnCategory })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false })
  async list(
    @CurrentUser() user: ICurrentUser,
    @Query('status') status?: PassItOnStatus,
    @Query('category') category?: PassItOnCategory,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const result = await this.service.list(user.organizationId, {
      status,
      category,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
      q,
    });
    return { data: result.data, meta: { nextCursor: result.nextCursor } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'פרטי פריט' })
  async findOne(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const item = await this.service.findOne(user.organizationId, id);
    return { data: item };
  }

  @Post()
  @ApiOperation({ summary: 'פרסום פריט חדש למסירה' })
  async create(@CurrentUser() user: ICurrentUser, @Body() dto: CreatePassItOnItemDto) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const item = await this.service.create(user.organizationId, user.sub, dto);
    return { data: item };
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'שריון פריט (מסומן כנתפס למי שלחץ)' })
  async claim(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const item = await this.service.claim(user.organizationId, id, user.sub);
    return { data: item };
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'שחרור פריט בחזרה לזמין' })
  async release(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const item = await this.service.release(user.organizationId, id, user.sub);
    return { data: item };
  }

  @Patch(':id/taken')
  @ApiOperation({ summary: 'סימון כנמסר (רק המפרסם)' })
  async markTaken(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const item = await this.service.markTaken(user.organizationId, id, user.sub);
    return { data: item };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'מחיקה רכה (רק המפרסם או אדמין)' })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const isAdmin = user.systemRole === 'ADMIN';
    await this.service.remove(user.organizationId, id, user.sub, isAdmin);
    return { data: { success: true } };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException('רק תמונות PNG/JPG/WebP'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'העלאת תמונה לפריט' })
  async upload(@CurrentUser() user: ICurrentUser, @UploadedFile() file: Express.Multer.File) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    if (!file) throw new BadRequestException('חסר קובץ');
    const url = await this.service.uploadImage(user.organizationId, file);
    return { data: { url } };
  }
}
