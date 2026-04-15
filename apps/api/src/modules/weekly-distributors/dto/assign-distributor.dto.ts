import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDistributorDto {
  @ApiProperty({
    description: 'User ID to assign as distributor',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Week key format: 2026-W16 (defaults to current week if not provided)',
    example: '2026-W16',
  })
  @IsString()
  @IsOptional()
  weekKey?: string;
}
