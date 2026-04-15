import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ description: 'True if status is READ' })
  isRead!: boolean;

  @ApiPropertyOptional()
  metadata?: unknown;

  @ApiProperty()
  createdAt!: Date;
}
