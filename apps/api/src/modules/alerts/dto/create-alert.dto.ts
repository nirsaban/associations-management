import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertAudience } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({ description: 'כותרת ההתראה' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'גוף ההתראה' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({
    enum: AlertAudience,
    default: AlertAudience.ALL_USERS,
    description: 'קהל היעד: כל המשתמשים או מנהלי קבוצות בלבד',
  })
  @IsOptional()
  @IsEnum(AlertAudience)
  audience?: AlertAudience;

  @ApiPropertyOptional({ description: 'תאריך תפוגה של ההתראה (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
