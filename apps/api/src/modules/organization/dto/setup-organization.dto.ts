import { IsString, IsNotEmpty, IsEmail, IsOptional, Matches, MaxLength, IsObject, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SetupOrganizationDto {
  @ApiPropertyOptional({ description: 'שם הארגון', example: 'עמותת צדקה' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'כתובת URL ידידותית (slug)',
    example: 'tzedaka-org',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @MaxLength(100)
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'כתובת URL של הלוגו', example: 'https://cdn.example.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'כתובת אימייל ליצירת קשר', example: 'info@tzedaka.org.il' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'מספר טלפון ליצירת קשר', example: '025812345' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'כתובת פיזית', example: 'רחוב הרב קוק 15, ירושלים' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'הגדרות ארגון (סכום תרומה חודשי, יום חלוקה שבועי וכו\')',
    example: { monthlyPaymentAmount: 150, weeklyDistributionDay: 'THURSDAY' },
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'סיום אשף ההגדרות — אם true, מסמן setupCompleted=true',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  setupCompleted?: boolean;
}
