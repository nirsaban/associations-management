import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWeeklyOrderDto {
  @ApiProperty({
    description: 'Group ID',
  })
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @ApiProperty({
    description: 'Family ID',
  })
  @IsString()
  @IsNotEmpty()
  familyId!: string;

  @ApiProperty({
    description: 'Week start date (ISO string)',
    example: '2024-03-04',
  })
  @IsString()
  @IsNotEmpty()
  weekStart!: string;

  @ApiProperty({
    description: 'Order items (JSON)',
    type: 'array',
    required: false,
  })
  @IsOptional()
  @IsArray()
  items?: unknown[];

  @ApiProperty({
    description: 'Order status',
    enum: ['PENDING', 'APPROVED', 'COMPLETED'],
    example: 'PENDING',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Special notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
