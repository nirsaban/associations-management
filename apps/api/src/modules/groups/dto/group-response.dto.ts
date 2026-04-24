import { ApiProperty } from '@nestjs/swagger';

export class GroupResponseDto {
  @ApiProperty({ description: 'מזהה קבוצה' })
  id!: string;

  @ApiProperty({ description: 'מזהה עמותה' })
  organizationId!: string;

  @ApiProperty({ description: 'שם הקבוצה' })
  name!: string;

  @ApiProperty({ description: 'מזהה מנהל הקבוצה', required: false })
  managerId?: string;

  @ApiProperty({ description: 'שם מנהל הקבוצה', required: false })
  managerName?: string;

  @ApiProperty({ description: 'טלפון מנהל הקבוצה', required: false })
  managerPhone?: string;

  @ApiProperty({ description: 'מספר חברים', required: false })
  memberCount?: number;

  @ApiProperty({ description: 'מספר משפחות', required: false })
  familyCount?: number;

  @ApiProperty({ description: 'תאריך יצירה' })
  createdAt!: Date;

  @ApiProperty({ description: 'תאריך עדכון' })
  updatedAt!: Date;
}
