import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingStep1Dto {
  @ApiProperty({ description: 'שם העמותה', example: 'עמותת חסד ואהבה' })
  @IsString()
  @IsNotEmpty({ message: 'שם העמותה הוא שדה חובה' })
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'כתובת העמותה', example: 'רחוב הרצל 1, תל אביב' })
  @IsString()
  @IsNotEmpty({ message: 'כתובת העמותה היא שדה חובה' })
  address!: string;

  @ApiPropertyOptional({ description: 'קישור ללוגו', example: 'https://cdn.example.com/logo.png' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'תיאור העמותה' })
  @IsString()
  @IsOptional()
  description?: string;
}
