import { IsOptional, IsString, MaxLength, IsHexColor, IsEmail, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrgProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ description: 'ח.פ / עוסק מורשה' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @ApiPropertyOptional({ maxLength: 280 })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  aboutShort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboutLong?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  defaultPaymentLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  paymentLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentDescription?: string;

  @ApiPropertyOptional({ description: 'Grow Payment userId' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  growUserId?: string;

  @ApiPropertyOptional({ description: 'Grow Payment Wallet pageCode' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  growPageCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  whatsappUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;
}
