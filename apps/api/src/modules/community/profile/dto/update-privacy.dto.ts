import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePrivacyDto {
  @ApiProperty({
    description: 'האם להציג בחיפוש הקהילה',
    example: true,
  })
  @IsBoolean()
  showInCommunitySearch!: boolean;
}
