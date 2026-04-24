import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationCountsDto {
  @ApiProperty({ example: 15 })
  usersCount!: number;

  @ApiProperty({ example: 3 })
  groupsCount!: number;

  @ApiProperty({ example: 10 })
  familiesCount!: number;

  @ApiProperty({ example: 5 })
  unpaidThisMonthCount!: number;
}

export class OrganizationListItemDto {
  @ApiProperty({ example: 'cly1abc...' })
  id!: string;

  @ApiProperty({ example: 'עמותת צדקה' })
  name!: string;

  @ApiProperty({ example: 'tzedaka-org' })
  slug!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status!: string;

  @ApiProperty({ example: false })
  setupCompleted!: boolean;

  @ApiPropertyOptional({ example: '025812345' })
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'info@tzedaka.org.il' })
  contactEmail?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'ספירות' })
  counts!: OrganizationCountsDto;
}

export class OrganizationDetailDto extends OrganizationListItemDto {
  @ApiPropertyOptional({ example: 'רחוב הרב קוק 15, ירושלים' })
  address?: string;

  @ApiPropertyOptional({ example: 'https://storage.com/logo.png' })
  logoUrl?: string;

  @ApiProperty({ example: 'IL' })
  country!: string;

  @ApiProperty({ example: '#2563eb' })
  primaryColor!: string;

  @ApiProperty({ example: '#f59e0b' })
  accentColor!: string;

  @ApiPropertyOptional()
  settings?: Record<string, unknown>;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'מנהלי העמותה',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        fullName: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        registrationCompleted: { type: 'boolean' },
      },
    },
  })
  admins?: Array<{
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    registrationCompleted: boolean;
  }>;
}
