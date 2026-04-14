import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFamilyDto {
  @ApiProperty({
    description: 'Family name',
    example: 'משפחת כהן',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  familyName!: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+972501234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({
    description: 'Address',
    example: 'רחוב הראשי 10, תל אביב',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Notes about the family',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
