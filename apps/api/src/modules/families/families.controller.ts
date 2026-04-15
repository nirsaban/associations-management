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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AssignGroupDto } from './dto/assign-group.dto';
import { FamilyResponseDto } from './dto/family-response.dto';

@ApiTags('Admin - Families')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @ApiOperation({
    summary: 'יצירת משפחה',
    description: 'יצירת רשומת משפחה חדשה בעמותה',
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
    summary: 'רשימת משפחות',
    description: 'קבלת רשימה ממוספרת של משפחות בעמותה',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'groupId', required: false, type: String, description: 'סינון לפי קבוצה' })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('groupId') groupId?: string,
  ): Promise<{ data: FamilyResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.familiesService.findAll(user.organizationId, page, limit, groupId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'פרטי משפחה',
    description: 'קבלת פרטי משפחה לפי מזהה, מוגבל לעמותה',
  })
  @ApiParam({ name: 'id', description: 'מזהה המשפחה' })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.findOne(user.organizationId, id);
    return { data: family };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'עדכון משפחה',
    description: 'עדכון פרטי משפחה בעמותה',
  })
  @ApiParam({ name: 'id', description: 'מזהה המשפחה' })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.update(user.organizationId, id, updateFamilyDto);
    return { data: family };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'מחיקת משפחה',
    description: 'מחיקה רכה של רשומת משפחה (deletedAt)',
  })
  @ApiParam({ name: 'id', description: 'מזהה המשפחה' })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string): Promise<void> {
    await this.familiesService.remove(user.organizationId, id);
  }

  @Post(':id/assign-group')
  @ApiOperation({
    summary: 'שיוך משפחה לקבוצה',
    description: 'שיוך משפחה לקבוצת חלוקה',
  })
  @ApiParam({ name: 'id', description: 'מזהה המשפחה' })
  async assignGroup(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() assignGroupDto: AssignGroupDto,
  ): Promise<{ data: FamilyResponseDto }> {
    const family = await this.familiesService.linkToGroup(
      user.organizationId,
      id,
      assignGroupDto.groupId,
    );
    return { data: family };
  }
}
