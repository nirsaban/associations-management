import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWeeklyOrderDto {
  @ApiProperty({
    description: 'Order items (JSON)',
    type: 'array',
    required: false,
  })
  @IsOptional()
  @IsArray()
  items?: unknown[];

  @ApiProperty({
    description: 'Special notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Order status',
    enum: ['PENDING', 'APPROVED', 'COMPLETED'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;
}
