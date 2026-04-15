import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'מזהה משתמש' })
  id!: string;

  @ApiProperty({ description: 'מזהה עמותה' })
  organizationId!: string;

  @ApiProperty({ description: 'כתובת אימייל', required: false })
  email?: string;

  @ApiProperty({ description: 'שם מלא' })
  fullName!: string;

  @ApiProperty({ description: 'מספר טלפון' })
  phone!: string;

  @ApiProperty({ description: 'תפקיד במערכת (ADMIN / USER)' })
  systemRole!: string;

  @ApiProperty({ description: 'האם המשתמש פעיל' })
  isActive!: boolean;

  @ApiProperty({ description: 'תאריך יצירה' })
  createdAt!: Date;

  @ApiProperty({ description: 'תאריך עדכון' })
  updatedAt!: Date;
}
