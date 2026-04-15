import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that restricts access to SUPER_ADMIN users only
 *
 * Per CLAUDE.md:
 * - SUPER_ADMIN has NO organizationId
 * - SUPER_ADMIN only accesses platform routes
 * - Check platformRole === 'SUPER_ADMIN'
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, SuperAdminGuard)
 * @SuperAdminOnly()
 * async platformOnlyEndpoint() { ... }
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isSuperAdminOnly = this.reflector.get<boolean>(
      'superAdminOnly',
      context.getHandler(),
    );

    if (!isSuperAdminOnly) {
      return true; // No restriction on this endpoint
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN must have platformRole = SUPER_ADMIN and NO organizationId
    if (user.platformRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('This action requires platform administrator privileges');
    }

    // Verify SUPER_ADMIN has no organizationId (tenant isolation)
    if (user.organizationId) {
      throw new ForbiddenException('Invalid SUPER_ADMIN token: should not have organizationId');
    }

    return true;
  }
}
