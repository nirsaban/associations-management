import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '@modules/auth/auth.service';

/**
 * JWT Authentication Guard
 *
 * Validates JWT token on every protected route.
 * Respects @Public() decorator to allow public routes.
 * Checks token revocation list for logged-out tokens.
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
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const result = await (super.canActivate(context) as Promise<boolean>);
    if (!result) return false;

    // Check token revocation
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token && this.authService.isTokenRevoked(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return true;
  }
}
