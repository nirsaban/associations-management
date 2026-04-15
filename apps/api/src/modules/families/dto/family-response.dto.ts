import { ApiProperty } from '@nestjs/swagger';

export class FamilyResponseDto {
  @ApiProperty({ description: 'מזהה משפחה' })
  id!: string;

  @ApiProperty({ description: 'מזהה עמותה' })
  organizationId!: string;

  @ApiProperty({ description: 'שם המשפחה' })
  familyName!: string;

  @ApiProperty({ description: 'מזהה קבוצה', required: false })
  groupId?: string;

  @ApiProperty({ description: 'שם איש קשר', required: false })
  contactName?: string;

  @ApiProperty({ description: 'טלפון איש קשר', required: false })
  contactPhone?: string;

  @ApiProperty({ description: 'כתובת', required: false })
  address?: string;

  @ApiProperty({ description: 'הערות', required: false })
  notes?: string;

  @ApiProperty({ description: 'תאריך יצירה' })
  createdAt!: Date;

  @ApiProperty({ description: 'תאריך עדכון' })
  updatedAt!: Date;
}
