import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, IsEnum, IsArray, ArrayMaxSize, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PassItOnCategory } from '@prisma/client';

export class CreatePassItOnItemDto {
  @ApiProperty({ example: 'מקרר LG במצב מעולה' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'מקרר 480 ליטר, עובד מצוין. צריך להוריד מהקומה השלישית בלי מעלית.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ enum: PassItOnCategory })
  @IsEnum(PassItOnCategory)
  category!: PassItOnCategory;

  @ApiPropertyOptional({ type: [String], description: 'URLs של תמונות (עד 6)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 'בני ברק' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({ example: '0501234567' })
  @IsOptional()
  @Matches(/^(\+972|0)\d{8,9}$/, { message: 'Phone must be Israeli format' })
  contactPhone?: string;
}
