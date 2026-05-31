import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfessionsDto {
  @ApiProperty({
    description: 'מזהה המקצוע הראשי (אופציונלי)',
    example: 'cld123abc456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  primary?: string;

  @ApiProperty({
    description: 'מזהי מקצועות משניים (אופציונלי, עד 5)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  secondary?: string[];

  @ApiProperty({
    description: 'מקצוע חופשי (מחרוזת, עד 120 תווים)',
    required: false,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  otherProfession?: string;
}
