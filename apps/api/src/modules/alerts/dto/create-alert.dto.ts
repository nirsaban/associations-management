import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertAudience } from '@prisma/client';
import { IsDeepLink } from '../deep-link.util';

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
    description:
      'קהל היעד: ALL_USERS (כולם), GROUP_MANAGERS (מנהלי קבוצות), UNPAID_THIS_MONTH (שלא שילמו החודש), CURRENT_DISTRIBUTORS (מחלקים שבועיים נוכחיים)',
  })
  @IsOptional()
  @IsEnum(AlertAudience)
  audience?: AlertAudience;

  @ApiPropertyOptional({ description: 'תאריך תפוגה של ההתראה (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description:
      'קישור שייפתח בלחיצה על ההתראה. יכול להיות נתיב פנימי המתחיל ב-/ (למשל /weekly או /community/tehillim) או כתובת אתר חיצוני מלאה (https://...). ברירת מחדל: דף הבית',
    example: '/community/tehillim',
  })
  @IsOptional()
  @IsString()
  @IsDeepLink()
  linkUrl?: string;
}
