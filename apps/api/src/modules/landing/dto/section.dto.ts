import { IsString, IsOptional, IsObject, IsBoolean, IsEnum, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const SECTION_TYPES = [
  'hero', 'video', 'about', 'activities', 'gallery',
  'reviews', 'stats', 'cta_payment', 'join_us', 'faq', 'footer',
] as const;

export type SectionType = typeof SECTION_TYPES[number];

export class CreateSectionDto {
  @ApiProperty({ enum: SECTION_TYPES })
  @IsEnum(SECTION_TYPES)
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class UpdateSectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class ReorderItem {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderSectionsDto {
  @ApiProperty({ type: [ReorderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items!: ReorderItem[];
}
