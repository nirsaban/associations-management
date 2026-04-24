import { IsOptional, IsString, MaxLength, IsEnum, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, { message: 'Slug must be URL-safe (lowercase letters, numbers, hyphens)' })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @ApiPropertyOptional({ enum: ['WARM', 'MODERN', 'MINIMAL', 'BOLD'] })
  @IsOptional()
  @IsEnum(['WARM', 'MODERN', 'MINIMAL', 'BOLD'])
  theme?: string;
}

// Reserved slugs that cannot be used for landing pages
export const RESERVED_SLUGS = [
  'admin', 'api', 'auth', 'login', 'logout', 'register', 'signup',
  'dashboard', 'platform', 'setup', 'settings', 'profile', 'user',
  'manager', 'super-admin', 'health', 'docs', 'static', 'uploads',
  'assets', 'public', 'private', 'app', 'www', 'mail', 'support',
];
