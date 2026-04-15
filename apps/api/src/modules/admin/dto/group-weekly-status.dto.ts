import { ApiProperty } from '@nestjs/swagger';

export class GroupWeeklyStatusDto {
  @ApiProperty({ description: 'מזהה קבוצה' })
  groupId!: string;

  @ApiProperty({ description: 'שם קבוצה' })
  groupName!: string;

  @ApiProperty({ description: 'שם מנהל', required: false })
  managerName?: string | null;

  @ApiProperty({ description: 'סך משפחות' })
  totalFamilies!: number;

  @ApiProperty({ description: 'הזמנות שהושלמו' })
  completedOrders!: number;

  @ApiProperty({ description: 'הזמנות ממתינות' })
  pendingOrders!: number;

  @ApiProperty({ description: 'מחלק שבועי', required: false })
  distributorName?: string;

  @ApiProperty({ description: 'האם יש מחלק שבועי' })
  hasDistributor!: boolean;
}
