import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User full name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  fullName?: string;

  @ApiProperty({
    description: 'Phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'User system role',
    enum: ['admin', 'manager', 'user', 'distributor'],
    required: false,
  })
  @IsString()
  @IsOptional()
  systemRole?: string;

  @ApiProperty({
    description: 'User email address',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
