import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '@common/guards/super-admin.guard';
import { SuperAdminOnly } from '@common/decorators/super-admin-only.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PlatformService } from './platform.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { CreateOrganizationWithAdminDto } from './dto/create-organization-with-admin.dto';
import { UpdateOrganizationStatusDto } from './dto/update-organization-status.dto';
import { OrganizationListItemDto, OrganizationDetailDto } from './dto/organization-list-response.dto';
import { PlatformOverviewResponseDto } from './dto/platform-overview-response.dto';

@ApiTags('Platform')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  // ─── New endpoints per spec ───────────────────────────────────────────

  @Post('organizations')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'יצירת עמותה + מנהל ראשון',
    description: 'יצירת עמותה חדשה עם מנהל ראשון בטרנזקציה אחת (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 201, description: 'העמותה והמנהל נוצרו בהצלחה' })
  @ApiResponse({ status: 409, description: 'Slug או מספר טלפון כבר קיימים' })
  async createOrganizationWithAdmin(
    @Body() dto: CreateOrganizationWithAdminDto,
    @CurrentUser() user: { sub: string },
  ): Promise<{ data: { organization: OrganizationResponseDto; admin: { id: string; fullName: string; phone: string } } }> {
    const result = await this.platformService.createOrganizationWithAdmin(dto, user.sub);
    return { data: result };
  }

  @Get('overview')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'סקירת פלטפורמה',
    description: 'מספרים כלליים ברמת הפלטפורמה (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: PlatformOverviewResponseDto })
  async getOverview(): Promise<{ data: PlatformOverviewResponseDto }> {
    const overview = await this.platformService.getOverview();
    return { data: overview };
  }

  @Get('organizations')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'רשימת עמותות עם ספירות',
    description: 'כל העמותות עם ספירות משתמשים, קבוצות, משפחות ולא שילמו (SUPER_ADMIN only)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'חיפוש לפי שם או slug' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'all'], example: 'all' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<{ data: OrganizationListItemDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.platformService.findAllWithCounts(page, limit, search, status);
  }

  @Get('organizations/:id')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'פרטי עמותה מלאים',
    description: 'פרטי עמותה עם מנהלים וספירות (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationDetailDto })
  @ApiResponse({ status: 404, description: 'העמותה לא נמצאה' })
  async findOne(@Param('id') id: string): Promise<{ data: OrganizationDetailDto }> {
    const organization = await this.platformService.findOneWithDetails(id);
    return { data: organization };
  }

  @Patch('organizations/:id/status')
  @SuperAdminOnly()
  @HttpCode(200)
  @ApiOperation({
    summary: 'שינוי סטטוס עמותה',
    description: 'הפעלה או השבתה של עמותה (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'העמותה לא נמצאה' })
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationStatusDto,
  ): Promise<{ data: OrganizationResponseDto }> {
    const organization = await this.platformService.toggleStatus(id, dto.status);
    return { data: organization };
  }

  // ─── Legacy endpoints (kept for backward compat) ──────────────────────

  @Post('organizations/:id/first-admin')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'יצירת מנהל ראשון לעמותה (legacy)',
    description: 'יצירת משתמש מנהל ראשון לעמותה לפי מספר טלפון (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 201 })
  async createFirstAdmin(
    @Param('id') id: string,
    @Body() createFirstAdminDto: CreateFirstAdminDto,
  ): Promise<{ data: { admin: Record<string, unknown>; organization: OrganizationResponseDto } }> {
    const result = await this.platformService.createFirstAdmin(id, createFirstAdminDto);
    return { data: result };
  }

  @Patch('organizations/:id')
  @SuperAdminOnly()
  @HttpCode(200)
  @ApiOperation({
    summary: 'עדכון עמותה',
    description: 'עדכון פרטי עמותה (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async updateOrganization(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateOrganizationDto>,
  ): Promise<{ data: OrganizationResponseDto }> {
    const organization = await this.platformService.updateOrganization(id, updateDto);
    return { data: organization };
  }
}
