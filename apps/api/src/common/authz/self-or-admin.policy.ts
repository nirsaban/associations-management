import { Injectable, ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * Self or Admin Policy
 *
 * Business rule: User can access their own data, Admin can access any user data in their organization.
 *
 * Per CLAUDE.md:
 * - USER can access own data only
 * - ADMIN can access any data within their organization
 * - Must check organizationId to prevent cross-tenant access
 *
 * Usage in service:
 *
 * constructor(private selfOrAdminPolicy: SelfOrAdminPolicy) {}
 *
 * async getUser(currentUser: CurrentUser, targetUserId: string) {
 *   const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
 *   this.selfOrAdminPolicy.enforce(currentUser, targetUser);
 *   return targetUser;
 * }
 */
@Injectable()
export class SelfOrAdminPolicy {
  /**
   * Check if user can access target user's data
   *
   * @param currentUser - The authenticated user making the request
   * @param targetUserId - The ID of the user being accessed
   * @param targetOrganizationId - The organizationId of the target user (for tenant isolation)
   * @throws ForbiddenException if access is denied
   */
  enforce(
    currentUser: CurrentUser,
    targetUserId: string,
    targetOrganizationId?: string | null,
  ): void {
    // SUPER_ADMIN should not access organization data
    if (currentUser.platformRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Platform administrators cannot access organization user data');
    }

    // If accessing own data, allow
    if (currentUser.sub === targetUserId) {
      return;
    }

    // If ADMIN, check same organization
    if (currentUser.systemRole === 'ADMIN') {
      // Ensure both users are in the same organization (tenant isolation)
      if (currentUser.organizationId !== targetOrganizationId) {
        throw new ForbiddenException('Cannot access users from different organizations');
      }
      return;
    }

    // Regular USER can only access own data
    throw new ForbiddenException('You can only access your own data');
  }

  /**
   * Check if user can access target user's data (returns boolean instead of throwing)
   *
   * @param currentUser - The authenticated user making the request
   * @param targetUserId - The ID of the user being accessed
   * @param targetOrganizationId - The organizationId of the target user
   * @returns true if access is allowed, false otherwise
   */
  check(
    currentUser: CurrentUser,
    targetUserId: string,
    targetOrganizationId?: string | null,
  ): boolean {
    try {
      this.enforce(currentUser, targetUserId, targetOrganizationId);
      return true;
    } catch {
      return false;
    }
  }
}
