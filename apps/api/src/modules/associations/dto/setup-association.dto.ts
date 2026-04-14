import { IsString, IsNotEmpty, IsEmail, IsOptional, Matches, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetupAssociationDto {
  @ApiProperty({ description: 'Organization name (Hebrew)', example: 'עמותת צדקה' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'tzedaka-org',
    pattern: '^[a-z0-9-]+$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'info@tzedaka.org.il' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '025812345' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Physical address', example: 'רחוב הרב קוק 15, ירושלים' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Organization settings (monthly payment, distribution day, etc.)',
    example: { monthlyPaymentAmount: 150, weeklyDistributionDay: 'THURSDAY' }
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
