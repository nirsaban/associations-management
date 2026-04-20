import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingStep2Dto {
  @ApiProperty({ description: 'קישור לדף תרומות', example: 'https://paybox.co.il/my-org' })
  @IsString()
  @IsNotEmpty({ message: 'קישור לתרומות הוא שדה חובה' })
  @MaxLength(500)
  paymentLink!: string;

  @ApiPropertyOptional({ description: 'תיאור מטרת התרומה' })
  @IsString()
  @IsOptional()
  paymentDescription?: string;
}
