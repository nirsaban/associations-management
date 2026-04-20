import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebauthnAuthenticateOptionsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'User phone number for credential lookup' })
  phone!: string;
}

export class WebauthnAuthenticateVerifyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'User phone number' })
  phone!: string;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({ description: 'WebAuthn authentication response from browser' })
  assertion!: Record<string, unknown>;
}
