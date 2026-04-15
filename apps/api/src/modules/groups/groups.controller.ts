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
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { GroupResponseDto } from './dto/group-response.dto';

@ApiTags('Admin - Groups')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({
    summary: 'יצירת קבוצה',
    description: 'יצירת קבוצת חלוקה חדשה בעמותה',
  })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.create(user.organizationId, createGroupDto);
    return { data: group };
  }

  @Get()
  @ApiOperation({
    summary: 'רשימת קבוצות',
    description: 'קבלת כל הקבוצות בעמותה כולל מספר חברים ומשפחות',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: GroupResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.groupsService.findAll(user.organizationId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'פרטי קבוצה',
    description: 'קבלת פרטי קבוצה כולל חברים',
  })
  @ApiParam({ name: 'id', description: 'מזהה הקבוצה' })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.findOne(user.organizationId, id);
    return { data: group };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'עדכון קבוצה',
    description: 'עדכון שם קבוצה או מנהל',
  })
  @ApiParam({ name: 'id', description: 'מזהה הקבוצה' })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.update(user.organizationId, id, updateGroupDto);
    return { data: group };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'מחיקת קבוצה',
    description: 'מחיקה רכה של קבוצה (deletedAt)',
  })
  @ApiParam({ name: 'id', description: 'מזהה הקבוצה' })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string): Promise<void> {
    await this.groupsService.remove(user.organizationId, id);
  }

  @Post(':id/assign-manager')
  @ApiOperation({
    summary: 'הקצאת מנהל לקבוצה',
    description: 'הקצאת משתמש כמנהל הקבוצה — חייב להיות חבר בעמותה',
  })
  @ApiParam({ name: 'id', description: 'מזהה הקבוצה' })
  async assignManager(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() assignManagerDto: AssignManagerDto,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.assignManager(
      user.organizationId,
      id,
      assignManagerDto,
    );
    return { data: group };
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'הוספת חבר לקבוצה',
    description: 'הוספת משתמש כחבר בקבוצה',
  })
  @ApiParam({ name: 'id', description: 'מזהה הקבוצה' })
  async addMember(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<{ data: { message: string } }> {
    const result = await this.groupsService.addMember(
      user.organizationId,
      id,
      addMemberDto.userId,
    );
    return { data: result };
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'הסרת חבר מקבוצה',
    description: 'הסרת משתמש מהקבוצה (מסמן כ-INACTIVE)',
  })
  @ApiParam({ name: 'id', description: 'מזהה הקבוצה' })
  @ApiParam({ name: 'userId', description: 'מזהה המשתמש' })
  async removeMember(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.groupsService.removeMember(user.organizationId, id, userId);
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'חברי קבוצה',
    description: 'קבלת רשימת חברים בקבוצה',
  })
  @ApiParam({ name: 'id', description: 'מזהה הקבוצה' })
  async getMembers(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: Record<string, unknown>[] }> {
    return this.groupsService.getMembers(user.organizationId, id);
  }
}
