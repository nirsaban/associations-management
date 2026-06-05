import { ApiProperty } from '@nestjs/swagger';

export class GroupManagerDto {
  @ApiProperty({ description: 'מזהה מנהל' })
  id!: string;

  @ApiProperty({ description: 'שם מלא', required: false })
  fullName?: string;

  @ApiProperty({ description: 'טלפון' })
  phone!: string;
}

export class GroupResponseDto {
  @ApiProperty({ description: 'מזהה קבוצה' })
  id!: string;

  @ApiProperty({ description: 'מזהה עמותה' })
  organizationId!: string;

  @ApiProperty({ description: 'שם הקבוצה' })
  name!: string;

  @ApiProperty({
    description: 'מזהה המנהל הראשי (תאימות לאחור — מפנה ל-managers[0])',
    required: false,
  })
  managerId?: string;

  @ApiProperty({ description: 'שם המנהל הראשי (תאימות לאחור)', required: false })
  managerName?: string;

  @ApiProperty({ description: 'טלפון המנהל הראשי (תאימות לאחור)', required: false })
  managerPhone?: string;

  @ApiProperty({
    description: 'רשימת מנהלי הקבוצה (עד 2)',
    type: [GroupManagerDto],
    required: false,
  })
  managers?: GroupManagerDto[];

  @ApiProperty({ description: 'מספר חברים', required: false })
  memberCount?: number;

  @ApiProperty({ description: 'מספר משפחות', required: false })
  familyCount?: number;

  @ApiProperty({ description: 'שמות המשפחות בקבוצה', required: false, type: [String] })
  familyNames?: string[];

  @ApiProperty({ description: 'תאריך יצירה' })
  createdAt!: Date;

  @ApiProperty({ description: 'תאריך עדכון' })
  updatedAt!: Date;
}
