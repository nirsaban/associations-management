import { IsString, IsOptional, IsEmail, IsInt, Min, Max, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitReviewDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  authorName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  body!: string;

  // Honeypot field — if filled, submission is silently rejected (bot trap)
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';
}
