import { ApiProperty } from '@nestjs/swagger';

export class PersonProfessionDto {
  @ApiProperty({ description: 'מזהה מקצוע' })
  id!: string;

  @ApiProperty({ description: 'שם המקצוע בעברית' })
  nameHe!: string;

  @ApiProperty({ description: 'האם מקצוע ראשי' })
  isPrimary!: boolean;

  @ApiProperty({ description: 'קטגוריה' })
  category!: {
    id: string;
    nameHe: string;
  };
}

export class PersonResultDto {
  @ApiProperty({ description: 'מזהה משתמש' })
  id!: string;

  @ApiProperty({ description: 'שם מלא' })
  fullName!: string;

  @ApiProperty({ description: 'תמונת פרופיל', nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'מקצועות', type: [PersonProfessionDto] })
  professions!: PersonProfessionDto[];

  @ApiProperty({ description: 'מקצוע חופשי', nullable: true })
  otherProfession!: string | null;

  @ApiProperty({ description: 'תיאור קצר', nullable: true })
  shortBio!: string | null;

  @ApiProperty({ description: 'מספר טלפון', nullable: true })
  phone!: string | null;
}

export class PeopleSearchResultDto {
  @ApiProperty({ description: 'רשימת אנשים', type: [PersonResultDto] })
  items!: PersonResultDto[];

  @ApiProperty({ description: 'cursor לדף הבא (null אם אין עוד)', nullable: true })
  nextCursor!: string | null;
}
