import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/**
 * Organization ID decorator
 *
 * Extracts organizationId from JWT token (request.user).
 * Throws error if organizationId is missing for non-SUPER_ADMIN users.
 *
 * CRITICAL: This ensures organizationId always comes from JWT, never from request body/params.
 *
 * Usage:
 * @Get('/users')
 * async getUsers(@OrganizationId() orgId: string) {
 *   // orgId is guaranteed to be from JWT
 *   return this.usersService.findAll(orgId);
 * }
 */
export const OrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new BadRequestException('Authentication required');
    }

    const organizationId = user.organizationId || request.organizationId;

    if (!organizationId) {
      // This should not happen if guards are set up correctly
      // OrganizationScopeGuard should catch this
      throw new BadRequestException(
        'Organization context required. Ensure OrganizationScopeGuard is applied.',
      );
    }

    return organizationId;
  },
);
