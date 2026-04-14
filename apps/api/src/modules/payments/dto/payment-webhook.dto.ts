import { IsString, IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentWebhookDto {
  @ApiProperty({
    description: 'Unique transaction ID for idempotency',
    example: 'txn_123456789',
  })
  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @ApiProperty({
    description: 'User ID',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Organization ID',
  })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    description: 'Month key for payment tracking (YYYY-MM format)',
    example: '2024-03',
  })
  @IsString()
  @IsNotEmpty()
  monthKey!: string;

  @ApiProperty({
    description: 'Payment amount in cents',
    example: 10000,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'credit_card',
  })
  @IsString()
  @IsNotEmpty()
  method!: string;

  @ApiProperty({
    description: 'Payment status',
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Raw webhook payload',
    required: false,
  })
  @IsOptional()
  webhookPayload?: Record<string, unknown>;
}
