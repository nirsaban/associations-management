import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { ManagerService } from './manager.service';
import {
  GroupDetailsDto,
  MemberWithStatusDto,
  WeeklyTaskStatusDto,
  UpdateFamilyDto,
  UpsertWeeklyOrderDto,
} from './dto';
import { ManagerCreateWeeklyOrderDto } from '@modules/weekly-orders/dto/create-weekly-order.dto';
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
  @ApiQuery({ name: 'weekKey', required: false, description: 'מפתח שבוע בפורמט YYYY-WNN' })
  async getWeeklyTasks(
    @CurrentUser() user: ICurrentUser,
    @Query('weekKey') weekKey?: string,
  ): Promise<{ data: WeeklyTaskStatusDto[] }> {
    return this.managerService.getWeeklyTasks(user.id, user.organizationId, weekKey);
  }

  @Get('group/weekly-status')
  @ApiOperation({
    summary: 'Get weekly operational status',
    description: 'קבלת סטטוס תפעולי שבועי כולל משפחות, הזמנות ומחלק שבועי',
  })
  @ApiQuery({ name: 'weekKey', required: false, description: 'מפתח שבוע בפורמט YYYY-WNN' })
  async getWeeklyStatus(
    @CurrentUser() user: ICurrentUser,
    @Query('weekKey') weekKey?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getWeeklyStatus(user.id, user.organizationId, weekKey);
  }

  @Get('group/members-and-payment-status')
  @ApiOperation({
    summary: 'Get members with full payment info',
    description: 'קבלת רשימת חברי הקבוצה עם סטטוס תשלום מלא לחודש הנוכחי',
  })
  async getMembersWithPaymentStatus(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Array<Record<string, unknown>> }> {
    return this.managerService.getMembersWithPaymentStatus(user.id, user.organizationId);
  }

  @Get('group/distributor-workload')
  @ApiOperation({
    summary: 'Get distributor workload stats',
    description: 'קבלת נתוני עומס חלוקה לפי חבר קבוצה ב-52 השבועות האחרונים',
  })
  async getDistributorWorkload(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getDistributorWorkload(user.id, user.organizationId);
  }

  @Get('group/revenue')
  @ApiOperation({
    summary: 'Get group revenue',
    description: 'קבלת סיכום הכנסות קבוצה לחודש הנוכחי ולשנה הנוכחית',
  })
  async getGroupRevenue(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getGroupRevenue(user.id, user.organizationId);
  }

  @Get('group/families/:familyId/weekly-order')
  @ApiOperation({
    summary: 'Get family weekly order',
    description: 'קבלת הזמנה שבועית למשפחה ספציפית בשבוע נתון',
  })
  @ApiQuery({ name: 'weekKey', required: false, description: 'מפתח שבוע בפורמט YYYY-WNN' })
  async getFamilyWeeklyOrder(
    @CurrentUser() user: ICurrentUser,
    @Param('familyId') familyId: string,
    @Query('weekKey') weekKey?: string,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getFamilyWeeklyOrder(
      user.id,
      user.organizationId,
      familyId,
      weekKey,
    );
  }

  @Post('group/families/:familyId/weekly-order')
  @ApiOperation({
    summary: 'Create weekly order',
    description: 'יצירת הזמנה שבועית למשפחה',
  })
  async createWeeklyOrder(
    @CurrentUser() user: ICurrentUser,
    @Param('familyId') familyId: string,
    @Body() dto: ManagerCreateWeeklyOrderDto,
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

  @Put('group/families/:familyId/weekly-order')
  @ApiOperation({
    summary: 'Upsert weekly order',
    description: 'יצירה או עדכון הזמנה שבועית למשפחה (upsert)',
  })
  async upsertFamilyWeeklyOrder(
    @CurrentUser() user: ICurrentUser,
    @Param('familyId') familyId: string,
    @Body() dto: UpsertWeeklyOrderDto,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.upsertFamilyWeeklyOrder(
      user.id,
      user.organizationId,
      familyId,
      dto.content,
      dto.weekKey,
    );
  }

  @Patch('group/families/:familyId')
  @ApiOperation({
    summary: 'Update family metadata',
    description: 'עדכון פרטי משפחה (טלפון, כתובת, מספר ילדים, סך חברים, הערות)',
  })
  async updateFamily(
    @CurrentUser() user: ICurrentUser,
    @Param('familyId') familyId: string,
    @Body() dto: UpdateFamilyDto,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.updateFamily(user.id, user.organizationId, familyId, dto);
  }

  @Get('donation-info')
  @ApiOperation({
    summary: 'Get donation info',
    description: 'קבלת מידע תרומה של העמותה (קישור תשלום, תיאור, לוגו)',
  })
  async getDonationInfo(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getDonationInfo(user.organizationId);
  }

  @Get('my-payments')
  @ApiOperation({
    summary: 'Get my payments with current month status',
    description: 'קבלת היסטוריית תשלומים אישית כולל סטטוס חודש נוכחי',
  })
  async getMyPaymentsWithStatus(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getMyPaymentsWithStatus(user.organizationId, user.id);
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
      dto.weekKey ?? this.managerService.getCurrentWeekKey(),
    );
  }
}
