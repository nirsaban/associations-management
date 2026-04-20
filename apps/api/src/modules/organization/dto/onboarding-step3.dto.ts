import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingStep3Dto {
  @ApiPropertyOptional({ description: 'טלפון ליצירת קשר', example: '0501234568' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'אימייל ליצירת קשר', example: 'info@org.il' })
  @IsEmail({}, { message: 'כתובת אימייל לא תקינה' })
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'קישור לפייסבוק' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  facebookUrl?: string;

  @ApiPropertyOptional({ description: 'קישור לאינסטגרם' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  instagramUrl?: string;

  @ApiPropertyOptional({ description: 'קישור לווצאפ' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  whatsappUrl?: string;

  @ApiPropertyOptional({ description: 'קישור לאתר' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  websiteUrl?: string;
}
