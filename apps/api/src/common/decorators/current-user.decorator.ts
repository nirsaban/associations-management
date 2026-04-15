import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current user interface extracted from JWT token
 * Maps to JwtPayload structure
 */
export interface CurrentUser {
  sub: string;                    // userId (primary)
  id: string;                     // Alias for sub (for backward compatibility)
  phone: string;                  // user's phone number
  organizationId: string; // null for SUPER_ADMIN
  platformRole?: 'SUPER_ADMIN';   // only for platform admins
  systemRole: 'ADMIN' | 'USER';   // organization system role
}

/**
 * Decorator to extract current authenticated user from request
 *
 * Usage:
 * @Get('/profile')
 * getProfile(@CurrentUser() user: CurrentUser) {
 *   // Use user.id or user.sub (both point to userId)
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Add 'id' as alias for 'sub' for backward compatibility
    if (user && user.sub && !user.id) {
      user.id = user.sub;
    }

    return user;
  },
);
