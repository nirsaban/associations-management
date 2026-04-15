import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty({ description: 'סך משתמשים' })
  totalUsers!: number;

  @ApiProperty({ description: 'סך קבוצות' })
  totalGroups!: number;

  @ApiProperty({ description: 'סך משפחות' })
  totalFamilies!: number;

  @ApiProperty({ description: 'הכנסות חודש נוכחי' })
  currentMonthRevenue!: number;

  @ApiProperty({ description: 'משתמשים ששילמו החודש' })
  paidUsersThisMonth!: number;

  @ApiProperty({ description: 'משתמשים שלא שילמו החודש' })
  unpaidUsersThisMonth!: number;
}
