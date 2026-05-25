import { IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class PeopleSearchQueryDto {
  @ApiProperty({ description: 'סינון לפי שם (substring, לא תלוי רישיות)', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'מזהה מקצוע ספציפי', required: false })
  @IsOptional()
  @IsString()
  professionId?: string;

  @ApiProperty({ description: 'מזהה קטגוריית מקצוע', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'חיפוש חופשי על שם ותיאור', required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ description: 'מזהה דף (cursor pagination)', required: false })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ description: 'מספר תוצאות לדף (ברירת מחדל 20, מקסימום 50)', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
