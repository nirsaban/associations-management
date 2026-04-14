import { ApiProperty } from '@nestjs/swagger';

export class WeeklyOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  familyId!: string;

  @ApiProperty()
  weekStart!: Date;

  @ApiProperty()
  items!: unknown;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  completedBy?: string;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
