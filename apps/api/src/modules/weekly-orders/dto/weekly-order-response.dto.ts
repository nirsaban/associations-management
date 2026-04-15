import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WeeklyOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  familyId!: string;

  @ApiProperty({ description: 'Week key format: 2026-W16', example: '2026-W16' })
  weekKey!: string;

  @ApiProperty()
  items!: unknown;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
