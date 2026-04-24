import { IsEmail, IsString, IsOptional, IsBoolean, IsIn, MinLength } from 'class-validator';
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
    description: 'User email address',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Whether the user is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'User system role (ADMIN or USER only)',
    enum: ['ADMIN', 'USER'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'USER'], { message: 'תפקיד חייב להיות ADMIN או USER' })
  systemRole?: 'ADMIN' | 'USER';
}
