import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that restricts access to SUPER_ADMIN users only
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, SuperAdminGuard)
 * @SuperAdminOnly()
 * async someEndpoint() { ... }
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

    if (user.systemRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('This action requires platform administrator privileges');
    }

    return true;
  }
}
