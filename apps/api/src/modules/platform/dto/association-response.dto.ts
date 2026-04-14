import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssociationResponseDto {
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

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: false, description: 'Has first admin completed setup wizard?' })
  setupCompleted!: boolean;

  @ApiPropertyOptional({ description: 'Organization settings (JSON)' })
  settings?: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AssociationWithAdminDto extends AssociationResponseDto {
  @ApiPropertyOptional({ description: 'First admin user details' })
  firstAdmin?: {
    id: string;
    fullName: string;
    email?: string;
    phone: string;
    registrationCompleted: boolean;
  };
}
