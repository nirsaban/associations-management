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
import { PlatformService } from './platform.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';
import { OrganizationResponseDto, OrganizationWithAdminDto } from './dto/organization-response.dto';

@ApiTags('Platform')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('organizations')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'יצירת ארגון חדש',
    description: 'יצירת ארגון חדש במערכת (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 201, type: OrganizationResponseDto })
  async createOrganization(
    @Body() createOrganizationDto: CreateOrganizationDto,
  ): Promise<{ data: OrganizationResponseDto }> {
    const organization = await this.platformService.createOrganization(createOrganizationDto);
    return { data: organization };
  }

  @Post('organizations/:id/first-admin')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'יצירת מנהל ראשון לארגון',
    description: 'יצירת משתמש מנהל ראשון לארגון לפי מספר טלפון (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 201 })
  async createFirstAdmin(
    @Param('id') id: string,
    @Body() createFirstAdminDto: CreateFirstAdminDto,
  ): Promise<{ data: { admin: Record<string, unknown>; organization: OrganizationResponseDto } }> {
    const result = await this.platformService.createFirstAdmin(id, createFirstAdminDto);
    return { data: result };
  }

  @Get('organizations')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'List organizations',
    description: 'Get all organizations with pagination and search (SUPER_ADMIN only)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or slug' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
    example: 'all',
  })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<{ data: OrganizationResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.platformService.findAll(page, limit, search, status);
  }

  @Get('organizations/:id')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'פרטי ארגון',
    description: 'קבלת פרטי ארגון כולל פרטי מנהל ראשון (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationWithAdminDto })
  async findOne(@Param('id') id: string): Promise<{ data: OrganizationWithAdminDto }> {
    const organization = await this.platformService.findOne(id);
    return { data: organization };
  }

  @Patch('organizations/:id')
  @SuperAdminOnly()
  @HttpCode(200)
  @ApiOperation({
    summary: 'עדכון ארגון',
    description: 'עדכון פרטי ארגון (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async updateOrganization(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateOrganizationDto>,
  ): Promise<{ data: OrganizationResponseDto }> {
    const organization = await this.platformService.updateOrganization(id, updateDto);
    return { data: organization };
  }

  @Patch('organizations/:id/status')
  @SuperAdminOnly()
  @HttpCode(200)
  @ApiOperation({
    summary: 'שינוי סטטוס ארגון',
    description: 'הפעלה או השבתה של ארגון (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<{ data: OrganizationResponseDto }> {
    const organization = await this.platformService.toggleStatus(id, isActive);
    return { data: organization };
  }
}
