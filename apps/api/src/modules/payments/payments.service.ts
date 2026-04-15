import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(paymentWebhookDto: PaymentWebhookDto): Promise<PaymentResponseDto> {
    this.logger.log(`Processing payment webhook for transaction ${paymentWebhookDto.transactionId}`);

    // Check if payment already exists (idempotency)
    const existingPayment = await this.prisma.payment.findFirst({
      where: { externalTransactionId: paymentWebhookDto.transactionId },
    });

    if (existingPayment) {
      this.logger.warn(
        `Payment already processed for transaction ${paymentWebhookDto.transactionId}`,
      );
      return this.mapToDto(existingPayment);
    }

    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: paymentWebhookDto.organizationId },
    });

    if (!organization) {
      throw new BadRequestException('עמותה לא נמצאה');
    }

    // Verify user exists and belongs to organization
    const user = await this.prisma.user.findUnique({
      where: { id: paymentWebhookDto.userId },
    });

    if (!user || user.organizationId !== paymentWebhookDto.organizationId) {
      throw new BadRequestException('משתמש לא נמצא או אינו שייך לעמותה');
    }

    const status = paymentWebhookDto.status ?? 'PENDING';
    const paymentDate = status === 'COMPLETED' ? new Date() : null;

    const payment = await this.prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          organizationId: paymentWebhookDto.organizationId,
          userId: paymentWebhookDto.userId,
          amount: paymentWebhookDto.amount,
          monthKey: paymentWebhookDto.monthKey,
          externalTransactionId: paymentWebhookDto.transactionId,
          status: status as PaymentStatus,
          source: paymentWebhookDto.method,
          rawWebhookPayload: (paymentWebhookDto.webhookPayload ?? undefined) as Prisma.InputJsonValue | undefined,
          paymentDate,
        },
      });

      if (status === 'COMPLETED') {
        await tx.monthlyPaymentStatus.upsert({
          where: {
            userId_monthKey: {
              userId: paymentWebhookDto.userId,
              monthKey: paymentWebhookDto.monthKey,
            },
          },
          update: {
            isPaid: true,
            paidAt: new Date(),
            paymentId: newPayment.id,
          },
          create: {
            organizationId: paymentWebhookDto.organizationId,
            userId: paymentWebhookDto.userId,
            monthKey: paymentWebhookDto.monthKey,
            isPaid: true,
            paidAt: new Date(),
            paymentId: newPayment.id,
          },
        });
      }

      return newPayment;
    });

    if (status === 'COMPLETED') {
      this.logger.log(
        `User ${paymentWebhookDto.userId} payment completed for ${paymentWebhookDto.monthKey}`,
      );
    }

    return this.mapToDto(payment);
  }

  async getCurrentMonthStatus(
    organizationId: string,
    userId: string,
  ): Promise<{ isPaid: boolean; monthKey: string; paidAt?: Date }> {
    const monthKey = this.getCurrentMonthKey();
    this.logger.log(`Getting current month status for user ${userId}, month ${monthKey}`);

    // Enforce org scope
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });

    if (!user) {
      return { isPaid: false, monthKey };
    }

    const monthlyStatus = await this.prisma.monthlyPaymentStatus.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
    });

    return {
      isPaid: monthlyStatus?.isPaid ?? false,
      monthKey,
      paidAt: monthlyStatus?.paidAt ?? undefined,
    };
  }

  async getPaymentStatus(
    organizationId: string,
    userId: string,
    monthKey: string,
  ): Promise<{ paid: boolean; payment?: PaymentResponseDto }> {
    this.logger.log(`Checking payment status for user ${userId}, month ${monthKey}`);

    // Org scope verification
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });

    if (!user) {
      return { paid: false };
    }

    const monthlyStatus = await this.prisma.monthlyPaymentStatus.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
    });

    if (!monthlyStatus || !monthlyStatus.isPaid) {
      return { paid: false };
    }

    const payment = monthlyStatus.paymentId
      ? await this.prisma.payment.findUnique({ where: { id: monthlyStatus.paymentId } })
      : null;

    return {
      paid: true,
      payment: payment ? this.mapToDto(payment) : undefined,
    };
  }

  async getPaymentHistory(
    organizationId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PaymentResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    this.logger.log(`Getting payment history for user ${userId}`);

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { organizationId, userId },
        skip,
        take: Number(limit),
        orderBy: { monthKey: 'desc' },
      }),
      this.prisma.payment.count({ where: { organizationId, userId } }),
    ]);

    return {
      data: payments.map((p) => this.mapToDto(p)),
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  async getUnpaidUsers(organizationId: string, monthKey: string): Promise<Record<string, unknown>[]> {
    this.logger.log(`Getting unpaid users for month ${monthKey}`);

    const unpaidStatuses = await this.prisma.monthlyPaymentStatus.findMany({
      where: { organizationId, monthKey, isPaid: false },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    return unpaidStatuses.map((s) => s.user);
  }

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private mapToDto(payment: Record<string, unknown>): PaymentResponseDto {
    return {
      id: payment.id as string,
      organizationId: payment.organizationId as string,
      userId: payment.userId as string,
      amount: payment.amount as number,
      monthKey: payment.monthKey as string,
      transactionId: (payment.externalTransactionId as string) || '',
      status: payment.status as string,
      method: (payment.source as string) || '',
      paidAt: payment.paymentDate as Date | undefined,
      createdAt: payment.createdAt as Date,
    };
  }
}
