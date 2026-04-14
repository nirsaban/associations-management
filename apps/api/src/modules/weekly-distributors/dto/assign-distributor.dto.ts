import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDistributorDto {
  @ApiProperty({
    description: 'User ID to assign as distributor',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Week start date (ISO string)',
    example: '2024-03-04',
  })
  @IsString()
  @IsNotEmpty()
  weekStart!: string;
}
