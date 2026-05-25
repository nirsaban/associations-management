import { ApiProperty } from '@nestjs/swagger';

export class ProfessionItemDto {
  @ApiProperty({ description: 'מזהה מקצוע' })
  id!: string;

  @ApiProperty({ description: 'שם המקצוע בעברית' })
  nameHe!: string;

  @ApiProperty({ description: 'מספר סדר' })
  sortOrder!: number;
}

export class ProfessionCategoryDto {
  @ApiProperty({ description: 'מזהה קטגוריה' })
  id!: string;

  @ApiProperty({ description: 'שם הקטגוריה בעברית' })
  nameHe!: string;

  @ApiProperty({ description: 'מספר סדר' })
  sortOrder!: number;

  @ApiProperty({ description: 'מקצועות בקטגוריה', type: [ProfessionItemDto] })
  professions!: ProfessionItemDto[];
}

export class ProfessionSearchResultDto {
  @ApiProperty({ description: 'מזהה מקצוע' })
  id!: string;

  @ApiProperty({ description: 'שם המקצוע בעברית' })
  nameHe!: string;

  @ApiProperty({ description: 'קטגוריה' })
  category!: {
    id: string;
    nameHe: string;
  };
}
