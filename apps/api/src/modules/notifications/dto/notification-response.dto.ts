import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  readAt?: Date;

  @ApiProperty()
  metadata?: unknown;

  @ApiProperty()
  createdAt!: Date;
}
