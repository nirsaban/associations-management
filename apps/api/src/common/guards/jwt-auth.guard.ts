import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * Validates JWT token on every protected route.
 * Respects @Public() decorator to allow public routes.
 *
 * Per CLAUDE.md:
 * - JwtAuthGuard present on every non-public route
 * - Public routes: login, OTP verification, health checks
 *
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('/profile')
 * async getProfile(@CurrentUser() user: CurrentUser) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
