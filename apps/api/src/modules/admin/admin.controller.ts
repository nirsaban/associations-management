import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get full admin dashboard',
    description: 'קבלת כל נתוני דשבורד הניהול - סטטיסטיקות, הכנסות, קבוצות, סטטוס שבועי',
  })
  async getDashboard(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Record<string, unknown> }> {
    const [stats, revenueByMonth, weeklyStatusResult, groups] = await Promise.all([
      this.adminService.getDashboardStats(user.organizationId),
      this.adminService.getRevenueByMonth(user.organizationId, 2),
      this.adminService.getWeeklyStatus(user.organizationId),
      this.adminService.getGroupsOverview(user.organizationId),
    ]);

    const months = revenueByMonth.data;
    const thisMonth = months.length > 0 ? months[months.length - 1].revenue : 0;
    const lastMonth = months.length > 1 ? months[months.length - 2].revenue : 0;
    const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    const weeklyData = weeklyStatusResult.data;
    const groupsWithDistributor = weeklyData.filter((g) => g.hasDistributor).length;
    const completedOrders = weeklyData.reduce((sum, g) => sum + g.completedOrders, 0);
    const totalOrders = weeklyData.reduce((sum, g) => sum + g.completedOrders + g.pendingOrders, 0);

    return {
      data: {
        stats: {
          totalUsers: stats.totalUsers,
          totalGroups: stats.totalGroups,
          totalFamilies: stats.totalFamilies,
          unpaidUsersThisMonth: stats.unpaidUsersThisMonth,
        },
        revenue: { thisMonth, lastMonth, trend },
        weeklyStatus: {
          groupsWithDistributor,
          totalGroups: stats.totalGroups,
          completedOrders,
          totalOrders,
        },
        groupsOverview: groups,
      },
    };
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Get admin payments list',
    description: 'קבלת רשימת כל התשלומים בעמותה',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPayments(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: { payments: Record<string, unknown>[]; total: number; page: number; pageSize: number } }> {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    const result = await this.adminService.getPaymentsList(user.organizationId, safePage, safeLimit);
    return { data: result };
  }

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'קבלת סטטיסטיקות למערכת - משתמשים, קבוצות, משפחות, הכנסות',
  })
  async getDashboardStats(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: AdminStatsDto }> {
    const stats = await this.adminService.getDashboardStats(user.organizationId);
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
    const result = await this.adminService.getMonthlyRevenue(user.organizationId);
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
    return this.adminService.getRevenueByMonth(user.organizationId, months ?? 12);
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
    return this.adminService.getUnpaidUsers(user.organizationId, monthKey);
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
    return this.adminService.getWeeklyStatus(user.organizationId, weekKey);
  }

  @Get('orders')
  @ApiOperation({
    summary: 'Get weekly orders grouped by group',
    description: 'קבלת הזמנות שבועיות מקובצות לפי קבוצה לשבוע נבחר',
  })
  @ApiQuery({ name: 'weekKey', required: false, type: String, description: 'מפתח שבוע בפורמט YYYY-Wxx, למשל 2026-W17. אם לא סופק, ישתמש בשבוע הנוכחי.' })
  async getWeeklyOrders(
    @CurrentUser() user: ICurrentUser,
    @Query('weekKey') weekKey?: string,
  ): Promise<{
    data: {
      weekKey: string;
      groups: Array<{
        groupId: string;
        groupName: string;
        families: Array<{
          familyId: string;
          familyName: string;
          contactName: string | null;
          address: string | null;
          items: unknown;
          status: string;
          notes: string | null;
        }>;
      }>;
    };
  }> {
    return this.adminService.getWeeklyOrders(user.organizationId, weekKey);
  }
}
