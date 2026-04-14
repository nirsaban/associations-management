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
import { CreateAssociationDto } from './dto/create-association.dto';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';
import { AssociationResponseDto, AssociationWithAdminDto } from './dto/association-response.dto';

@ApiTags('Platform')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('associations')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'Create association',
    description: 'Create a new organization (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 201, type: AssociationResponseDto })
  async createAssociation(
    @Body() createAssociationDto: CreateAssociationDto,
  ): Promise<{ data: AssociationResponseDto }> {
    const association = await this.platformService.createAssociation(createAssociationDto);
    return { data: association };
  }

  @Post('associations/:id/first-admin')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'Create first admin',
    description: 'Create the first admin user for an association (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 201 })
  async createFirstAdmin(
    @Param('id') id: string,
    @Body() createFirstAdminDto: CreateFirstAdminDto,
  ): Promise<{ data: { admin: Record<string, unknown>; association: AssociationResponseDto } }> {
    const result = await this.platformService.createFirstAdmin(id, createFirstAdminDto);
    return { data: result };
  }

  @Get('associations')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'List associations',
    description: 'Get all associations with pagination and search (SUPER_ADMIN only)',
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
  ): Promise<{ data: AssociationResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.platformService.findAll(page, limit, search, status);
  }

  @Get('associations/:id')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'Get association',
    description: 'Get association details with first admin info (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: AssociationWithAdminDto })
  async findOne(@Param('id') id: string): Promise<{ data: AssociationWithAdminDto }> {
    const association = await this.platformService.findOne(id);
    return { data: association };
  }

  @Patch('associations/:id/status')
  @SuperAdminOnly()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Toggle association status',
    description: 'Enable or disable an association (SUPER_ADMIN only)',
  })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  async toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<{ data: AssociationResponseDto }> {
    const association = await this.platformService.toggleStatus(id, isActive);
    return { data: association };
  }
}
