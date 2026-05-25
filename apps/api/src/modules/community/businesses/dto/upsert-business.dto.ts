import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertBusinessDto {
  @ApiProperty({ example: 'יעוץ עסקי לקטנים', minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'יעוץ פיננסי-עסקי לעסקים קטנים. ליווי מהקמה עד צמיחה.' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ example: 'ייעוץ עסקי' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ description: 'URL ללוגו (העלאה דרך /community/businesses/upload)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: '0501234567' })
  @IsOptional()
  @Matches(/^(\+972|0)\d{8,9}$/, { message: 'טלפון חייב להיות בפורמט ישראלי' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ example: 'https://wa.me/972501234567' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  whatsappUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  facebookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  instagramUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  tiktokUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  youtubeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'האם להציג בסליידר הקהילתי', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
