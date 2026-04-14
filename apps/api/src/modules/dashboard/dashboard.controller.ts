import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard',
    description: 'Get role-specific dashboard data',
  })
  async getDashboard(@CurrentUser() user: ICurrentUser): Promise<{ data: object }> {
    const dashboard = await this.dashboardService.getDashboard(
      user.organizationId,
      user.id,
      user.systemRole,
    );
    return { data: dashboard };
  }
}
