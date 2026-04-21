import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkDeliveryDto {
  @ApiProperty({
    description: 'האם החבילה סופקה למשפחה',
    example: true,
  })
  @IsBoolean()
  delivered!: boolean;
}
