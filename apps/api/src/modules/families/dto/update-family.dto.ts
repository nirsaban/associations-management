import { IsString, IsOptional, MinLength, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFamilyDto {
  @ApiProperty({
    description: 'Family name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Contact person name',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({
    description: 'Contact phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({
    description: 'Address',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Number of family members',
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  memberCount?: number;

  @ApiProperty({
    description: 'Family status',
    enum: ['active', 'inactive'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Notes about the family',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
