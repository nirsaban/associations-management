import { ApiProperty } from '@nestjs/swagger';

export class DistributorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ description: 'Week key format: 2026-W16', example: '2026-W16' })
  weekKey!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
