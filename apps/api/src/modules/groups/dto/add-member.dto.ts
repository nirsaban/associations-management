import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    description: 'מזהה המשתמש להוספה לקבוצה',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
