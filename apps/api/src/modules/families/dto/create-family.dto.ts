import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFamilyDto {
  @ApiProperty({
    description: 'שם המשפחה',
    example: 'משפחת כהן',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  familyName!: string;

  @ApiProperty({
    description: 'שם איש קשר',
    example: 'יוסי כהן',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiProperty({
    description: 'טלפון איש קשר',
    example: '+972501234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({
    description: 'כתובת',
    example: 'רחוב הראשי 10, תל אביב',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'הערות',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'מזהה קבוצה (אופציונלי)',
    required: false,
  })
  @IsString()
  @IsOptional()
  groupId?: string;
}
