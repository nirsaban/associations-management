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
import { WeeklyOrdersService } from './weekly-orders.service';
import { CreateWeeklyOrderDto } from './dto/create-weekly-order.dto';
import { UpdateWeeklyOrderDto } from './dto/update-weekly-order.dto';
import { WeeklyOrderResponseDto } from './dto/weekly-order-response.dto';

@ApiTags('Weekly Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('weekly-orders')
export class WeeklyOrdersController {
  constructor(private readonly weeklyOrdersService: WeeklyOrdersService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Create weekly order',
    description: 'Create a new weekly order for a family',
  })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() createWeeklyOrderDto: CreateWeeklyOrderDto,
  ): Promise<{ data: WeeklyOrderResponseDto }> {
    const order = await this.weeklyOrdersService.create(
      user.organizationId,
      createWeeklyOrderDto,
    );
    return { data: order };
  }

  @Get()
  @ApiOperation({
    summary: 'List weekly orders',
    description: 'List weekly orders, optionally filtered by week',
  })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('week') week?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<object> {
    return this.weeklyOrdersService.findAll(user.organizationId, week, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get weekly order',
    description: 'Get a specific weekly order',
  })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: WeeklyOrderResponseDto }> {
    const order = await this.weeklyOrdersService.findOne(user.organizationId, id);
    return { data: order };
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Update weekly order',
    description: 'Update a weekly order',
  })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateWeeklyOrderDto: UpdateWeeklyOrderDto,
  ): Promise<{ data: WeeklyOrderResponseDto }> {
    const order = await this.weeklyOrdersService.update(
      user.organizationId,
      id,
      updateWeeklyOrderDto,
    );
    return { data: order };
  }

  @Post(':id/complete')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Mark order as completed',
    description: 'Mark a weekly order as completed',
  })
  async markCompleted(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: WeeklyOrderResponseDto }> {
    const order = await this.weeklyOrdersService.markCompleted(user.organizationId, id);
    return { data: order };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete weekly order',
    description: 'Soft delete a weekly order',
  })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string): Promise<void> {
    await this.weeklyOrdersService.remove(user.organizationId, id);
  }
}
