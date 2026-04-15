import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public route decorator
 *
 * Marks a route as public (no JWT authentication required).
 * Used for login, OTP verification, and other public endpoints.
 *
 * Usage:
 * @Public()
 * @Post('/auth/login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
