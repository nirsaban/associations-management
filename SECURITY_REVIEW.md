# Security Review - Auth & Authorization System

## Completed by Auth/Security Agent

Date: 2026-04-14

## Summary

The auth and authorization system has been implemented and reviewed. The following components are complete and ready for use:

### ✅ Completed Components

1. **JWT Strategy** - Updated to match CLAUDE.md specifications
2. **Guards** - All required guards implemented:
   - JwtAuthGuard (with @Public() support)
   - SuperAdminGuard
   - OrgRoleGuard (new)
   - OrganizationScopeGuard (new)
   - RolesGuard
3. **Authorization Policies** - All business-level policies:
   - SelfOrAdminPolicy
   - GroupManagerPolicy
   - GroupMemberPolicy
   - WeeklyDistributorPolicy
4. **Decorators** - All required decorators:
   - @CurrentUser()
   - @OrganizationId()
   - @Roles()
   - @SuperAdminOnly()
   - @Public()

### ⚠️ Issues Found - Requires Backend Lead Action

The following TypeScript errors need to be fixed by the Backend Lead:

#### Issue 1: OrganizationId Type Assertions

**Problem:** Controllers are using `user.organizationId` which is typed as `string | null | undefined`, but services expect `string`.

**Why it happens:** The CurrentUser interface correctly reflects that organizationId is optional (null for SUPER_ADMIN), but organization-scoped routes have OrganizationScopeGuard which guarantees it's present.

**Solution Options:**

**Option A: Use @OrganizationId() decorator (Recommended)**

```typescript
// BEFORE (causes TypeScript error)
@Get('stats')
async getDashboardStats(@CurrentUser() user: CurrentUser) {
  return this.adminService.getDashboardStats(user.organizationId); // Error!
}

// AFTER (correct)
@Get('stats')
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
async getDashboardStats(@OrganizationId() orgId: string) {
  return this.adminService.getDashboardStats(orgId); // ✓
}
```

**Option B: Use requireOrganizationId() helper**

```typescript
import { requireOrganizationId } from '@common/decorators/require-organization.decorator';

@Get('stats')
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
async getDashboardStats(@CurrentUser() user: CurrentUser) {
  const orgId = requireOrganizationId(user); // Typed as string
  return this.adminService.getDashboardStats(orgId); // ✓
}
```

**Option C: Type assertion (least preferred)**

```typescript
@Get('stats')
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
async getDashboardStats(@CurrentUser() user: CurrentUser) {
  // Safe because OrganizationScopeGuard guarantees organizationId exists
  return this.adminService.getDashboardStats(user.organizationId!); // ✓
}
```

#### Files that need fixing:

- `src/modules/admin/admin.controller.ts` - 5 occurrences
- `src/modules/csv-import/csv-import.controller.ts` - 3 occurrences
- `src/modules/dashboard/dashboard.controller.ts` - 1 occurrence
- `src/modules/families/families.controller.ts` - 7 occurrences
- `src/modules/groups/groups.controller.ts` - 10 occurrences
- `src/modules/notifications/notifications.controller.ts` - 2 occurrences
- `src/modules/payments/payments.controller.ts` - 3 occurrences
- `src/modules/users/users.controller.ts` - 5 occurrences
- `src/modules/weekly-distributors/weekly-distributors.controller.ts` - 4 occurrences
- `src/modules/weekly-orders/weekly-orders.controller.ts` - 6 occurrences

#### Issue 2: DTO Class Properties Without Initializers

**Problem:** DTOs have properties without initializers.

**Solution:** Add default values or use `declare` keyword:

```typescript
// BEFORE
export class AdminStatsDto {
  @ApiProperty()
  totalUsers: number;
}

// AFTER (Option 1: default value)
export class AdminStatsDto {
  @ApiProperty()
  totalUsers: number = 0;
}

// AFTER (Option 2: declare)
export class AdminStatsDto {
  @ApiProperty()
  declare totalUsers: number;
}
```

#### Files that need fixing:

- `src/modules/admin/dto/admin-stats.dto.ts`
- `src/modules/admin/dto/group-weekly-status.dto.ts`
- `src/modules/admin/dto/revenue-by-month.dto.ts`
- `src/modules/admin/dto/unpaid-user.dto.ts`
- `src/modules/homepage/dto/homepage-context.dto.ts`

