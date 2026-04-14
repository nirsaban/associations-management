import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create notification',
    description: 'Create a new notification for the current user',
  })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Query('userId') targetUserId: string,
  ): Promise<object> {
    // Only allow users to create notifications for themselves, except admins
    if (user.systemRole !== 'ADMIN' && user.id !== targetUserId) {
      throw new Error('Unauthorized');
    }
    return { message: 'Use POST body instead' };
  }

  @Get()
  @ApiOperation({
    summary: 'List notifications',
    description: 'List all notifications for the current user',
  })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<object> {
    return this.notificationsService.findAll(user.organizationId, user.id, page, limit);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark as read',
    description: 'Mark a notification as read',
  })
  async markAsRead(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: NotificationResponseDto }> {
    const notification = await this.notificationsService.markAsRead(user.organizationId, user.id, id);
    return { data: notification };
  }

  @Post('mark-all-read')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Mark all as read',
    description: 'Mark all notifications as read for the current user',
  })
  async markAllAsRead(@CurrentUser() user: ICurrentUser): Promise<{ updated: number }> {
    return this.notificationsService.markAllAsRead(user.organizationId, user.id);
  }

  @Get('unread/count')
  @ApiOperation({
    summary: 'Get unread count',
    description: 'Get count of unread notifications',
  })
  async getUnreadCount(@CurrentUser() user: ICurrentUser): Promise<{ count: number }> {
    return this.notificationsService.getUnreadCount(user.organizationId, user.id);
  }
}
