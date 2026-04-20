import { IsObject, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebauthnRegisterVerifyDto {
  @IsObject()
  @IsNotEmpty()
  @ApiProperty({ description: 'WebAuthn attestation response from browser' })
  attestation!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Device name for this credential' })
  deviceName?: string;
}
