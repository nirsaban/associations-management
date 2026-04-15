/**
 * Authorization Policies
 *
 * Business-level authorization policies for the Amutot multi-tenant platform.
 *
 * Per CLAUDE.md, authorization must consider:
 * - platformRole (SUPER_ADMIN)
 * - systemRole (ADMIN, USER)
 * - organizationId (tenant isolation)
 * - self ownership
 * - group membership
 * - group manager context
 * - weekly distributor assignment
 * - payment state
 * - business rules
 */

export * from './self-or-admin.policy';
export * from './group-manager.policy';
export * from './group-member.policy';
export * from './weekly-distributor.policy';
