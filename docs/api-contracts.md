# API Contracts - Backend Implementation

This document describes the API contracts for the newly implemented backend modules.

---

## Auth Module

### Auth — POST /auth/start-login
Method: POST
Path: /api/v1/auth/start-login
Auth: Public
Request: `{ phone: string }`
Response: `{ data: { message: string, otpSent: boolean, sessionId: string, requiresOrgSelection: boolean, organizations?: [...] } }`
Errors: 400 (user not found), 400 (invalid phone format)

### Auth — POST /auth/verify-otp
Method: POST
Path: /api/v1/auth/verify-otp
Auth: Public
Request: `{ phone: string, otp: string, sessionId: string, organizationId?: string }`
Response: `{ accessToken, refreshToken, tokenType, expiresIn, user: { id, phone, name, systemRole, organizationId, createdAt } }`
Errors: 400 (invalid OTP format), 401 (invalid/expired OTP), 401 (invalid session)

### Auth — GET /auth/me
Method: GET
Path: /api/v1/auth/me
Auth: JwtAuthGuard
Request: Bearer token
Response: `{ data: { id, phone, fullName, email, systemRole, platformRole, organizationId, organization: { id, name, slug, logoUrl, setupCompleted, isActive }, registrationCompleted, createdAt } }`
Errors: 401 (unauthorized), 401 (user not found or inactive)

### Auth — POST /auth/refresh
Method: POST
Path: /api/v1/auth/refresh
Auth: Public
Request: `{ refreshToken: string }`
Response: `{ accessToken, refreshToken, tokenType, expiresIn, user: { ... } }`
Errors: 401 (invalid refresh token)

### Auth — POST /auth/logout
Method: POST
Path: /api/v1/auth/logout
Auth: JwtAuthGuard
Request: Bearer token
Response: `{ data: { success: true } }`
Errors: 401 (unauthorized)

---

## Platform Module

### Platform — GET /platform/organizations
Method: GET
Path: /api/v1/platform/organizations
Auth: JwtAuthGuard + SuperAdminGuard
Request: Query params: `page`, `limit`, `search`, `status` (active|inactive|all)
Response: `{ data: [...], meta: { total, page, limit } }`
Errors: 401, 403

### Platform — POST /platform/organizations
Method: POST
Path: /api/v1/platform/organizations
Auth: JwtAuthGuard + SuperAdminGuard
Request: `{ name: string, slug?: string, contactEmail?: string, contactPhone?: string }`
Response: `{ data: { id, name, slug, email, phone, isActive, setupCompleted, createdAt, updatedAt } }`
Errors: 400, 401, 403, 409 (slug conflict)

### Platform — GET /platform/organizations/:id
Method: GET
Path: /api/v1/platform/organizations/:id
Auth: JwtAuthGuard + SuperAdminGuard
Response: `{ data: { ...org, firstAdmin?: { id, fullName, email, phone, registrationCompleted } } }`
Errors: 401, 403, 404

### Platform — PATCH /platform/organizations/:id
Method: PATCH
Path: /api/v1/platform/organizations/:id
Auth: JwtAuthGuard + SuperAdminGuard
Request: `{ name?: string, slug?: string, contactEmail?: string, contactPhone?: string }`
Response: `{ data: { ...org } }`
Errors: 401, 403, 404, 409 (slug conflict)

### Platform — POST /platform/organizations/:id/first-admin
Method: POST
Path: /api/v1/platform/organizations/:id/first-admin
Auth: JwtAuthGuard + SuperAdminGuard
Request: `{ phone: string, fullName: string, email?: string }` — phone in Israeli local format e.g. "0501234567", normalized before saving
Response: `{ data: { admin: { id, phone, fullName, systemRole }, organization: { ... } } }`
Errors: 400, 401, 403, 404 (org not found), 409 (phone already exists)

---

## Organization Setup Module

### Organization — GET /organization/me
Method: GET
Path: /api/v1/organization/me
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Response: `{ data: { id, name, slug, email, phone, address, logoUrl, isActive, setupCompleted, settings, createdAt, updatedAt } }`
Errors: 400 (no organizationId), 401, 403, 404

### Organization — PATCH /organization/me/setup
Method: PATCH
Path: /api/v1/organization/me/setup
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: `{ name?, slug?, logoUrl?, contactPhone?, contactEmail?, address?, settings?, setupCompleted? }` — all fields optional; set setupCompleted=true on final wizard step
Response: `{ data: { ...org } }`
Errors: 400, 401, 403, 404, 409 (slug conflict)

