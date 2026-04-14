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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get('status/:monthKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Check payment status',
    description: 'Check if user has paid for a specific month',
  })
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
    summary: 'Get payment history',
    description: 'Get payment history for the current user',
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
  @Roles('admin', 'manager')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get unpaid users',
    description: 'Get list of users who have not paid for a specific month',
  })
  async getUnpaidUsers(
    @CurrentUser() user: ICurrentUser,
    @Param('monthKey') monthKey: string,
  ): Promise<{ data: Record<string, unknown>[] }> {
    const unpaidUsers = await this.paymentsService.getUnpaidUsers(user.organizationId, monthKey);
    return { data: unpaidUsers };
  }
}
