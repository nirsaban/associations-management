import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyResponseDto } from './dto/family-response.dto';

@ApiTags('Families')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Create family',
    description: 'Create a new family record',
  })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() createFamilyDto: CreateFamilyDto,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.create(user.organizationId, createFamilyDto);
    return { data: family };
  }

  @Get()
  @ApiOperation({
    summary: 'List families',
    description: 'List all families in the organization',
  })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<object> {
    return this.familiesService.findAll(user.organizationId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get family',
    description: 'Get a specific family record',
  })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.findOne(user.organizationId, id);
    return { data: family };
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Update family',
    description: 'Update family information',
  })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.update(user.organizationId, id, updateFamilyDto);
    return { data: family };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete family',
    description: 'Soft delete a family record',
  })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string): Promise<void> {
    await this.familiesService.remove(user.organizationId, id);
  }

  @Post(':id/groups/:groupId')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Link family to group',
    description: 'Associate a family with a group',
  })
  async linkToGroup(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.linkToGroup(user.organizationId, id, groupId);
    return { data: family };
  }

  @Delete(':id/groups/:groupId')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Unlink family from group',
    description: 'Remove association between family and group',
  })
  async unlinkFromGroup(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.unlinkFromGroup(user.organizationId, id, groupId);
    return { data: family };
  }
}
