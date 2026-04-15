import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * Group Manager Policy
 *
 * Business rule: User must be the manager of the target group to perform manager actions.
 */
@Injectable()
export class GroupManagerPolicy {
  constructor(private readonly prisma: PrismaService) {}

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

    // Regular USER must be the group manager
    const group = await this.prisma.group.findUnique({
      where: { id: targetGroupId },
      select: {
        id: true,
        managerUserId: true,
        organizationId: true,
        deletedAt: true,
      },
    });

    if (!group || group.deletedAt) {
      throw new ForbiddenException('Group not found');
    }

    if (group.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException('Cannot access groups from different organizations');
    }

    if (group.managerUserId !== currentUser.sub) {
      throw new ForbiddenException('You are not the manager of this group');
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
        managerUserId: currentUser.sub,
        organizationId: currentUser.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return group?.id || null;
  }
}
