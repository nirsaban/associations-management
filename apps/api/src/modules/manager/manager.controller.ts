import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { ManagerService } from './manager.service';
import { GroupDetailsDto, MemberWithStatusDto, WeeklyTaskStatusDto } from './dto';
import { CreateWeeklyOrderDto } from '@modules/weekly-orders/dto/create-weekly-order.dto';
import { UpdateWeeklyOrderDto } from '@modules/weekly-orders/dto/update-weekly-order.dto';
import { AssignDistributorDto } from '@modules/weekly-distributors/dto/assign-distributor.dto';

@ApiTags('Manager')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('group')
  @ApiOperation({
    summary: 'Get managed group',
    description: 'קבלת פרטי הקבוצה המנוהלת על ידי המנהל',
  })
  async getManagedGroup(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: GroupDetailsDto }> {
    const group = await this.managerService.getManagedGroup(user.id, user.organizationId);
    return { data: group };
  }

  @Get('group/members')
  @ApiOperation({
    summary: 'Get group members',
    description: 'קבלת רשימת חברי הקבוצה עם סטטוס תשלום (שולם/לא שולם בלבד, ללא סכומים)',
  })
  async getGroupMembers(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: MemberWithStatusDto[] }> {
    return this.managerService.getGroupMembers(user.id, user.organizationId);
  }

  @Get('group/families')
  @ApiOperation({
    summary: 'Get group families',
    description: 'קבלת רשימת משפחות בקבוצה',
  })
  async getGroupFamilies(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Array<Record<string, unknown>> }> {
    return this.managerService.getGroupFamilies(user.id, user.organizationId);
  }

  @Get('group/weekly-tasks')
  @ApiOperation({
    summary: 'Get weekly tasks',
    description: 'קבלת סטטוס הזמנות שבועיות לכל משפחה',
  })
  async getWeeklyTasks(
    @CurrentUser() user: ICurrentUser,
    @Query('weekKey') weekKey?: string,
  ): Promise<{ data: WeeklyTaskStatusDto[] }> {
    return this.managerService.getWeeklyTasks(user.id, user.organizationId, weekKey);
  }

  @Post('group/families/:familyId/weekly-order')
  @ApiOperation({
    summary: 'Create weekly order',
    description: 'יצירת הזמנה שבועית למשפחה',
  })
  async createWeeklyOrder(
    @CurrentUser() user: ICurrentUser,
    @Param('familyId') familyId: string,
    @Body() dto: CreateWeeklyOrderDto,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.createWeeklyOrder(
      user.id,
      user.organizationId,
      familyId,
      dto.weekKey,
      dto.items,
      dto.notes,
    );
  }

  @Patch('group/weekly-orders/:orderId')
  @ApiOperation({
    summary: 'Update weekly order',
    description: 'עדכון הזמנה שבועית',
  })
  async updateWeeklyOrder(
    @CurrentUser() user: ICurrentUser,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateWeeklyOrderDto,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.updateWeeklyOrder(
      user.id,
      user.organizationId,
      orderId,
      dto.items,
      dto.notes,
      dto.status,
    );
  }

  @Post('group/weekly-distributor')
  @ApiOperation({
    summary: 'Assign weekly distributor',
    description: 'הקצאת מחלק שבועי לקבוצה',
  })
  async assignWeeklyDistributor(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: AssignDistributorDto,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.assignWeeklyDistributor(
      user.id,
      user.organizationId,
      dto.userId,
      dto.weekKey ?? this.getCurrentWeekKey(),
    );
  }

  private getCurrentWeekKey(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
}