#### Issue 3: user.id vs user.sub

**Problem:** Some controllers use `user.id` which is now an alias for `user.sub`.

**Status:** FIXED - The CurrentUser decorator now provides both `id` and `sub` for backward compatibility.

**Recommendation:** Gradually migrate to using `user.sub` for consistency with JWT standard.

---

## Security Checklist for Backend Lead

When creating new endpoints, ensure:

### Route Protection

- [ ] **JwtAuthGuard** is applied to all non-public routes
- [ ] **Public routes** use `@Public()` decorator (login, health check)
- [ ] **Platform routes** use `@UseGuards(JwtAuthGuard, SuperAdminGuard)` and `@SuperAdminOnly()`
- [ ] **Organization routes** use `@UseGuards(JwtAuthGuard, OrganizationScopeGuard)`
- [ ] **Admin-only routes** additionally use `OrgRoleGuard` with `@Roles('ADMIN')`

### Data Scoping

- [ ] **organizationId** comes from JWT (`@OrganizationId()` or `user.organizationId`), **NEVER** from request body/params
- [ ] All Prisma queries include `organizationId` filter (except SUPER_ADMIN platform routes)
- [ ] All Prisma queries include `deletedAt: null` filter (soft delete)
- [ ] No cross-tenant data leakage possible
- [ ] SUPER_ADMIN cannot access organization routes
- [ ] Organization users cannot access platform routes

### Role-Based Access

- [ ] **ADMIN** can only access their own organization
- [ ] **USER** can only see their own data
- [ ] **GROUP_MANAGER** can only manage their assigned group(s)
- [ ] **WEEKLY_DISTRIBUTOR** can only see delivery data for their assigned week

### Payment Privacy

- [ ] **Group Managers** can see paid/unpaid status but **NEVER** payment amounts
- [ ] Payment amounts are only visible to:
  - The user themselves
  - Organization ADMIN
  - SUPER_ADMIN (platform routes only)

### Business Logic Authorization

For operations beyond simple CRUD, inject and use authorization policies:

```typescript
import { GroupManagerPolicy } from '@common/authz';

@Injectable()
export class WeeklyOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupManagerPolicy: GroupManagerPolicy,
  ) {}

  async createOrder(user: CurrentUser, groupId: string, data: CreateOrderDto) {
    // Enforce business rule: user must be manager of this group
    await this.groupManagerPolicy.enforce(user, groupId);

    // Proceed with creation...
  }
}
```

---

## Guard Usage Patterns

### Pattern 1: Public Route

```typescript
@Public()
@Post('auth/login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### Pattern 2: Platform Route (SUPER_ADMIN only)

```typescript
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@SuperAdminOnly()
@Get('platform/organizations')
async getAllOrganizations() {
  return this.platformService.getAllOrganizations();
}
```

### Pattern 3: Organization Route (Any org user)

```typescript
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
@Get('profile')
async getProfile(@CurrentUser() user: CurrentUser) {
  return this.usersService.findOne(user.id);
}
```

### Pattern 4: Organization Admin Only

```typescript
@UseGuards(JwtAuthGuard, OrganizationScopeGuard, OrgRoleGuard)
@Roles('ADMIN')
@Get('users')
async getAllUsers(@OrganizationId() orgId: string) {
  return this.usersService.findAll(orgId);
}
```

### Pattern 5: Admin or Manager

```typescript
@UseGuards(JwtAuthGuard, OrganizationScopeGuard, OrgRoleGuard)
@Roles('ADMIN', 'USER') // Both can access, service enforces business rules
@Get('groups/:groupId/members')
async getGroupMembers(
  @CurrentUser() user: CurrentUser,
  @Param('groupId') groupId: string,
) {
  // In service, use GroupManagerPolicy to check if USER is the manager
  return this.groupsService.getMembers(user, groupId);
}
```

---

## Critical Security Rules (from CLAUDE.md)

### 1. Tenant Isolation

**Every query MUST include organizationId from JWT:**

```typescript
// CORRECT ✓
const users = await this.prisma.user.findMany({
  where: {
    organizationId: user.organizationId, // From JWT
    deletedAt: null,
  },
});

