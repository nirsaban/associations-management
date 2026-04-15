import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({
    description: 'שם הקבוצה',
    example: 'קבוצת צפון',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    description: 'מזהה מנהל הקבוצה (חייב להיות משתמש בעמותה)',
    required: false,
  })
  @IsString()
  @IsOptional()
  managerId?: string;
}
