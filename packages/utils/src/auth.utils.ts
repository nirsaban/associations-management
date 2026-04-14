import { SystemRole, GroupRole } from "@amutot/types";

/**
 * Check if user has admin system role
 */
export function isAdmin(systemRole: SystemRole | undefined): boolean {
  return systemRole === SystemRole.ADMIN;
}

/**
 * Check if user is a group manager
 */
export function isGroupManager(groupRole: GroupRole | undefined): boolean {
  return groupRole === GroupRole.MANAGER;
}

/**
 * Check if user is a weekly distributor
 * (For now, assuming distributors are group managers)
 */
export function isWeeklyDistributor(
  groupRole: GroupRole | undefined,
  hasDistributorFlag?: boolean
): boolean {
  if (hasDistributorFlag) {
    return true;
  }
  return groupRole === GroupRole.MANAGER;
}

/**
 * Check if a user can access a specific group
 */
export function canAccessGroup(
  userSystemRole: SystemRole | undefined,
  userGroupId: string | undefined,
  targetGroupId: string
): boolean {
  // Admins can access any group
  if (isAdmin(userSystemRole)) {
    return true;
  }

  // Non-admins can only access their own group
  return userGroupId === targetGroupId;
}

/**
 * Check if a user can manage a specific group
 */
export function canManageGroup(
  userSystemRole: SystemRole | undefined,
  userGroupId: string | undefined,
  userGroupRole: GroupRole | undefined,
  targetGroupId: string
): boolean {
  // Admins can manage any group
  if (isAdmin(userSystemRole)) {
    return true;
  }

  // Managers can manage their own group
  return (
    userGroupId === targetGroupId && isGroupManager(userGroupRole)
  );
}

/**
 * Check if a user can create resources in a group
 */
export function canCreateInGroup(
  userSystemRole: SystemRole | undefined,
  userGroupId: string | undefined,
  userGroupRole: GroupRole | undefined,
  targetGroupId: string
): boolean {
  // Admins can create in any group
  if (isAdmin(userSystemRole)) {
    return true;
  }

  // Group members can create in their own group
  if (userGroupId === targetGroupId) {
    return true;
  }

  return false;
}

/**
 * Check if a user can edit/update a resource
 */
export function canEditResource(
  userSystemRole: SystemRole | undefined,
  userGroupId: string | undefined,
  userGroupRole: GroupRole | undefined,
  resourceGroupId: string,
  resourceOwnerId?: string
): boolean {
  // Admins can edit any resource
  if (isAdmin(userSystemRole)) {
    return true;
  }

  // Group managers can edit resources in their group
  if (
    userGroupId === resourceGroupId &&
    isGroupManager(userGroupRole)
  ) {
    return true;
  }

  // Resource owners can edit their own resources
  if (resourceOwnerId === userSystemRole) {
    return true;
  }

  return false;
}