// WRONG ✗
const users = await this.prisma.user.findMany({
  where: {
    organizationId: dto.organizationId, // From request - SECURITY ISSUE!
    deletedAt: null,
  },
});
```

### 2. SUPER_ADMIN Isolation

**SUPER_ADMIN has NO organizationId:**

```typescript
// JWT payload for SUPER_ADMIN
{
  sub: "user123",
  phone: "+972501234567",
  organizationId: null,  // ← NO organizationId
  systemRole: "SUPER_ADMIN"
}

// JWT payload for organization ADMIN
{
  sub: "user456",
  phone: "+972507654321",
  organizationId: "org-abc-123",  // ← Has organizationId
  systemRole: "ADMIN"
}
```

### 3. Payment Amount Privacy

**Group managers can NEVER see payment amounts:**

```typescript
// CORRECT ✓
const payments = await this.prisma.payment.findMany({
  where: { groupId, organizationId },
  select: {
    userId: true,
    monthKey: true,
    status: true, // paid/unpaid only
    paidAt: true,
    // DO NOT include 'amount'
  },
});

// WRONG ✗
const payments = await this.prisma.payment.findMany({
  where: { groupId, organizationId },
  // Returns all fields including 'amount'
});
```

### 4. Soft Delete Filtering

**Always filter soft-deleted records:**

```typescript
// CORRECT ✓
where: {
  organizationId,
  deletedAt: null,
}

// WRONG ✗
where: {
  organizationId,
  // Missing deletedAt filter - could return deleted records!
}
```

---

## Testing Authorization

Example test patterns:

```typescript
describe('Authorization', () => {
  describe('SelfOrAdminPolicy', () => {
    it('should allow user to access own data', () => {
      const user = { sub: 'user1', systemRole: 'USER', organizationId: 'org1' };
      expect(() => policy.enforce(user, 'user1', 'org1')).not.toThrow();
    });

    it('should allow admin to access any user in same org', () => {
      const admin = { sub: 'admin1', systemRole: 'ADMIN', organizationId: 'org1' };
      expect(() => policy.enforce(admin, 'user2', 'org1')).not.toThrow();
    });

    it('should prevent admin from accessing different org', () => {
      const admin = { sub: 'admin1', systemRole: 'ADMIN', organizationId: 'org1' };
      expect(() => policy.enforce(admin, 'user2', 'org2')).toThrow();
    });

    it('should prevent user from accessing other users', () => {
      const user = { sub: 'user1', systemRole: 'USER', organizationId: 'org1' };
      expect(() => policy.enforce(user, 'user2', 'org1')).toThrow();
    });
  });
});
```

---

## Resources

- **CLAUDE.md** - Full project specifications
- **apps/api/src/common/guards/** - Route-level guards
- **apps/api/src/common/authz/** - Business-level policies
- **apps/api/src/common/authz/README.md** - Detailed authorization documentation
- **apps/api/src/common/decorators/** - Request decorators

---

## Action Items for Backend Lead

1. **Fix TypeScript Errors:**
   - [ ] Update all controllers to use `@OrganizationId()` decorator or `requireOrganizationId()` helper
   - [ ] Add initializers to DTO properties or use `declare` keyword

2. **Apply Guards to Existing Routes:**
   - [ ] Review all controllers and ensure proper guards are applied
   - [ ] Add `@Public()` to public routes
   - [ ] Add `OrganizationScopeGuard` to all organization routes
   - [ ] Add `SuperAdminGuard` to all platform routes

3. **Review Data Queries:**
   - [ ] Audit all Prisma queries to ensure organizationId filtering
   - [ ] Audit all Prisma queries to ensure soft delete filtering
   - [ ] Verify no cross-tenant data leakage

4. **Implement Policy Checks:**
   - [ ] Add policy checks for manager/member operations
   - [ ] Add policy checks for weekly distributor operations
   - [ ] Ensure payment amounts are never exposed to managers

5. **Add Tests:**
   - [ ] Add authorization tests for each policy
   - [ ] Add integration tests for tenant isolation
   - [ ] Add tests for role-based access control

---

## Contact

For questions about auth/authorization:
- Review: `apps/api/src/common/authz/README.md`
- Review: This file (SECURITY_REVIEW.md)
- Review: CLAUDE.md sections 4-6, 21

Auth/Security Agent: ✅ Complete
