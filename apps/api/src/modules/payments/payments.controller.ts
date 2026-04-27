import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ReferralsService } from '@modules/referrals/referrals.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly referralsService: ReferralsService,
  ) {}

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

  @Post('grow-webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Grow payment webhook',
    description: 'Webhook endpoint for Grow payment processor. Parses raw Grow payload, attributes referrals via cField3.',
  })
  async handleGrowWebhook(@Body() payload: Record<string, unknown>) {
    this.logger.log(`Received Grow webhook: ${JSON.stringify(payload).slice(0, 500)}`);

    // Grow sends data either at root level or nested under "data"
    const data = (payload.data as Record<string, unknown>) || payload;

    const transactionId =
      (data.transactionCode as string) ||
      (data.transactionId as string) ||
      (data.processId as string);
    const amount = Number(data.paymentSum ?? data.sum ?? 0);
    const payerPhone = (data.payerPhone as string) || '';
    const fullName = (data.fullName as string) || '';
    const organizationId = (data.cField1 as string) || (payload.cField1 as string) || '';
    const referralCode = (data.cField3 as string) || (payload.cField3 as string) || '';
    const statusCode = (data.statusCode as string) || '';

    if (!transactionId) {
      this.logger.warn('Grow webhook missing transactionId');
      return { status: 'ignored', reason: 'missing transactionId' };
    }

    // Resolve organizationId — try multiple strategies
    let resolvedOrgId = organizationId;

    // Strategy 1: cField1 (from Grow Wallet SDK payments)
    // Already set above

    // Strategy 2: Find org by payer phone (legacy webhooks don't have cFields)
    if (!resolvedOrgId && payerPhone) {
      const normalizedPhone = payerPhone.replace(/\D/g, '');
      const userWithOrg = await this.paymentsService.findUserByPhoneAnyOrg(normalizedPhone);
      if (userWithOrg) {
        resolvedOrgId = userWithOrg.organizationId;
        this.logger.log(`Resolved org by payerPhone ${payerPhone} → ${resolvedOrgId}`);
      }
    }

    // Strategy 3: Match from GrowPaymentProcess table
    if (!resolvedOrgId && amount) {
      const process = await this.paymentsService.findGrowProcessByAmount(amount);
      if (process) {
        resolvedOrgId = process.organizationId;
        this.logger.log(`Resolved org from GrowPaymentProcess: ${resolvedOrgId}`);
      }
    }

    // Strategy 4: If only one org exists, use it (small deployments)
    if (!resolvedOrgId) {
      const singleOrg = await this.paymentsService.getSingleOrganization();
      if (singleOrg) {
        resolvedOrgId = singleOrg.id;
        this.logger.log(`Resolved org as single org: ${resolvedOrgId}`);
      }
    }

    if (!resolvedOrgId) {
      this.logger.warn('Grow webhook: could not resolve organizationId');
      return { status: 'ignored', reason: 'missing organizationId' };
    }

    // Determine status: Grow statusCode "2" = paid, legacy webhooks have no statusCode (= paid)
    const status = (statusCode === '2' || !statusCode) ? 'COMPLETED' : 'PENDING';
    const monthKey = this.getCurrentMonthKey();

    // Look up referral — try cField3 first, then match via GrowPaymentProcess table
    let referralId: string | undefined;
    let resolvedReferralCode = referralCode;

    // If no cField3 in webhook, try to match by amount + org from our saved process records
    if (!resolvedReferralCode) {
      const processToken = (data.processToken as string) || (data.paymentLinkProcessToken as string) || '';
      const processId = (data.processId as string) || (data.paymentLinkProcessId as string) || '';

      if (processToken || processId || amount) {
        const recentProcess = await this.paymentsService.findGrowProcess(
          resolvedOrgId,
          amount,
        );
        if (recentProcess?.referralCode) {
          resolvedReferralCode = recentProcess.referralCode;
          this.logger.log(`Matched referral via GrowPaymentProcess: ${resolvedReferralCode}`);
        }
      }
    }

    if (resolvedReferralCode) {
      const referral = await this.referralsService.findReferralByCode(
        resolvedOrgId,
        resolvedReferralCode,
      );
      if (referral) {
        referralId = referral.id;
        this.logger.log(`Grow webhook matched referral ${resolvedReferralCode} → ${referral.userId}`);
      }
    }

    // Try to find user by phone in the organization
    let userId: string | undefined;
    if (payerPhone) {
      const normalizedPhone = payerPhone.replace(/\D/g, '');
      const user = await this.paymentsService.findUserByPhone(
        resolvedOrgId,
        normalizedPhone,
      );
      if (user) userId = user.id;
    }

    // Create payment record via service
    const payment = await this.paymentsService.handleGrowWebhook({
      transactionId,
      organizationId: resolvedOrgId,
      userId,
      amount,
      monthKey,
      status,
      referralId,
      payerPhone,
      payerName: fullName,
      rawPayload: payload,
    });

    return { status: 'ok', paymentId: payment.id };
  }

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
