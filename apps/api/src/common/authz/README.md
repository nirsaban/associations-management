# Authorization System

This directory contains business-level authorization policies for the Amutot multi-tenant platform.

## Overview

The authorization system enforces the critical security rules defined in CLAUDE.md:

1. **Tenant Isolation** - No cross-organization data leakage
2. **Role-Based Access** - SUPER_ADMIN, ADMIN, USER with proper scoping
3. **Contextual Permissions** - Group managers, members, weekly distributors
4. **Data Privacy** - Payment amounts never exposed to group managers

## Architecture

### Guards (Route-Level)

Guards are applied at the route level and run before the controller:

- **JwtAuthGuard** - Validates JWT token on every protected route
- **SuperAdminGuard** - Requires SUPER_ADMIN systemRole (platform routes only)
- **OrgRoleGuard** - Requires specific systemRole (ADMIN/USER) within organization
- **OrganizationScopeGuard** - Ensures request is scoped to user's organizationId

### Policies (Business-Level)

Policies are injected into services and enforce business logic:

- **SelfOrAdminPolicy** - User can access own data, Admin can access any in org
- **GroupManagerPolicy** - User must be manager of the target group
- **GroupMemberPolicy** - User must be member of the target group
- **WeeklyDistributorPolicy** - User must be assigned distributor for the week/group

## Usage Examples

### Example 1: Protecting a Route with Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, OrganizationScopeGuard, OrgRoleGuard } from '@common/guards';
import { Roles, CurrentUser, OrganizationId } from '@common/decorators';

@Controller('users')
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
export class UsersController {
  // Only organization ADMIN can access
  @Get()
  @UseGuards(OrgRoleGuard)
  @Roles('ADMIN')
  async findAll(@OrganizationId() orgId: string) {
    return this.usersService.findAll(orgId);
  }

  // Both ADMIN and USER can access (own data)
  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUser) {
    return this.usersService.findOne(user.sub);
  }
}
```

### Example 2: Platform Routes (SUPER_ADMIN only)

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, SuperAdminGuard } from '@common/guards';
import { SuperAdminOnly } from '@common/decorators';

@Controller('platform/organizations')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class PlatformOrganizationsController {
  @Get()
  @SuperAdminOnly()
  async findAll() {
    return this.platformService.getAllOrganizations();
  }
}
```

### Example 3: Using Policies in Services

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { SelfOrAdminPolicy } from '@common/authz';
import { CurrentUser } from '@common/decorators';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selfOrAdminPolicy: SelfOrAdminPolicy,
  ) {}

  async getUser(currentUser: CurrentUser, targetUserId: string) {
    // Find the target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    // Enforce policy: user can access own data, admin can access any in org
    this.selfOrAdminPolicy.enforce(
      currentUser,
      targetUserId,
      targetUser.organizationId,
    );

    return targetUser;
  }
}
```

### Example 4: Group Manager Operations

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { GroupManagerPolicy } from '@common/authz';
import { CurrentUser } from '@common/decorators';

@Injectable()
export class WeeklyOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupManagerPolicy: GroupManagerPolicy,
  ) {}

  async createWeeklyOrder(
    currentUser: CurrentUser,
    groupId: string,
    familyId: string,
    data: CreateWeeklyOrderDto,
  ) {
    // Enforce: user must be manager of this group
    await this.groupManagerPolicy.enforce(currentUser, groupId);

    // Verify family belongs to this group
    const groupFamily = await this.prisma.groupFamily.findFirst({
      where: { groupId, familyId, deletedAt: null },
    });

    if (!groupFamily) {
      throw new ForbiddenException('Family not in this group');
    }

    // Create the weekly order
    return this.prisma.weeklyOrder.create({
      data: {
        organizationId: currentUser.organizationId, // From JWT, never from request
        groupId,
        familyId,
        ...data,
      },
    });
  }
}
```

### Example 5: Weekly Distributor Access

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { WeeklyDistributorPolicy } from '@common/authz';
import { CurrentUser } from '@common/decorators';

@Injectable()
export class DistributionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly weeklyDistributorPolicy: WeeklyDistributorPolicy,
  ) {}

  async getDeliveryData(
    currentUser: CurrentUser,
    groupId: string,
    weekStart: Date,
  ) {
    // Enforce: user must be assigned as distributor for this week
    await this.weeklyDistributorPolicy.enforce(currentUser, groupId, weekStart);

    // Return delivery-relevant data only (no payment amounts)
    return this.prisma.weeklyOrder.findMany({
      where: {
        groupId,
        weekStart,
        organizationId: currentUser.organizationId,
        deletedAt: null,
      },
      include: {
        family: {
          select: {
            familyName: true,
            address: true,
            contactPhone: true,
            notes: true,
          },
        },
      },
    });
  }
}
```

## Critical Security Rules

### 1. Tenant Isolation

**ALWAYS** scope queries by `organizationId` from JWT:

```typescript
// CORRECT ✓
const users = await this.prisma.user.findMany({
  where: {
    organizationId: currentUser.organizationId, // From JWT
    deletedAt: null,
  },
});

