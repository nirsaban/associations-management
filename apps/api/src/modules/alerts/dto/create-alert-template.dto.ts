import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertAudience } from '@prisma/client';

export class CreateAlertTemplateDto {
  @ApiProperty({ description: 'שם תבנית פנימי (לזיהוי ע"י האדמין)', minLength: 1, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'כותרת ההתראה שתוצג למשתמשים', minLength: 1, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'גוף ההתראה שיוצג למשתמשים', minLength: 1, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
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
}
