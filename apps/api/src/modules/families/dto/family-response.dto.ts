import { ApiProperty } from '@nestjs/swagger';

export class FamilyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  familyName!: string;

  @ApiProperty()
  contactPhone?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
