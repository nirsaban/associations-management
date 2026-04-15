import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfOrAdminPolicy } from './self-or-admin.policy';
import { GroupManagerPolicy } from './group-manager.policy';
import { GroupMemberPolicy } from './group-member.policy';
import { WeeklyDistributorPolicy } from './weekly-distributor.policy';

/**
 * Authorization Policies Module
 *
 * Provides business-level authorization policies for the Amutot platform.
 * Import this module in any module that needs authorization policy checks.
 *
 * Usage:
 * @Module({
 *   imports: [AuthzModule],
 *   ...
 * })
 * export class SomeModule {}
 */
@Module({
  imports: [PrismaModule],
  providers: [
    SelfOrAdminPolicy,
    GroupManagerPolicy,
    GroupMemberPolicy,
    WeeklyDistributorPolicy,
  ],
  exports: [
    SelfOrAdminPolicy,
    GroupManagerPolicy,
    GroupMemberPolicy,
    WeeklyDistributorPolicy,
  ],
})
export class AuthzModule {}
