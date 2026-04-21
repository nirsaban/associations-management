import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertWeeklyOrderDto {
  @ApiProperty({
    description: 'תוכן ההזמנה השבועית',
    example: 'חלב, לחם, ביצים',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({
    description: 'מפתח שבוע (פורמט: YYYY-WNN)',
    example: '2026-W17',
  })
  @IsOptional()
  @IsString()
  weekKey?: string;
}
