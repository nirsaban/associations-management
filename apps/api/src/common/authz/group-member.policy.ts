import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * Group Member Policy
 *
 * Business rule: User must be a member of the target group to access group-specific data.
 */
@Injectable()
export class GroupMemberPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async enforce(currentUser: CurrentUser, targetGroupId: string): Promise<void> {
    // SUPER_ADMIN should not access organization data
    if (currentUser.platformRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Platform administrators cannot access organization groups');
    }

    // Organization ADMIN can access any group in their organization
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

    // Regular USER must be a member of the group
    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        groupId: targetGroupId,
        userId: currentUser.sub,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Verify same organization via the group
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
  }

  async check(currentUser: CurrentUser, targetGroupId: string): Promise<boolean> {
    try {
      await this.enforce(currentUser, targetGroupId);
      return true;
    } catch {
      return false;
    }
  }

  async getMemberGroupIds(currentUser: CurrentUser): Promise<string[]> {
    if (currentUser.platformRole === 'SUPER_ADMIN' || !currentUser.organizationId) {
      return [];
    }

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        userId: currentUser.sub,
        organizationId: currentUser.organizationId,
      },
      select: { groupId: true },
    });

    return memberships.map((m) => m.groupId);
  }
}
