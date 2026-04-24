import { ApiProperty } from '@nestjs/swagger';

export class FamilyOrderDto {
  @ApiProperty({ description: 'מזהה הזמנה' })
  id!: string;

  @ApiProperty({ description: 'מפתח שבוע (YYYY-WNN)' })
  weekKey!: string;

  @ApiProperty({ description: 'רשימת קניות (JSON)', required: false, nullable: true })
  shoppingListJson!: unknown;

  @ApiProperty({ description: 'סטטוס הזמנה' })
  status!: string;

  @ApiProperty({ description: 'הערות להזמנה', required: false, nullable: true })
  notes!: string | null;

  @ApiProperty({ description: 'תאריך יצירת הזמנה' })
  createdAt!: Date;
}

export class FamilyResponseDto {
  @ApiProperty({ description: 'מזהה משפחה' })
  id!: string;

  @ApiProperty({ description: 'מזהה עמותה' })
  organizationId!: string;

  @ApiProperty({ description: 'שם המשפחה' })
  familyName!: string;

  @ApiProperty({ description: 'מזהה קבוצה', required: false })
  groupId?: string;

  @ApiProperty({ description: 'שם קבוצה', required: false })
  groupName?: string;

  @ApiProperty({ description: 'שם איש קשר', required: false })
  contactName?: string;

  @ApiProperty({ description: 'טלפון איש קשר', required: false })
  contactPhone?: string;

  @ApiProperty({ description: 'כתובת', required: false })
  address?: string;

  @ApiProperty({ description: 'הערות', required: false })
  notes?: string;

  @ApiProperty({ description: 'היסטוריית הזמנות שבועיות (50 אחרונות)', required: false, type: () => [FamilyOrderDto] })
  orders?: FamilyOrderDto[];

  @ApiProperty({ description: 'תאריך יצירה' })
  createdAt!: Date;

  @ApiProperty({ description: 'תאריך עדכון' })
  updatedAt!: Date;
}
