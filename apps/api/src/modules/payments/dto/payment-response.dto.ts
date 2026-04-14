import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  monthKey!: string;

  @ApiProperty()
  transactionId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  method!: string;

  @ApiProperty()
  paidAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
