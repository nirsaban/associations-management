import { ApiProperty } from '@nestjs/swagger';

export class GroupDetailsDto {
  @ApiProperty({ description: 'מזהה קבוצה' })
  id!: string;

  @ApiProperty({ description: 'שם קבוצה' })
  name!: string;

  @ApiProperty({ description: 'מספר חברים' })
  memberCount!: number;

  @ApiProperty({ description: 'מספר משפחות' })
  familyCount!: number;

  @ApiProperty({ description: 'תאריך יצירה' })
  createdAt!: Date;
}
