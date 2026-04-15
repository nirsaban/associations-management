import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT Payload structure as per CLAUDE.md specifications
 *
 * - sub: userId
 * - phone: user's phone number
 * - organizationId: null for SUPER_ADMIN, organization ID for org users
 * - platformRole: only set for SUPER_ADMIN
 * - systemRole: ADMIN or USER (organization level)
 * - iat: issued at
 * - exp: expiration
 */
export interface JwtPayload {
  sub: string;                    // userId
  phone: string;                  // user's phone number
  organizationId?: string | null; // null for SUPER_ADMIN
  platformRole?: 'SUPER_ADMIN';   // only for platform admins
  systemRole: 'ADMIN' | 'USER';   // organization system role
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Validate required fields
    if (!payload.sub || !payload.phone) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // SUPER_ADMIN should not have organizationId
    if (payload.platformRole === 'SUPER_ADMIN' && payload.organizationId) {
      throw new UnauthorizedException('Invalid token: SUPER_ADMIN cannot have organizationId');
    }

    // Organization users (ADMIN/USER) must have organizationId (unless SUPER_ADMIN)
    if (!payload.platformRole && !payload.organizationId) {
      throw new UnauthorizedException('Invalid token: Organization users must have organizationId');
    }

    this.logger.debug(`JWT validated for user ${payload.sub} (platformRole: ${payload.platformRole || 'none'}, systemRole: ${payload.systemRole})`);
    return payload;
  }
}
