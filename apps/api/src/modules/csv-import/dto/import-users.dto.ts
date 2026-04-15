import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportUsersDto {
  @ApiProperty({
    description: 'תוכן קובץ CSV. כותרות נדרשות: phone, fullName',
    example: 'phone,fullName\n0501234567,ישראל ישראלי\n0509876543,שרה כהן',
  })
  @IsString()
  @IsNotEmpty()
  csvContent!: string;
}