### Organization — POST /organization/me/logo
Method: POST
Path: /api/v1/organization/me/logo
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: `{ logoUrl: string }`
Response: `{ data: { ...org } }`
Errors: 400 (missing logoUrl), 401, 403, 404

---

## Homepage Context Engine

### GET /api/v1/homepage/context
Returns personalized homepage context based on user role and status.

**Auth:** JwtAuthGuard

**Request:**
- No body required

**Response:**
```json
{
  "data": {
    "user": {
      "id": "string",
      "fullName": "string",
      "phone": "string",
      "systemRole": "ADMIN | USER | SUPER_ADMIN"
    },
    "organization": {
      "name": "string",
      "setupCompleted": boolean
    },
    "payment": {
      "currentMonth": "YYYY-MM",
      "isPaid": boolean,
      "lastPaymentDate": "ISO date"
    },
    "group": {
      "groupId": "string",
      "groupName": "string",
      "memberCount": number
    },
    "manager": {
      "managedGroups": number,
      "pendingTasks": number,
      "membersPaid": number,
      "membersUnpaid": number
    },
    "distributor": {
      "currentWeek": "YYYY-WNN",
      "assignedGroup": "string | null",
      "deliveriesCount": number
    },
    "admin": {
      "totalUsers": number,
      "totalGroups": number,
      "totalFamilies": number,
      "unpaidCount": number,
      "currentMonthRevenue": number
    },
    "visibleCards": ["string"],
    "quickActions": [
      {
        "id": "string",
        "title": "string",
        "path": "string"
      }
    ],
    "unreadNotifications": number
  }
}
```

**Errors:**
- 401: Unauthorized
- 500: Server error

**Business Logic:**
- SUPER_ADMIN sees platform-admin card
- ADMIN with incomplete setup sees organization-setup card
- Manager sees managed group tasks and member payment status (paid/unpaid only, NO amounts)
- Weekly distributor sees current week delivery information
- Regular user sees payment status, group, and notifications

---

## Manager Routes

All manager routes require `JwtAuthGuard` and verify the user is a group manager.

### GET /api/v1/manager/group
Get managed group details.

**Auth:** JwtAuthGuard

**Response:**
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "memberCount": number,
    "familyCount": number,
    "createdAt": "ISO date"
  }
}
```

**Errors:**
- 401: Unauthorized
- 404: No managed group found

---

### GET /api/v1/manager/group/members
Get group members with payment status (paid/unpaid ONLY, no amounts).

**Auth:** JwtAuthGuard

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "fullName": "string",
      "phone": "string",
      "email": "string",
      "isPaid": boolean,
      "joinedAt": "ISO date"
    }
  ]
}
```

**Critical:** Manager can only see paid/unpaid status, NEVER payment amounts.

**Errors:**
- 401: Unauthorized
- 403: Not a group manager

---

### GET /api/v1/manager/group/families
Get families in managed group.

**Auth:** JwtAuthGuard

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "familyName": "string",
      "address": "string",
      "contactPhone": "string",
      "notes": "string"
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 403: Not a group manager

---

### GET /api/v1/manager/group/weekly-tasks?weekKey=YYYY-MM-DD
Get weekly order status for all families in managed group.

**Auth:** JwtAuthGuard

**Query Params:**
- `weekKey` (optional): Week start date (defaults to current week)

