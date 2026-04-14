import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
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
      where: {
        transactionId: paymentWebhookDto.transactionId,
        deletedAt: null,
      },
    });

    if (existingPayment) {
      this.logger.warn(
        `Payment already processed for transaction ${paymentWebhookDto.transactionId}`,
      );
      return this.mapToDto(existingPayment);
    }

    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: paymentWebhookDto.organizationId,
      },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const status = paymentWebhookDto.status ?? 'PENDING';

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        organizationId: paymentWebhookDto.organizationId,
        userId: paymentWebhookDto.userId,
        amount: paymentWebhookDto.amount,
        monthKey: paymentWebhookDto.monthKey,
        transactionId: paymentWebhookDto.transactionId,
        status: status as PaymentStatus,
        method: paymentWebhookDto.method as PaymentMethod,
        webhookPayload: (paymentWebhookDto.webhookPayload ?? undefined) as Prisma.InputJsonValue | undefined,
        paidAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    if (status === 'COMPLETED') {
      this.logger.log(
        `User ${paymentWebhookDto.userId} payment completed for ${paymentWebhookDto.monthKey}`,
      );
    }

    return this.mapToDto(payment);
  }

  async getPaymentStatus(
    organizationId: string,
    userId: string,
    monthKey: string,
  ): Promise<{ paid: boolean; payment?: PaymentResponseDto }> {
    this.logger.log(`Checking payment status for user ${userId}, month ${monthKey}`);

    const payment = await this.prisma.payment.findFirst({
      where: {
        userId,
        monthKey,
        organizationId,
        status: 'COMPLETED',
        deletedAt: null,
      },
    });

    if (!payment) {
      return { paid: false };
    }

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
        where: {
          organizationId,
          userId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.payment.count({
        where: {
          organizationId,
          userId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: payments.map((p) => this.mapToDto(p)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getUnpaidUsers(organizationId: string, monthKey: string): Promise<Record<string, unknown>[]> {
    this.logger.log(`Getting unpaid users for month ${monthKey}`);

    const unpaidUsers = await this.prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        payments: {
          none: {
            monthKey,
            status: 'COMPLETED',
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    return unpaidUsers;
  }

  private mapToDto(payment: Record<string, unknown>): PaymentResponseDto {
    return {
      id: payment.id as string,
      organizationId: payment.organizationId as string,
      userId: payment.userId as string,
      amount: payment.amount as number,
      monthKey: payment.monthKey as string,
      transactionId: payment.transactionId as string,
      status: payment.status as string,
      method: payment.method as string,
      paidAt: payment.paidAt as Date | undefined,
      createdAt: payment.createdAt as Date,
      updatedAt: payment.updatedAt as Date,
    };
  }
}
