/**
 * Authorization Guards
 *
 * Route-level guards for the Amutot multi-tenant platform.
 *
 * Guard hierarchy:
 * 1. JwtAuthGuard - validates JWT token on every protected route
 * 2. SuperAdminGuard - requires SUPER_ADMIN platformRole (platform routes only)
 * 3. OrgRoleGuard - requires specific systemRole (ADMIN/USER) within organization
 * 4. OrganizationScopeGuard - ensures request is scoped to user's organizationId
 *
 * Per CLAUDE.md:
 * - SUPER_ADMIN has NO organizationId, only accesses platform routes
 * - ADMIN can only access their own organization
 * - USER can only see own data
 * - All queries MUST be scoped by organizationId (except SUPER_ADMIN platform routes)
 */

export * from './jwt-auth.guard';
export * from './super-admin.guard';
export * from './org-role.guard';
export * from './organization-scope.guard';
export * from './roles.guard';
