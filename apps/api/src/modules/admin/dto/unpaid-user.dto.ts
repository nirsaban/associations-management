import { ApiProperty } from '@nestjs/swagger';

export class UnpaidUserDto {
  @ApiProperty({ description: 'מזהה משתמש' })
  id!: string;

  @ApiProperty({ description: 'שם מלא' })
  fullName!: string;

  @ApiProperty({ description: 'טלפון' })
  phone!: string;

  @ApiProperty({ description: 'אימייל', required: false })
  email?: string;

  @ApiProperty({ description: 'מספר תזכורות שנשלחו', required: false })
  reminderCount?: number;
}
