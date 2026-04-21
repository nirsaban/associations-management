import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateFamilyDto {
  @ApiPropertyOptional({
    description: 'טלפון איש קשר (פורמט ישראלי)',
    example: '0501234567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+972|0)\d{8,9}$/, { message: 'פורמט טלפון לא תקין' })
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'מספר ילדים קטינים',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  childrenMinorCount?: number;

  @ApiPropertyOptional({
    description: 'סך כל חברי המשפחה',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalMemberCount?: number;

  @ApiPropertyOptional({
    description: 'כתובת המשפחה',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'הערות',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  // Cross-field validation: childrenMinorCount <= totalMemberCount
  // Enforced in service layer because class-validator doesn't support cross-field natively
}
