import { ApiProperty } from '@nestjs/swagger';

export class RevenueByMonthDto {
  @ApiProperty({ description: 'חודש (YYYY-MM)' })
  monthKey!: string;

  @ApiProperty({ description: 'הכנסות' })
  revenue!: number;

  @ApiProperty({ description: 'מספר תשלומים' })
  paymentCount!: number;
}
