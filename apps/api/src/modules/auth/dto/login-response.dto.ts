import { ApiProperty } from '@nestjs/swagger';

export class OrganizationOptionDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'clxxx123',
  })
  id!: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'עמותת צדקה',
  })
  name!: string;

  @ApiProperty({
    description: 'User role in this organization',
    enum: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    example: 'ADMIN',
  })
  userRole!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'OTP sent to phone number',
  })
  message!: string;

  @ApiProperty({
    description: 'Whether OTP was sent',
    example: true,
  })
  otpSent!: boolean;

  @ApiProperty({
    description: 'Session ID for OTP verification',
    example: 'session-123',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Organizations where this phone exists (only if multiple)',
    type: [OrganizationOptionDto],
    required: false,
  })
  organizations?: OrganizationOptionDto[];

  @ApiProperty({
    description: 'Whether user needs to select organization',
    example: false,
  })
  requiresOrgSelection!: boolean;
}
