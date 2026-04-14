import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark endpoints as SUPER_ADMIN only
 *
 * Must be used with SuperAdminGuard:
 * @UseGuards(JwtAuthGuard, SuperAdminGuard)
 * @SuperAdminOnly()
 * async platformOnlyEndpoint() { ... }
 */
export const SuperAdminOnly = () => SetMetadata('superAdminOnly', true);
