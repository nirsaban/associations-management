import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBioDto {
  @ApiProperty({
    description: 'תיאור קצר (עד 280 תווים). מחרוזת ריקה מנקה את הביו.',
    maxLength: 280,
    example: 'מהנדס תוכנה עם 10 שנות ניסיון בפיתוח Full Stack',
  })
  @IsString()
  @MaxLength(280)
  shortBio!: string;
}
