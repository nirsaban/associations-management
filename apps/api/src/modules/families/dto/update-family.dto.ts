import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFamilyDto {
  @ApiProperty({
    description: 'שם המשפחה',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  familyName?: string;

  @ApiProperty({
    description: 'שם איש קשר',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiProperty({
    description: 'טלפון איש קשר',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({
    description: 'כתובת',
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
