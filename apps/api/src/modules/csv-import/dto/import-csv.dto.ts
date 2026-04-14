import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum ImportType {
  USERS = 'users',
  FAMILIES = 'families',
  GROUPS = 'groups',
}

export class ImportCsvDto {
  @ApiProperty({
    description: 'CSV file content as base64 or raw text',
  })
  @IsString()
  @IsNotEmpty()
  csvContent!: string;

  @ApiProperty({
    description: 'Type of import',
    enum: ImportType,
  })
  @IsEnum(ImportType)
  @IsNotEmpty()
  type!: string;

  @ApiProperty({
    description: 'Dry run mode (preview without saving)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  dryRun: boolean = false;
}
