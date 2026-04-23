import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDefined,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationDataDto {
  @ApiProperty({ description: 'שם העמותה', example: 'עמותת צדקה' })
  @IsString()
  @IsNotEmpty({ message: 'שם העמותה הוא שדה חובה' })
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Slug (kebab-case, unique)',
    example: 'tzedaka-org',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @IsNotEmpty({ message: 'Slug הוא שדה חובה' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug חייב להכיל רק אותיות קטנות באנגלית, מספרים ומקפים',
  })
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional({ description: 'טלפון ליצירת קשר', example: '025812345' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'אימייל ליצירת קשר', example: 'info@tzedaka.org.il' })
  @IsEmail({}, { message: 'כתובת אימייל לא תקינה' })
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'כתובת', example: 'רחוב הרב קוק 15, ירושלים' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class FirstAdminDataDto {
  @ApiProperty({ description: 'שם מלא', example: 'דוד כהן' })
  @IsString()
  @IsNotEmpty({ message: 'שם מלא הוא שדה חובה' })
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({
    description: 'מספר טלפון (פורמט ישראלי: 05XXXXXXXX)',
    example: '0501234567',
    pattern: '^05\\d{8}$',
  })
  @IsString()
  @IsNotEmpty({ message: 'מספר טלפון הוא שדה חובה' })
  @Matches(/^05\d{8}$/, {
    message: 'מספר טלפון חייב להיות בפורמט ישראלי: 05XXXXXXXX',
  })
  phone!: string;
}

export class CreateOrganizationWithAdminDto {
  @ApiProperty({ description: 'פרטי העמותה', type: OrganizationDataDto })
  @IsDefined({ message: 'פרטי העמותה הם שדה חובה' })
  @ValidateNested()
  @Type(() => OrganizationDataDto)
  organization!: OrganizationDataDto;

  @ApiProperty({ description: 'פרטי המנהל הראשון', type: FirstAdminDataDto })
  @IsDefined({ message: 'פרטי המנהל הראשון הם שדה חובה' })
  @ValidateNested()
  @Type(() => FirstAdminDataDto)
  firstAdmin!: FirstAdminDataDto;
}
