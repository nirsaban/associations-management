import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'תזכורת לתשלום',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'נא לשלם עבור החודש הנוכחי',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiProperty({
    description: 'Notification type',
    enum: ['info', 'warning', 'error', 'success', 'payment', 'reminder'],
    example: 'warning',
  })
  @IsString()
  @IsOptional()
  type: string = 'info';

  @ApiProperty({
    description: 'Additional metadata (JSON)',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
