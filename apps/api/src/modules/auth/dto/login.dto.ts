import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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
}
