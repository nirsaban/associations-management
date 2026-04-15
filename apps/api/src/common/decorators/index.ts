/**
 * Common Decorators
 *
 * Decorators for authentication, authorization, and request context.
 *
 * Available decorators:
 * - @CurrentUser() - extracts authenticated user from JWT
 * - @OrganizationId() - extracts organizationId from JWT
 * - @Roles(...roles) - declares required systemRole
 * - @SuperAdminOnly() - marks route as SUPER_ADMIN only
 * - @Public() - marks route as public (no JWT needed)
 */

export * from './current-user.decorator';
export * from './organization.decorator';
export * from './roles.decorator';
export * from './super-admin-only.decorator';
export * from './public.decorator';
