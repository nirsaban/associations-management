import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({ example: 'cly1abc...' })
  id!: string;

  @ApiProperty({ example: 'עמותת צדקה' })
  name!: string;

  @ApiProperty({ example: 'tzedaka-org' })
  slug!: string;

  @ApiPropertyOptional({ example: 'info@tzedaka.org.il' })
  email?: string;

  @ApiPropertyOptional({ example: '025812345' })
  phone?: string;

  @ApiPropertyOptional({ example: 'רחוב הרב קוק 15, ירושלים' })
  address?: string;

  @ApiPropertyOptional({ example: 'https://storage.com/logo.png' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'תיאור העמותה' })
  description?: string;

  @ApiPropertyOptional({ description: 'קישור לדף תרומות' })
  paymentLink?: string;

  @ApiPropertyOptional({ description: 'תיאור מטרת התרומה' })
  paymentDescription?: string;

  @ApiPropertyOptional({ description: 'קישור לפייסבוק' })
  facebookUrl?: string;

  @ApiPropertyOptional({ description: 'קישור לאינסטגרם' })
  instagramUrl?: string;

  @ApiPropertyOptional({ description: 'קישור לווצאפ' })
  whatsappUrl?: string;

  @ApiPropertyOptional({ description: 'קישור לאתר' })
  websiteUrl?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status!: string;

  @ApiProperty({ example: false, description: 'Has first admin completed setup wizard?' })
  setupCompleted!: boolean;

  @ApiPropertyOptional({ description: 'Organization settings (JSON)' })
  settings?: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class OrganizationWithAdminDto extends OrganizationResponseDto {
  @ApiPropertyOptional({ description: 'First admin user details' })
  firstAdmin?: {
    id: string;
    fullName: string;
    email?: string;
    phone: string;
    registrationCompleted: boolean;
  };
}
