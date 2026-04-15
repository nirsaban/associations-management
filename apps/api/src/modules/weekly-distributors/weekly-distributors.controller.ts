import {
  Controller,
  Get,
  Post,
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
import { WeeklyDistributorsService } from './weekly-distributors.service';
import { AssignDistributorDto } from './dto/assign-distributor.dto';
import { DistributorResponseDto } from './dto/distributor-response.dto';

@ApiTags('Weekly Distributors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('weekly-distributors')
export class WeeklyDistributorsController {
  constructor(private readonly weeklyDistributorsService: WeeklyDistributorsService) {}

  @Post(':groupId')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Assign distributor to group',
    description: 'Assign a member as distributor for a group for a specific week',
  })
  async assignDistributor(
    @CurrentUser() user: ICurrentUser,
    @Param('groupId') groupId: string,
    @Body() assignDistributorDto: AssignDistributorDto,
  ): Promise<{ data: DistributorResponseDto }> {
    const distributor = await this.weeklyDistributorsService.assignDistributor(
      user.organizationId!,
      groupId,
      assignDistributorDto,
    );
    return { data: distributor };
  }

  @Get('current/:groupId')
  @ApiOperation({
    summary: 'Get current distributor',
    description: 'Get the current distributor for a group',
  })
  async getCurrentDistributor(
    @CurrentUser() user: ICurrentUser,
    @Param('groupId') groupId: string,
    @Query('week') week?: string,
  ): Promise<{ data: DistributorResponseDto | null }> {
    const distributor = await this.weeklyDistributorsService.getCurrentDistributor(
      user.organizationId!,
      groupId,
      week,
    );
    return { data: distributor };
  }

  @Get()
  @ApiOperation({
    summary: 'List distributors for week',
    description: 'List all distributor assignments for a specific week',
  })
  async getDistributorsForWeek(
    @CurrentUser() user: ICurrentUser,
    @Query('week') week: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<object> {
    return this.weeklyDistributorsService.getDistributorsForWeek(
      user.organizationId!,
      week,
      page,
      limit,
    );
  }

  @Delete(':groupId/:weekKey')
  @Roles('admin', 'manager')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove distributor',
    description: 'Remove distributor assignment for a group and week',
  })
  async removeDistributor(
    @CurrentUser() user: ICurrentUser,
    @Param('groupId') groupId: string,
    @Param('weekKey') weekKey: string,
  ): Promise<void> {
    await this.weeklyDistributorsService.removeDistributor(user.organizationId!, groupId, weekKey);
  }
}
