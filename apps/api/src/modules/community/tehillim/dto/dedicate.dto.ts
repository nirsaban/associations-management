import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TehillimDedicationType } from '@prisma/client';

export class DedicateTehillimDto {
  @ApiProperty({ enum: TehillimDedicationType, example: 'REFUAH' })
  @IsEnum(TehillimDedicationType)
  type!: TehillimDedicationType;

  @ApiPropertyOptional({ description: 'שם המוקדש (אם רלוונטי)', example: 'יעקב בן שרה' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  dedicateeName?: string;

  @ApiPropertyOptional({ description: 'שם האם', example: 'שרה' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  motherName?: string;
}
