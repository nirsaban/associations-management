import { ApiProperty } from '@nestjs/swagger';

export class WeeklyStatusNoDistributorDto {
  @ApiProperty({ description: 'מזהה קבוצה' })
  groupId!: string;

  @ApiProperty({ description: 'שם קבוצה' })
  groupName!: string;

  @ApiProperty({ description: 'מזהה מנהל', required: false })
  managerId?: string | null;

  @ApiProperty({ description: 'שם מנהל', required: false })
  managerName?: string | null;

  @ApiProperty({ description: 'תאריך עדכון אחרון של הקבוצה' })
  lastActivity!: string;
}
