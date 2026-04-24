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

  @ApiProperty({ description: 'מזהה קבוצה', required: false })
  groupId?: string;

  @ApiProperty({ description: 'שם קבוצה', required: false })
  groupName?: string;

  @ApiProperty({ description: 'תפקיד בקבוצה (MANAGER / MEMBER)', required: false })
  groupRole?: string;

  @ApiProperty({ description: 'תאריך יצירה' })
  createdAt!: Date;

  @ApiProperty({ description: 'תאריך עדכון' })
  updatedAt!: Date;
}
