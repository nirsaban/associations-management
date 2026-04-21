import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { ManagerService } from './manager.service';
import { MarkDeliveryDto } from './dto';

@ApiTags('User Experience')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class UserExperienceController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('me/weekly-distribution')
  @ApiOperation({
    summary: 'Get my weekly distribution context',
    description:
      'קבלת הקשר חלוקה שבועית למשתמש המחובר — האם הוא המחלק השבוע, ורשימת המשפחות לחלוקה',
  })
  async getMyWeeklyDistribution(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getMyWeeklyDistribution(user.id, user.organizationId);
  }

  @Put('me/weekly-distribution/families/:familyId')
  @ApiOperation({
    summary: 'Mark family delivery status',
    description: 'עדכון סטטוס מסירה למשפחה על ידי המחלק השבועי',
  })
  async markFamilyDelivery(
    @CurrentUser() user: ICurrentUser,
    @Param('familyId') familyId: string,
    @Body() dto: MarkDeliveryDto,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.markFamilyDelivery(
      user.id,
      user.organizationId,
      familyId,
      dto.delivered,
    );
  }

  @Get('me/group-view')
  @ApiOperation({
    summary: 'Get group snapshot for group member',
    description:
      'קבלת תצוגת קבוצה לחבר רגיל — שמות חברים, סטטוס תשלום חודשי, מחלק שבועי ורשימת משפחות',
  })
  async getMyGroupView(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: Record<string, unknown> }> {
    return this.managerService.getMyGroupView(user.id, user.organizationId);
  }
}
