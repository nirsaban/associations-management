import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import {
  AdminStatsDto,
  RevenueByMonthDto,
  UnpaidUserDto,
  GroupWeeklyStatusDto,
} from './dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'קבלת סטטיסטיקות למערכת - משתמשים, קבוצות, משפחות, הכנסות',
  })
  async getDashboardStats(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: AdminStatsDto }> {
    const stats = await this.adminService.getDashboardStats(user.organizationId!);
    return { data: stats };
  }

  @Get('revenue/monthly')
  @ApiOperation({
    summary: 'Get current month revenue',
    description: 'קבלת הכנסות חודש נוכחי',
  })
  async getMonthlyRevenue(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: { revenue: number } }> {
    const result = await this.adminService.getMonthlyRevenue(user.organizationId!);
    return { data: result };
  }

  @Get('revenue/by-month')
  @ApiOperation({
    summary: 'Get revenue by month',
    description: 'קבלת הכנסות לפי חודש עבור 12 חודשים אחרונים',
  })
  async getRevenueByMonth(
    @CurrentUser() user: ICurrentUser,
    @Query('months') months?: number,
  ): Promise<{ data: RevenueByMonthDto[] }> {
    return this.adminService.getRevenueByMonth(user.organizationId!, months ?? 12);
  }

  @Get('unpaid-users')
  @ApiOperation({
    summary: 'Get unpaid users',
    description: 'קבלת רשימת משתמשים שלא שילמו לחודש מסוים',
  })
  async getUnpaidUsers(
    @CurrentUser() user: ICurrentUser,
    @Query('monthKey') monthKey?: string,
  ): Promise<{ data: UnpaidUserDto[] }> {
    return this.adminService.getUnpaidUsers(user.organizationId!, monthKey);
  }

  @Get('weekly-status')
  @ApiOperation({
    summary: 'Get weekly status overview',
    description: 'קבלת מבט על של סטטוס שבועי לכל הקבוצות',
  })
  async getWeeklyStatus(
    @CurrentUser() user: ICurrentUser,
    @Query('weekKey') weekKey?: string,
  ): Promise<{ data: GroupWeeklyStatusDto[] }> {
    return this.adminService.getWeeklyStatus(user.organizationId!, weekKey);
  }
}
