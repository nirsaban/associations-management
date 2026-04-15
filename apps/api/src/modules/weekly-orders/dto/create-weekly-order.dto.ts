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
    description: 'Week key (ISO week format: 2026-W16)',
    example: '2026-W16',
  })
  @IsString()
  @IsNotEmpty()
  weekKey!: string;

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
    enum: ['DRAFT', 'COMPLETED'],
    example: 'DRAFT',
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
