import { ApiProperty } from '@nestjs/swagger';

export class WeeklyTaskStatusDto {
  @ApiProperty({ description: 'מזהה משפחה' })
  familyId!: string;

  @ApiProperty({ description: 'שם משפחה' })
  familyName!: string;

  @ApiProperty({ description: 'כתובת' })
  address?: string;

  @ApiProperty({ description: 'טלפון' })
  contactPhone?: string;

  @ApiProperty({ description: 'האם יש הזמנה השבוע' })
  hasOrder!: boolean;

  @ApiProperty({ description: 'סטטוס הזמנה', required: false })
  orderStatus?: string;

  @ApiProperty({ description: 'מזהה הזמנה', required: false })
  orderId?: string;
}