// WRONG ✗ - organizationId from request body/params
const users = await this.prisma.user.findMany({
  where: {
    organizationId: dto.organizationId, // SECURITY ISSUE!
    deletedAt: null,
  },
});
```

### 2. SUPER_ADMIN Access

SUPER_ADMIN should **NEVER** access organization routes:

```typescript
// Platform routes only
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@SuperAdminOnly()
async platformRoute() { ... }

// Organization routes should reject SUPER_ADMIN
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
async orgRoute() { ... } // OrganizationScopeGuard rejects SUPER_ADMIN
```

### 3. Payment Privacy

Group managers can see **paid/unpaid status** but **NEVER amounts**:

```typescript
// CORRECT ✓
const payments = await this.prisma.payment.findMany({
  where: { userId, organizationId },
  select: {
    userId: true,
    monthKey: true,
    status: true, // paid/unpaid
    paidAt: true,
    // DO NOT include 'amount' field
  },
});

// WRONG ✗
const payments = await this.prisma.payment.findMany({
  where: { userId, organizationId },
  // Returning all fields including 'amount'
});
```

### 4. Soft Delete Filtering

**ALWAYS** filter soft-deleted records:

```typescript
// CORRECT ✓
const groups = await this.prisma.group.findMany({
  where: {
    organizationId,
    deletedAt: null, // Filter soft-deleted
  },
});

// WRONG ✗
const groups = await this.prisma.group.findMany({
  where: { organizationId },
  // Missing deletedAt filter
});
```

## Module Setup

Import `AuthzModule` in your module:

```typescript
import { Module } from '@nestjs/common';
import { AuthzModule } from '@common/authz/authz.module';
import { UsersService } from './users.service';

@Module({
  imports: [AuthzModule],
  providers: [UsersService],
})
export class UsersModule {}
```

## Testing Authorization

Example test cases:

```typescript
describe('SelfOrAdminPolicy', () => {
  it('should allow user to access own data', () => {
    const currentUser = { sub: 'user1', systemRole: 'USER', organizationId: 'org1' };
    expect(() => {
      policy.enforce(currentUser, 'user1', 'org1');
    }).not.toThrow();
  });

  it('should allow ADMIN to access any user in same org', () => {
    const currentUser = { sub: 'admin1', systemRole: 'ADMIN', organizationId: 'org1' };
    expect(() => {
      policy.enforce(currentUser, 'user2', 'org1');
    }).not.toThrow();
  });

  it('should prevent ADMIN from accessing user in different org', () => {
    const currentUser = { sub: 'admin1', systemRole: 'ADMIN', organizationId: 'org1' };
    expect(() => {
      policy.enforce(currentUser, 'user2', 'org2');
    }).toThrow(ForbiddenException);
  });

  it('should prevent USER from accessing other users', () => {
    const currentUser = { sub: 'user1', systemRole: 'USER', organizationId: 'org1' };
    expect(() => {
      policy.enforce(currentUser, 'user2', 'org1');
    }).toThrow(ForbiddenException);
  });
});
```

## Common Patterns

### Pattern 1: Admin Override

Admin can always access data in their organization:

```typescript
if (currentUser.systemRole === 'ADMIN') {
  // Verify same organization
  if (targetResource.organizationId !== currentUser.organizationId) {
    throw new ForbiddenException('Cannot access different organization');
  }
  return; // Allow access
}
```

### Pattern 2: Self-Access Check

User can always access their own data:

```typescript
if (currentUser.sub === targetUserId) {
  return; // Allow access to own data
}
```

### Pattern 3: Contextual Role Check

Check if user has contextual role (manager, member, distributor):

```typescript
const membership = await this.prisma.groupMembership.findFirst({
  where: {
    groupId: targetGroupId,
    userId: currentUser.sub,
    organizationId: currentUser.organizationId,
    deletedAt: null,
  },
});

if (!membership) {
  throw new ForbiddenException('Not a member of this group');
}
```

## Resources

- CLAUDE.md - Full project specifications
- apps/api/src/common/guards/ - Route-level guards
- apps/api/src/common/decorators/ - Request decorators
- prisma/schema.prisma - Database schema with roles and relationships
