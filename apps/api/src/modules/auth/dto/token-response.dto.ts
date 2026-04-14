import { ApiProperty } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ enum: ['SUPER_ADMIN', 'ADMIN', 'USER'] })
  systemRole!: string;

  @ApiProperty({ required: false })
  organizationId?: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number = 3600;

  @ApiProperty({
    description: 'User data',
    type: UserDataDto,
  })
  user!: UserDataDto;
}
