import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Payment webhook',
    description: 'Webhook endpoint for payment processor (no auth required)',
  })
  async handleWebhook(
    @Body() paymentWebhookDto: PaymentWebhookDto,
  ): Promise<{ data: PaymentResponseDto }> {
    const payment = await this.paymentsService.handleWebhook(paymentWebhookDto);
    return { data: payment };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'היסטוריית תשלומים שלי',
    description: 'קבלת היסטוריית תשלומים של המשתמש המחובר, ממוספרת לפי חודש בסדר יורד',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyPayments(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: PaymentResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.paymentsService.getPaymentHistory(user.organizationId, user.id, page, limit);
  }

  @Get('me/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'סטטוס תשלום חודש נוכחי',
    description: 'בדיקה האם המשתמש שילם החודש הנוכחי',
  })
  async getMyCurrentStatus(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: { isPaid: boolean; monthKey: string; paidAt?: Date } }> {
    const result = await this.paymentsService.getCurrentMonthStatus(user.organizationId, user.id);
    return { data: result };
  }

  @Get('status/:monthKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'סטטוס תשלום לחודש',
    description: 'בדיקה האם המשתמש שילם לחודש מסוים',
  })
  @ApiParam({ name: 'monthKey', description: 'מפתח חודש בפורמט YYYY-MM' })
  async getPaymentStatus(
    @CurrentUser() user: ICurrentUser,
    @Param('monthKey') monthKey: string,
  ): Promise<object> {
    return this.paymentsService.getPaymentStatus(user.organizationId, user.id, monthKey);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'היסטוריית תשלומים',
    description: 'קבלת היסטוריית תשלומים של המשתמש המחובר',
  })
  async getPaymentHistory(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<object> {
    return this.paymentsService.getPaymentHistory(user.organizationId, user.id, page, limit);
  }

  @Get('unpaid/:monthKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'משתמשים שלא שילמו',
    description: 'קבלת רשימת משתמשים שלא שילמו לחודש מסוים — מנהל בלבד',
  })
  @ApiParam({ name: 'monthKey', description: 'מפתח חודש בפורמט YYYY-MM' })
  async getUnpaidUsers(
    @CurrentUser() user: ICurrentUser,
    @Param('monthKey') monthKey: string,
  ): Promise<{ data: Record<string, unknown>[] }> {
    const unpaidUsers = await this.paymentsService.getUnpaidUsers(user.organizationId, monthKey);
    return { data: unpaidUsers };
  }
}
