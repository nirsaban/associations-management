import { IsString, Length, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number (local or international format)',
    example: '0532898849',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+972|0)\d{8,9}$/, {
    message: 'Phone must be Israeli format: 0XXXXXXXXX or +972XXXXXXXXX',
  })
  phone!: string;

  @ApiProperty({
    description: 'One-time password (6 digits)',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otp!: string;

  @ApiProperty({
    description: 'Organization ID (required if phone exists in multiple organizations)',
    example: 'clxxx123',
    required: false,
  })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    description: 'Session ID from login response',
    example: 'session-abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
