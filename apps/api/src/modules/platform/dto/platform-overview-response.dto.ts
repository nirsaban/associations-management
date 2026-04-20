import { ApiProperty } from '@nestjs/swagger';

export class PlatformOverviewResponseDto {
  @ApiProperty({ description: 'סה"כ עמותות', example: 5 })
  totalOrganizations!: number;

  @ApiProperty({ description: 'עמותות פעילות', example: 4 })
  activeOrganizations!: number;

  @ApiProperty({ description: 'עמותות לא פעילות', example: 1 })
  inactiveOrganizations!: number;

  @ApiProperty({ description: 'סה"כ משתמשים', example: 120 })
  totalUsers!: number;

  @ApiProperty({ description: 'סה"כ מנהלי עמותות', example: 5 })
  totalAdmins!: number;

  @ApiProperty({ description: 'סה"כ מנהלי מערכת', example: 1 })
  totalSuperAdmins!: number;

  @ApiProperty({ description: 'סה"כ קבוצות', example: 15 })
  totalGroups!: number;

  @ApiProperty({ description: 'סה"כ משפחות', example: 80 })
  totalFamilies!: number;

  @ApiProperty({ description: 'לא שילמו החודש (כל העמותות)', example: 35 })
  unpaidThisMonthAcrossPlatform!: number;

  @ApiProperty({ description: 'עמותות שחסרות הזמנות שבועיות השבוע', example: 2 })
  organizationsMissingWeeklyOrdersThisWeek!: number;

  @ApiProperty({ description: 'עמותות שחסר מחלק שבועי השבוע', example: 1 })
  organizationsMissingWeeklyDistributorThisWeek!: number;
}
