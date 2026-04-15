import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Organization Role Guard
 *
 * Checks if user has required organization-level systemRole (ADMIN or USER).
 * This guard is for organization-scoped routes only.
 *
 * Per CLAUDE.md:
 * - ADMIN can manage their organization
 * - USER can access own data only
 * - SUPER_ADMIN should not access organization routes (use platform routes instead)
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, OrgRoleGuard)
 * @Roles('ADMIN')
 * async adminOnlyEndpoint() { ... }
 *
 * @UseGuards(JwtAuthGuard, OrgRoleGuard)
 * @Roles('ADMIN', 'USER')
 * async orgUserEndpoint() { ... }
 */
@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN should not access organization routes
    if (user.platformRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Platform administrators cannot access organization routes');
    }

    // User must have organizationId for organization routes
    if (!user.organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    // Check if user's systemRole matches any required role
    if (!requiredRoles.includes(user.systemRole)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
