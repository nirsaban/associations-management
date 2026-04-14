import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssociationDto {
  @ApiProperty({ description: 'Organization name (Hebrew)', example: 'עמותת צדקה' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if empty)',
    example: 'tzedaka-org',
    pattern: '^[a-z0-9-]+$'
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'info@tzedaka.org.il' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone (Israeli format)', example: '025812345' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;
}
