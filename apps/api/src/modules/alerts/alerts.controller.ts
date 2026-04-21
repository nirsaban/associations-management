import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { Alert } from '@prisma/client';

@ApiTags('Alerts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // --------------------------------------------------------------------------
  // Admin endpoints
  // --------------------------------------------------------------------------

  @Post('admin/alerts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create alert',
    description: 'פרסום התראה חדשה לקהל יעד — שולח push notifications לכל המנויים הרלוונטיים',
  })
  async createAlert(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateAlertDto,
  ): Promise<{ data: Alert }> {
    const alert = await this.alertsService.createAlert(
      user.organizationId,
      user.id || user.sub,
      dto,
    );
    return { data: alert };
  }

  @Get('admin/alerts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'List all alerts (admin)',
    description: 'קבלת רשימת כל ההתראות שפורסמו בעמותה עם פאגינציה',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'מספר עמוד (ברירת מחדל: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'מספר תוצאות בעמוד (ברירת מחדל: 20)' })
  async getAdminAlerts(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: Alert[]; meta: { total: number; page: number; limit: number } }> {
    const result = await this.alertsService.getAdminAlerts(
      user.organizationId,
      page ?? 1,
      limit ?? 20,
    );
    return result;
  }

  @Delete('admin/alerts/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete alert',
    description: 'מחיקת התראה לצמיתות',
  })
  @ApiParam({ name: 'id', description: 'מזהה ההתראה' })
  async deleteAlert(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.alertsService.deleteAlert(user.organizationId, id);
  }

  // --------------------------------------------------------------------------
  // User-facing endpoints
  // --------------------------------------------------------------------------

  @Get('me/alerts')
  @ApiOperation({
    summary: 'Get my alerts',
    description: 'קבלת התראות רלוונטיות למשתמש המחובר (לפי תפקידו ותוקף ההתראה)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'מספר מקסימלי של תוצאות (ברירת מחדל: 10)' })
  async getUserAlerts(
    @CurrentUser() user: ICurrentUser,
    @Query('limit') limit?: number,
  ): Promise<{ data: Alert[] }> {
    const alerts = await this.alertsService.getUserAlerts(
      user.organizationId,
      user.id,
      limit ?? 10,
    );
    return { data: alerts };
  }
}
