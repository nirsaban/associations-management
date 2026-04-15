import { ApiProperty } from '@nestjs/swagger';

export class MemberWithStatusDto {
  @ApiProperty({ description: 'מזהה משתמש' })
  id!: string;

  @ApiProperty({ description: 'שם מלא' })
  fullName!: string;

  @ApiProperty({ description: 'טלפון' })
  phone!: string;

  @ApiProperty({ description: 'אימייל', required: false })
  email?: string;

  @ApiProperty({ description: 'סטטוס תשלום - שולם/לא שולם בלבד' })
  isPaid!: boolean;

  @ApiProperty({ description: 'תאריך הצטרפות לקבוצה' })
  joinedAt!: Date;
}
