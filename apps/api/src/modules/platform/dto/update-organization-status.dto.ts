import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OrganizationStatusValue {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateOrganizationStatusDto {
  @ApiProperty({
    description: 'סטטוס העמותה',
    enum: OrganizationStatusValue,
    example: 'ACTIVE',
  })
  @IsEnum(OrganizationStatusValue, {
    message: 'סטטוס חייב להיות ACTIVE או INACTIVE',
  })
  status!: OrganizationStatusValue;
}
