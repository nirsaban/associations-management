import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupDto {
  @ApiProperty({
    description: 'שם הקבוצה',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'מזהה מנהל הקבוצה',
    required: false,
  })
  @IsString()
  @IsOptional()
  managerId?: string;
}
