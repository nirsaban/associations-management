import { ApiProperty } from '@nestjs/swagger';

export class WeeklyStatusIncompleteOrdersDto {
  @ApiProperty({ description: 'מזהה קבוצה' })
  groupId!: string;

  @ApiProperty({ description: 'שם קבוצה' })
  groupName!: string;

  @ApiProperty({ description: 'מזהה מנהל', required: false })
  managerId?: string | null;

  @ApiProperty({ description: 'שם מנהל', required: false })
  managerName?: string | null;

  @ApiProperty({ description: 'סטטוס הזמנה (DRAFT / COMPLETED)', required: false })
  orderStatus?: string;

  @ApiProperty({ description: 'מספר הזמנות שהושלמו' })
  completedOrders!: number;

  @ApiProperty({ description: 'סך הזמנות' })
  totalOrders!: number;

  @ApiProperty({ description: 'תאריך עדכון אחרון של הזמנה' })
  lastUpdate!: string;
}
