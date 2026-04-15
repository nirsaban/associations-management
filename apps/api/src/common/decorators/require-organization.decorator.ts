import { BadRequestException } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

/**
 * Helper to assert organizationId is present
 *
 * Use this in controllers/services after guards have validated organizationId exists.
 * This is safe to use when OrganizationScopeGuard is applied.
 *
 * Usage:
 * async someMethod(@CurrentUser() user: CurrentUser) {
 *   const orgId = requireOrganizationId(user);
 *   // orgId is now typed as string (not string | null | undefined)
 * }
 */
export function requireOrganizationId(user: CurrentUser): string {
  if (!user.organizationId) {
    throw new BadRequestException(
      'Organization context required. Ensure OrganizationScopeGuard is applied to this route.',
    );
  }
  return user.organizationId;
}