**Response:**
```json
{
  "data": [
    {
      "familyId": "string",
      "familyName": "string",
      "address": "string",
      "contactPhone": "string",
      "hasOrder": boolean,
      "orderStatus": "PENDING | COMPLETED",
      "orderId": "string"
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 403: Not a group manager

---

### POST /api/v1/manager/group/families/:familyId/weekly-order
Create weekly order for a family.

**Auth:** JwtAuthGuard

**Request:**
```json
{
  "groupId": "string",
  "familyId": "string",
  "weekStart": "YYYY-MM-DD",
  "items": [],
  "notes": "string"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "organizationId": "string",
    "groupId": "string",
    "familyId": "string",
    "weekStart": "ISO date",
    "items": [],
    "status": "PENDING",
    "notes": "string"
  }
}
```

**Errors:**
- 400: Family already has order this week
- 401: Unauthorized
- 403: Family not in manager's group
- 404: Family not found

**Business Rules:**
- One order per family per week
- Family must belong to manager's group
- Manager can only create orders for own group

---

### PATCH /api/v1/manager/group/weekly-orders/:orderId
Update weekly order.

**Auth:** JwtAuthGuard

**Request:**
```json
{
  "items": [],
  "notes": "string",
  "status": "PENDING | COMPLETED"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "organizationId": "string",
    "groupId": "string",
    "familyId": "string",
    "weekStart": "ISO date",
    "items": [],
    "status": "string",
    "notes": "string"
  }
}
```

**Errors:**
- 401: Unauthorized
- 403: Order not in manager's group
- 404: Order not found

---

### POST /api/v1/manager/group/weekly-distributor
Assign weekly distributor for the group.

**Auth:** JwtAuthGuard

**Request:**
```json
{
  "userId": "string",
  "weekStart": "YYYY-MM-DD"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "organizationId": "string",
    "groupId": "string",
    "userId": "string",
    "weekStart": "ISO date"
  }
}
```

**Errors:**
- 400: User not a member of group
- 401: Unauthorized
- 403: Not a group manager

**Business Rules:**
- One distributor per group per week
- Distributor must be a member of the group
- Updates existing assignment if one exists

---

## Admin Routes

All admin routes require `JwtAuthGuard` + `RolesGuard(['ADMIN'])`.

### GET /api/v1/admin/dashboard/stats
Get dashboard statistics for the organization.

**Auth:** JwtAuthGuard + RolesGuard('ADMIN')

**Response:**
```json
{
  "data": {
    "totalUsers": number,
    "totalGroups": number,
    "totalFamilies": number,
    "currentMonthRevenue": number,
    "paidUsersThisMonth": number,
    "unpaidUsersThisMonth": number
  }
}
```

**Errors:**
- 401: Unauthorized
- 403: Not an admin

**Scope:** Organization-scoped only

---

### GET /api/v1/admin/revenue/monthly
Get current month revenue.

**Auth:** JwtAuthGuard + RolesGuard('ADMIN')

**Response:**
```json
{
  "data": {
    "revenue": number
  }
}
```

**Errors:**
- 401: Unauthorized
- 403: Not an admin

---

### GET /api/v1/admin/revenue/by-month?months=12
Get revenue by month for past N months.

**Auth:** JwtAuthGuard + RolesGuard('ADMIN')

**Query Params:**
- `months` (optional, default=12): Number of months to retrieve

**Response:**
```json
{
  "data": [
    {
      "monthKey": "YYYY-MM",
      "revenue": number,
      "paymentCount": number
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 403: Not an admin

---

### GET /api/v1/admin/unpaid-users?monthKey=YYYY-MM
Get list of unpaid users for a specific month.

**Auth:** JwtAuthGuard + RolesGuard('ADMIN')

**Query Params:**
- `monthKey` (optional): Month to check (defaults to current month)

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "fullName": "string",
      "phone": "string",
      "email": "string",
      "reminderCount": number
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 403: Not an admin

**Business Logic:**
- Shows users with no COMPLETED payment for the month
- Includes reminder count for the month

---

### GET /api/v1/admin/weekly-status?weekKey=YYYY-MM-DD
Get weekly operational status for all groups.

**Auth:** JwtAuthGuard + RolesGuard('ADMIN')

**Query Params:**
- `weekKey` (optional): Week start date (defaults to current week)

**Response:**
```json
{
  "data": [
    {
      "groupId": "string",
      "groupName": "string",
      "managerName": "string",
      "totalFamilies": number,
      "completedOrders": number,
      "pendingOrders": number,
      "distributorName": "string",
      "hasDistributor": boolean
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 403: Not an admin

---

## Payment Webhook (Enhanced)

### POST /api/v1/payments/webhook
Payment processor webhook endpoint.

**Auth:** None (public webhook)

**Request:**
```json
{
  "organizationId": "string",
  "userId": "string",
  "amount": number,
  "monthKey": "YYYY-MM",
  "transactionId": "string",
  "method": "CREDIT_CARD | BANK_TRANSFER | CASH",
  "status": "COMPLETED | FAILED | PENDING",
  "webhookPayload": {}
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "organizationId": "string",
    "userId": "string",
    "amount": number,
    "monthKey": "string",
    "transactionId": "string",
    "status": "string",
    "method": "string",
    "paidAt": "ISO date",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Errors:**
- 400: Invalid data or organization/user not found
- 500: Server error

**Business Logic (Enhanced):**
- Idempotent: duplicate `transactionId` returns existing payment
- Verifies organization and user exist and belong together
- Uses Prisma transaction to ensure atomicity
- Creates audit log entry for every webhook
- Only sets `paidAt` when status is COMPLETED

**Security:**
- Webhook endpoint should be protected by webhook signature validation (to be implemented)
- Validates organization and user relationship
- Logs all webhook events to AuditLog table

---

## Implementation Notes

### Multi-Tenant Isolation
All queries in these modules enforce tenant isolation:
```typescript
where: {
  organizationId,
  deletedAt: null,
}
```

### Soft Delete Pattern
All modules use soft delete:
```typescript
deletedAt: new Date() // Never use prisma.*.delete()
```
All reads filter by `deletedAt: null`.

### Authorization Pattern
- **JwtAuthGuard**: Validates JWT and populates `request.user`
- **RolesGuard**: Checks `user.systemRole` against required roles
- **Manager operations**: Verify user is manager of the specific group
- **Admin operations**: Verify `systemRole === 'ADMIN'`
- **Organization scope**: All operations scoped to `user.organizationId`

### Payment Status for Managers
**CRITICAL:** Group managers can see ONLY paid/unpaid boolean status, NEVER payment amounts.
```typescript
// ✅ Correct
isPaid: m.user.payments.length > 0

// ❌ Wrong
amount: m.user.payments[0].amount  // NEVER expose to managers
```

### Response Envelope
All successful responses use:
```json
{
  "data": {},
  "meta": {}
}
```

Errors use:
```json
{
  "error": "ERROR_CODE",
  "message": "Human message",
  "statusCode": 400
}
```

---

## Swagger Documentation

All endpoints have been documented with:
- `@ApiTags` for grouping
- `@ApiOperation` with Hebrew descriptions
- `@ApiBearerAuth('access-token')` for protected routes
- `@ApiProperty` on all DTOs

Access Swagger at: `http://localhost:3001/api/docs`

---

## Module Structure

### Homepage Module
Files:
- `/apps/api/src/modules/homepage/homepage.module.ts`
- `/apps/api/src/modules/homepage/homepage.controller.ts`
- `/apps/api/src/modules/homepage/homepage.service.ts`
- `/apps/api/src/modules/homepage/dto/homepage-context.dto.ts`

### Manager Module
Files:
- `/apps/api/src/modules/manager/manager.module.ts`
- `/apps/api/src/modules/manager/manager.controller.ts`
- `/apps/api/src/modules/manager/manager.service.ts`
- `/apps/api/src/modules/manager/dto/group-details.dto.ts`
- `/apps/api/src/modules/manager/dto/member-with-status.dto.ts`
- `/apps/api/src/modules/manager/dto/weekly-task-status.dto.ts`

### Admin Module
Files:
- `/apps/api/src/modules/admin/admin.module.ts`
- `/apps/api/src/modules/admin/admin.controller.ts`
- `/apps/api/src/modules/admin/admin.service.ts`
- `/apps/api/src/modules/admin/dto/admin-stats.dto.ts`
- `/apps/api/src/modules/admin/dto/revenue-by-month.dto.ts`
- `/apps/api/src/modules/admin/dto/unpaid-user.dto.ts`
- `/apps/api/src/modules/admin/dto/group-weekly-status.dto.ts`

### Enhanced Payment Service
File:
- `/apps/api/src/modules/payments/payments.service.ts` (updated)

---

## Testing

Type checking passes for all new modules:
```bash
pnpm --filter @amutot/api typecheck
```

All modules follow NestJS best practices:
- Dependency injection
- Service layer for business logic
- Controller layer for HTTP handling
- DTO validation with class-validator
- Swagger documentation
- Proper error handling
- Logger usage (no console.log)

---

## Next Steps for Other Agents

### Frontend Lead
Can now implement:
- Homepage context-driven UI
- Manager dashboard with weekly tasks
- Admin analytics dashboard
- Payment reminder UI
- Weekly distributor assignment UI

### QA Agent
Should test:
- Multi-tenant isolation (admin cannot see other org data)
- Manager cannot see payment amounts
- Manager can only access own group
- Payment webhook idempotency
- Weekly order uniqueness constraints
- Audit log creation on webhooks
- Role-based access control
