import { IsString, IsNotEmpty, IsEmail, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFirstAdminDto {
  @ApiProperty({
    description: 'Phone number (Israeli format: 05XXXXXXXX)',
    example: '0501234567',
    pattern: '^05\\d{8}$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^05\d{8}$/, { message: 'Phone must be in Israeli format: 05XXXXXXXX' })
  phone!: string;

  @ApiProperty({ description: 'Full name (Hebrew)', example: 'דוד כהן' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'admin@tzedaka.org.il' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
