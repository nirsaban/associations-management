import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class PushKeys {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  auth!: string;
}

export class PushSubscribeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Push subscription endpoint URL' })
  endpoint!: string;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({ type: PushKeys })
  keys!: PushKeys;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'User agent string for device identification' })
  userAgent?: string;
}
