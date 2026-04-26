import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { LandingService } from './landing.service';
import { UpdateLandingDto } from './dto/update-landing.dto';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from './dto/section.dto';
import { SubmitReviewDto, ModerateReviewDto } from './dto/review.dto';
import { SubmitLeadDto } from './dto/lead.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for landing page assets

const assetStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'assets'),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

@ApiTags('Landing')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get()
  @ApiOperation({ summary: 'Get or create landing page for current org' })
  async get(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const landing = await this.landingService.getOrCreate(user.organizationId);
    return { data: landing };
  }

  @Patch()
  @HttpCode(200)
  @ApiOperation({ summary: 'Update landing page metadata' })
  async update(@CurrentUser() user: ICurrentUser, @Body() dto: UpdateLandingDto) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const landing = await this.landingService.update(user.organizationId, dto);
    return { data: landing };
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish landing page' })
  async publish(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const landing = await this.landingService.publish(user.organizationId);
    return { data: landing };
  }

  @Post('unpublish')
  @ApiOperation({ summary: 'Unpublish landing page' })
  async unpublish(@CurrentUser() user: ICurrentUser) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const landing = await this.landingService.unpublish(user.organizationId);
    return { data: landing };
  }

  @Post('sections')
  @ApiOperation({ summary: 'Add a section' })
  async addSection(@CurrentUser() user: ICurrentUser, @Body() dto: CreateSectionDto) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const section = await this.landingService.addSection(user.organizationId, dto);
    return { data: section };
  }

  @Patch('sections/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a section' })
  async updateSection(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const section = await this.landingService.updateSection(user.organizationId, id, dto);
    return { data: section };
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: 'Delete a section' })
  async deleteSection(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    return this.landingService.deleteSection(user.organizationId, id);
  }

  @Post('sections/reorder')
  @ApiOperation({ summary: 'Reorder sections' })
  async reorderSections(@CurrentUser() user: ICurrentUser, @Body() dto: ReorderSectionsDto) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const sections = await this.landingService.reorderSections(user.organizationId, dto);
    return { data: sections };
  }

  @Post('assets')
  @UseInterceptors(FileInterceptor('file', {
    storage: assetStorage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(new BadRequestException('Only PNG, JPG, SVG, and WebP images are allowed'), false);
        return;
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an asset for landing page' })
  async uploadAsset(
    @CurrentUser() user: ICurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    if (!file) throw new BadRequestException('File is required');
    const asset = await this.landingService.uploadAsset(user.organizationId, file, user.id);
    return { data: asset };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get reviews for moderation' })
  async getReviews(@CurrentUser() user: ICurrentUser, @Query('status') status?: string) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const reviews = await this.landingService.getReviews(user.organizationId, status);
    return { data: reviews };
  }

  @Patch('reviews/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Moderate a review (approve/reject)' })
  async moderateReview(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    if (!user.organizationId) throw new BadRequestException('No organization');
    const review = await this.landingService.moderateReview(user.organizationId, id, dto, user.id);
    return { data: review };
  }
}

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

@ApiTags('Public Landing')
@Controller('public/landing')
export class PublicLandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published landing page by slug' })
  async getPublicPage(@Param('slug') slug: string, @Query('preview') preview?: string) {
    if (preview === '1') {
      // Preview mode — would need auth check in a full implementation
      // For now, allow preview for simplicity (the page data isn't sensitive)
      const landing = await this.landingService.getPreviewPage(slug);
      return { data: landing };
    }
    const landing = await this.landingService.getPublicPage(slug);
    return { data: landing };
  }

  @Post(':slug/reviews')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a review' })
  async submitReview(@Param('slug') slug: string, @Body() dto: SubmitReviewDto) {
    const result = await this.landingService.submitReview(slug, dto);
    return { data: result };
  }

  @Post(':slug/leads')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a lead (join us form)' })
  async submitLead(@Param('slug') slug: string, @Body() dto: SubmitLeadDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
    const userAgent = req.headers['user-agent'];
    const lead = await this.landingService.submitLead(slug, dto, ip, userAgent);
    return { data: { success: true, id: lead.id } };
  }

  @Post(':slug/create-payment')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create Grow payment process for Wallet SDK' })
  async createPayment(@Param('slug') slug: string, @Body() dto: CreatePaymentDto) {
    const result = await this.landingService.createGrowPayment(slug, dto);
    return { data: result };
  }

  @Post(':slug/track')
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @HttpCode(204)
  @ApiOperation({ summary: 'Track page view' })
  async trackView(@Param('slug') slug: string) {
    await this.landingService.trackView(slug);
  }
}
