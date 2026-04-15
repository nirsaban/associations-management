import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * Weekly Distributor Policy
 *
 * Business rule: User must be assigned as weekly distributor for specific week/group.
 *
 * Per CLAUDE.md:
 * - WEEKLY_DISTRIBUTOR is temporary per week and group (NOT a permanent role)
 * - Distributor can see only delivery data for their assigned week
 * - weekKey format: "2026-W16"
 */
@Injectable()
export class WeeklyDistributorPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async enforce(currentUser: CurrentUser, targetGroupId: string, weekKey: string): Promise<void> {
    // SUPER_ADMIN should not access organization data
    if (currentUser.platformRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Platform administrators cannot access distribution data');
    }

    // Organization ADMIN can access any distribution data in their organization
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

    // Regular USER must be assigned as weekly distributor
    const assignment = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        groupId: targetGroupId,
        assignedUserId: currentUser.sub,
        weekKey,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned as distributor for this week');
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
      throw new ForbiddenException('Cannot access distribution data from different organizations');
    }
  }

  async check(currentUser: CurrentUser, targetGroupId: string, weekKey: string): Promise<boolean> {
    try {
      await this.enforce(currentUser, targetGroupId, weekKey);
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentAssignment(
    currentUser: CurrentUser,
    currentWeekKey: string,
  ): Promise<{ groupId: string; weekKey: string } | null> {
    if (currentUser.platformRole === 'SUPER_ADMIN' || currentUser.systemRole === 'ADMIN') {
      return null;
    }

    if (!currentUser.organizationId) {
      return null;
    }

    const assignment = await this.prisma.weeklyDistributorAssignment.findFirst({
      where: {
        assignedUserId: currentUser.sub,
        organizationId: currentUser.organizationId,
        weekKey: currentWeekKey,
      },
      select: {
        groupId: true,
        weekKey: true,
      },
    });

    return assignment || null;
  }

  async hasActiveAssignment(currentUser: CurrentUser): Promise<boolean> {
    if (currentUser.platformRole === 'SUPER_ADMIN' || currentUser.systemRole === 'ADMIN') {
      return false;
    }

    if (!currentUser.organizationId) {
      return false;
    }

    const count = await this.prisma.weeklyDistributorAssignment.count({
      where: {
        assignedUserId: currentUser.sub,
        organizationId: currentUser.organizationId,
      },
    });

    return count > 0;
  }
}
