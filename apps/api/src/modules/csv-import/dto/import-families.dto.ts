import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportFamiliesDto {
  @ApiProperty({
    description: 'תוכן קובץ CSV. כותרות נדרשות: familyName, address, contactPhone',
    example: 'familyName,address,contactPhone\nמשפחת כהן,רחוב הראשי 1,0501234567',
  })
  @IsString()
  @IsNotEmpty()
  csvContent!: string;
}
