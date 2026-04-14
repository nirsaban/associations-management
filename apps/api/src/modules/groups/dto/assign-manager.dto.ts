import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignManagerDto {
  @ApiProperty({
    description: 'User ID to assign as manager',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
