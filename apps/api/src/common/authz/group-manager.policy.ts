import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * Group Manager Policy
 *
 * Business rule: User must be a manager of the target group to perform manager actions.
 * A user is "a manager of group G" when ANY of:
 *  - Group.managerUserId === user.sub  (the denormalized primary pointer)
 *  - GroupMembership exists for (G, user) with role=MANAGER + status=ACTIVE
 * A group may have up to 2 active managers.
 */
@Injectable()
export class GroupManagerPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /** WHERE predicate: "groups managed by this user" — primary OR membership manager. */
  static managedGroupWhere(userSub: string): Prisma.GroupWhereInput {
    return {
      OR: [
        { managerUserId: userSub },
        { memberships: { some: { userId: userSub, role: 'MANAGER', status: 'ACTIVE' } } },
      ],
    };
  }

  async enforce(currentUser: CurrentUser, targetGroupId: string): Promise<void> {
    // SUPER_ADMIN should not access organization data
    if (currentUser.platformRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Platform administrators cannot manage organization groups');
    }

    // Organization ADMIN can manage any group in their organization
    if (currentUser.systemRole === 'ADMIN') {
      const group = await this.prisma.group.findUnique({
        where: { id: targetGroupId },
        select: { organizationId: true, deletedAt: true },
      });

      if (!group || group.deletedAt) {
        throw new ForbiddenException('Group not found');
      }

      if (group.organizationId !== currentUser.organizationId) {
        throw new ForbiddenException('Cannot access groups from different organizations');
      }

      return;
    }

    // Regular USER must be a manager of the group (primary or via membership)
    const group = await this.prisma.group.findFirst({
      where: {
        id: targetGroupId,
        ...GroupManagerPolicy.managedGroupWhere(currentUser.sub),
      },
      select: {
        id: true,
        organizationId: true,
        deletedAt: true,
      },
    });

    if (!group || group.deletedAt) {
      throw new ForbiddenException('You are not the manager of this group');
    }

    if (group.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException('Cannot access groups from different organizations');
    }
  }

  async check(currentUser: CurrentUser, targetGroupId: string): Promise<boolean> {
    try {
      await this.enforce(currentUser, targetGroupId);
      return true;
    } catch {
      return false;
    }
  }

  async getManagedGroupId(currentUser: CurrentUser): Promise<string | null> {
    if (currentUser.platformRole === 'SUPER_ADMIN' || currentUser.systemRole === 'ADMIN') {
      return null;
    }

    if (!currentUser.organizationId) {
      return null;
    }

    const group = await this.prisma.group.findFirst({
      where: {
        organizationId: currentUser.organizationId,
        deletedAt: null,
        ...GroupManagerPolicy.managedGroupWhere(currentUser.sub),
      },
      select: { id: true },
    });

    return group?.id || null;
  }
}
