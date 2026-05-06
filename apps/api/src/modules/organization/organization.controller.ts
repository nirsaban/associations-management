import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { OrganizationService } from './organization.service';
import { SetupOrganizationDto } from './dto/setup-organization.dto';
import { OnboardingStep1Dto } from './dto/onboarding-step1.dto';
import { OnboardingStep2Dto } from './dto/onboarding-step2.dto';
import { OnboardingStep3Dto } from './dto/onboarding-step3.dto';
import { UpdateOrgProfileDto } from './dto/update-profile.dto';
import { OrganizationResponseDto } from '@modules/platform/dto/organization-response.dto';
import { PrismaService } from '@common/prisma/prisma.service';
import { CloudinaryService } from '@common/services/cloudinary.service';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('me')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get my organization',
    description: 'Get current user\'s organization details (ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async getMyOrganization(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const organization = await this.organizationService.getMyOrganization(
      user.id,
      user.organizationId,
    );
    return { data: organization };
  }

  @Patch('me/setup')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete organization setup',
    description: 'Complete the setup wizard for current organization (ADMIN only). Sets setupCompleted=true.',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async completeSetup(
    @CurrentUser() user: ICurrentUser,
    @Body() setupDto: SetupOrganizationDto,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const organization = await this.organizationService.completeSetup(
      user.id,
      user.organizationId,
      setupDto,
    );
    return { data: organization };
  }

  @Patch('me/onboarding/step-1')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Onboarding step 1 — organization details',
    description: 'Save name, address, logo, description',
  })
  async onboardingStep1(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: OnboardingStep1Dto,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const organization = await this.organizationService.saveOnboardingStep1(
      user.id,
      user.organizationId,
      dto,
    );
    return { data: organization };
  }

  @Patch('me/onboarding/step-2')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Onboarding step 2 — payment info',
    description: 'Save payment link and description',
  })
  async onboardingStep2(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: OnboardingStep2Dto,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const organization = await this.organizationService.saveOnboardingStep2(
      user.id,
      user.organizationId,
      dto,
    );
    return { data: organization };
  }

  @Patch('me/onboarding/step-3')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Onboarding step 3 — contact info (completes setup)',
    description: 'Save contact details and set setupCompleted=true',
  })
  async onboardingStep3(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: OnboardingStep3Dto,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const organization = await this.organizationService.saveOnboardingStep3(
      user.id,
      user.organizationId,
      dto,
    );
    return { data: organization };
  }

  @Post('me/logo')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Upload organization logo',
    description: 'Upload logo for current organization (ADMIN only). Expects logoUrl in body.',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async uploadLogo(
    @CurrentUser() user: ICurrentUser,
    @Body('logoUrl') logoUrl: string,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    if (!logoUrl) {
      throw new BadRequestException('logoUrl is required');
    }

    const organization = await this.organizationService.uploadLogo(
      user.id,
      user.organizationId,
      logoUrl,
    );
    return { data: organization };
  }

  // =============== PROFILE ENDPOINTS ===============

  @Get('profile')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get organization profile' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async getProfile(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const organization = await this.organizationService.getMyOrganization(
      user.id,
      user.organizationId,
    );
    return { data: organization };
  }

  @Patch('profile')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update organization profile' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async updateProfile(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateOrgProfileDto,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const organization = await this.organizationService.updateProfile(
      user.id,
      user.organizationId,
      dto,
    );
    return { data: organization };
  }

  @Post('profile/logo')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(new BadRequestException('יש להעלות קובץ תמונה מסוג PNG, JPG, SVG או WebP בלבד.'), false);
        return;
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'העלאת לוגו לעמותה',
    description: 'העלאת קובץ תמונה כלוגו של העמותה לשרת Cloudinary. מותר: PNG, JPG, SVG, WebP עד 2MB. נדרש תפקיד ADMIN.',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async uploadLogoFile(
    @CurrentUser() user: ICurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    if (!file) {
      throw new BadRequestException('יש לצרף קובץ תמונה.');
    }

    // Upload to Cloudinary via shared service
    const uploaded = await this.cloudinaryService.uploadImage(
      file,
      `amutot/${user.organizationId}/logos`,
    );

    // Persist asset record for audit trail
    const asset = await this.prisma.asset.create({
      data: {
        organizationId: user.organizationId,
        kind: 'IMAGE',
        url: uploaded.secureUrl,
        mime: file.mimetype,
        bytes: uploaded.bytes,
        createdById: user.id,
      },
    });

    const organization = await this.organizationService.uploadLogo(
      user.id,
      user.organizationId,
      uploaded.secureUrl,
      asset.id,
    );
    return { data: organization };
  }

  @Delete('profile/logo')
  @Roles('ADMIN')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove organization logo' })
  async removeLogo(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }
    const organization = await this.organizationService.removeLogo(
      user.id,
      user.organizationId,
    );
    return { data: organization };
  }
}
