import { IsEmail, IsString, IsNotEmpty, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'דוד כהן',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({
    description: 'Phone number in Israeli format',
    example: '0501234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+972|0)\d{8,9}$/, {
    message: 'Phone must be Israeli format: 0XXXXXXXXX or +972XXXXXXXXX',
  })
  phone!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
