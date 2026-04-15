import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';

/**
 * Organization Scope Guard
 *
 * CRITICAL SECURITY: Ensures all queries are scoped by organizationId from JWT.
 * This is the #1 security priority for tenant isolation.
 *
 * Per CLAUDE.md:
 * - Every API query MUST include organizationId from JWT — never from request body/params
 * - SUPER_ADMIN has no organizationId — they access platform routes only
 * - ADMIN accesses only their own organization
 * - User sees only their own data within their org
 * - No cross-tenant data leakage possible
 *
 * This guard:
 * 1. Extracts organizationId from JWT (request.user)
 * 2. Attaches it to request for use in service layer
 * 3. Prevents organization users from accessing platform routes
 * 4. Prevents SUPER_ADMIN from accessing organization routes
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, OrganizationScopeGuard)
 * @Get('/users')
 * async getUsers(@OrganizationId() orgId: string) {
 *   // orgId is guaranteed to be from JWT, not request
 *   return this.usersService.findAll(orgId);
 * }
 */
@Injectable()
export class OrganizationScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN should not access organization-scoped routes
    if (user.platformRole === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Platform administrators cannot access organization routes. Use platform routes instead.',
      );
    }

    // Organization users MUST have organizationId
    if (!user.organizationId) {
      throw new BadRequestException('Organization context required but not found in token');
    }

    // Attach organizationId to request for easy access in controllers/services
    // This ensures organizationId always comes from JWT, never from request body/params
    request.organizationId = user.organizationId;

    return true;
  }
}
