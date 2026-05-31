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

### GET /api/v1/manager/groups
List all groups managed by the authenticated user, ordered by createdAt ascending.

**Auth:** JwtAuthGuard

**Notes:**
- Single-group managers receive a 1-element array — identical behavior to before.
- Multi-group managers receive all their groups.
- Use the returned `id` as the `?groupId` query parameter on all other manager endpoints to target a specific group.

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "memberCount": number,
      "familyCount": number,
      "createdAt": "ISO date"
    }
  ]
}
```

**Errors:**
- 401: Unauthorized

---

### GET /api/v1/manager/group
Get managed group details.

**Auth:** JwtAuthGuard

**Query params:**
- `groupId` (optional) — target group ID. When omitted, resolves the first managed group (ordered by createdAt asc). Single-group managers may omit this param; multi-group managers should pass it.

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
- 403: groupId provided but user does not manage that group
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

### GET /api/v1/manager/group/weekly-status?weekKey=YYYY-WNN
Get comprehensive weekly operational status for the managed group.

**Auth:** JwtAuthGuard (manager verified by managerUserId on Group)

**Query Params:**
- `weekKey` (optional): Defaults to current ISO week

**Response:**
```json
{
  "data": {
    "weekStart": "ISO date string (Monday of the week)",
    "families": [
      { "id": "string", "familyName": "string", "contactPhone": "string|null", "hasOrder": boolean, "orderId": "string|null" }
    ],
    "ordersFilledCount": number,
    "ordersTotalCount": number,
    "ordersAllFilled": boolean,
    "distributor": {
      "assigned": boolean,
      "userId": "string",
      "fullName": "string",
      "phone": "string"
    },
    "lastThreeDistributors": [
      { "weekStart": "ISO date string", "userId": "string", "fullName": "string" }
    ]
  }
}
```

**Errors:** 401, 403

---

### PATCH /api/v1/manager/group/families/:familyId
Update allowed family metadata.

**Auth:** JwtAuthGuard (family must belong to manager's group)

**Request:**
```json
{
  "contactPhone": "0501234567",
  "childrenMinorCount": 2,
  "totalMemberCount": 4,
  "address": "string",
  "notes": "string"
}
```
All fields optional. FORBIDDEN: name, organizationId, groupId.
Validation: childrenMinorCount <= totalMemberCount (cross-field, enforced in service).

**Response:** `{ "data": { ...updatedFamily } }`

**Errors:** 400 (invalid phone, minor count > total), 401, 403, 404

---

### GET /api/v1/manager/group/families/:familyId/weekly-order?weekKey=YYYY-WNN
Get the weekly order for a specific family and week.

**Auth:** JwtAuthGuard (family must belong to manager's group)

**Query Params:**
- `weekKey` (optional): Defaults to current ISO week

**Response (order exists):**
```json
{
  "data": {
    "exists": true,
    "family": { "id": "string", "familyName": "string", "contactPhone": "string|null" },
    "order": { "id": "string", "weekKey": "string", "shoppingListJson": {}, "notes": "string|null", "status": "string", "createdAt": "ISO", "updatedAt": "ISO" }
  }
}
```
**Response (no order):** `{ "data": { "exists": false, "family": { ... } } }`

**Errors:** 401, 403, 404

---

### PUT /api/v1/manager/group/families/:familyId/weekly-order
Upsert the weekly order for a family.

**Auth:** JwtAuthGuard (family must belong to manager's group)

**Request:**
```json
{ "content": "string (min 1 char)", "weekKey": "YYYY-WNN (optional)" }
```
Stored as `{ "text": content }` in shoppingListJson. Sets status to COMPLETED.

**Response:** `{ "data": { ...weeklyOrder } }`

**Errors:** 400 (empty content), 401, 403, 404

---

### GET /api/v1/manager/group/members-and-payment-status
Get members with full payment info for the current month.

**Auth:** JwtAuthGuard (manager verified)

**Response:**
```json
{
  "data": [
    {
      "userId": "string",
      "fullName": "string",
      "phone": "string",
      "isDonor": true,
      "paidThisMonth": boolean,
      "currentMonthPaymentDate": "ISO date | null"
    }
  ]
}
```
Sorted: unpaid first, then by name.

**Errors:** 401, 403

---

### GET /api/v1/manager/group/distributor-workload
Get per-member distributor workload stats for last 52 weeks.

**Auth:** JwtAuthGuard (manager verified)

**Response:**
```json
{
  "data": {
    "members": [
      { "userId": "string", "fullName": "string", "timesAsDistributor": number, "lastAsDistributor": "weekKey|null" }
    ],
    "highest": { "userId": "string", "fullName": "string", "timesAsDistributor": number },
    "lowest": { "userId": "string", "fullName": "string", "timesAsDistributor": number }
  }
}
```

**Errors:** 401, 403

---

### GET /api/v1/manager/group/revenue
Get group revenue aggregation.

**Auth:** JwtAuthGuard (manager verified)

**Response:**
```json
{
  "data": {
    "thisMonth": { "amount": number, "currency": "ILS", "paidCount": number, "unpaidCount": number },
    "thisYear": { "amount": number, "byMonth": [{ "month": 1, "amount": number }, ...] }
  }
}
```
Only COMPLETED payments counted. Members scoped to this group.

**Errors:** 401, 403

---

## Admin Routes

All admin routes require `JwtAuthGuard` + `RolesGuard(['ADMIN'])`.

### Admin Users — GET /api/v1/admin/users
Method: GET
Path: /api/v1/admin/users
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: Query params:
  - `page` (number, default 1)
  - `limit` (number, default 10)
  - `search` (string, optional) — חיפוש לפי שם או טלפון
  - `role` (optional) — סינון לפי תפקיד: `ADMIN` | `USER` | `GROUP_MANAGER` | `GROUP_MEMBER`
    - `ADMIN`: מסנן לפי `systemRole = ADMIN`
    - `USER`: מסנן לפי `systemRole = USER` ואין חברות ACTIVE עם `GroupRole.MANAGER`
    - `GROUP_MANAGER`: מסנן משתמשים שיש להם לפחות חברות אחת ACTIVE עם `GroupRole.MANAGER` ב-GroupMembership
    - `GROUP_MEMBER`: מסנן משתמשים שיש להם לפחות חברות אחת ACTIVE עם `GroupRole.MEMBER` ב-GroupMembership
Response: `{ data: UserResponseDto[], meta: { total: number, page: number, limit: number } }`
Errors: 401, 403
Notes: הסינון לפי תפקיד נעשה בשרת — GROUP_MANAGER ו-GROUP_MEMBER מחייבים join דרך טבלת GroupMembership. לא לבצע סינון בצד הלקוח על תוצאות עמוד בודד.

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

Access Swagger at: `http://localhost:3003/api/docs`

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

---

## Alerts Module

### AlertAudience enum values

| Value | Hebrew label | Who receives it |
|---|---|---|
| `ALL_USERS` | כל המשתמשים ומנהלי קבוצות | All active users in the org |
| `GROUP_MANAGERS` | מנהלי קבוצות בלבד | Users with GroupMembership role = MANAGER |
| `UNPAID_THIS_MONTH` | משתמשים שלא שילמו החודש | Active users with no COMPLETED payment since the 1st of the current calendar month |
| `CURRENT_DISTRIBUTORS` | מחלקים שבועיים נוכחיים בלבד | Users assigned as weekly distributor for the current ISO week |

### Alerts — POST /admin/alerts
Method: POST
Path: /api/v1/admin/alerts
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: `{ title: string, body: string, audience?: AlertAudience (ALL_USERS|GROUP_MANAGERS|UNPAID_THIS_MONTH|CURRENT_DISTRIBUTORS), expiresAt?: string (ISO 8601) }`
Response: `{ data: Alert }`
Notes: Creates alert, resolves target push subscriptions via resolveAudienceUserIds(), fires push fan-out asynchronously (non-blocking). recipientCount set before response; deliveredCount updated after fan-out completes.
Errors: 400 (validation), 401, 403

### Alerts — GET /admin/alerts
Method: GET
Path: /api/v1/admin/alerts?page=1&limit=20
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: query params page, limit
Response: `{ data: Alert[], meta: { total: number, page: number, limit: number } }`
Notes: Ordered by publishedAt desc. Includes publishedBy user name.
Errors: 401, 403

### Alerts — DELETE /admin/alerts/:id
Method: DELETE
Path: /api/v1/admin/alerts/:id
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: path param id
Response: 204 No Content
Notes: Hard delete. Alert model has no soft-delete by design.
Errors: 401, 403, 404 (alert not found in org)

### Alerts — GET /me/alerts
Method: GET
Path: /api/v1/me/alerts?limit=10
Auth: JwtAuthGuard (any authenticated user)
Request: query param limit (default 10)
Response: `{ data: Alert[] }`
Notes: Each user receives alerts for every audience they qualify for simultaneously. A user who is a manager AND unpaid will receive ALL_USERS + GROUP_MANAGERS + UNPAID_THIS_MONTH alerts. Expired alerts (expiresAt <= now) are excluded.

---

## User Experience — Regular User Endpoints

### User Experience — GET /me/weekly-distribution
Method: GET
Path: /api/v1/me/weekly-distribution
Auth: JwtAuthGuard
Request: none
Response (not distributor): `{ data: { isDistributor: false } }`
Response (distributor):
```json
{
  "data": {
    "isDistributor": true,
    "assignmentId": "string",
    "weekStart": "ISO date string (Monday of current week)",
    "groupName": "string",
    "families": [
      {
        "id": "string",
        "name": "string",
        "contactPhone": "string | null",
        "address": "string | null",
        "weeklyOrderContent": "string | null",
        "delivered": false,
        "deliveredAt": "ISO date string | null"
      }
    ],
    "totalCount": "number",
    "deliveredCount": "number"
  }
}
```
Errors: 401

### User Experience — PUT /me/weekly-distribution/families/:familyId
Method: PUT
Path: /api/v1/me/weekly-distribution/families/:familyId
Auth: JwtAuthGuard
Request: `{ delivered: boolean }`
Response:
```json
{
  "data": {
    "id": "string",
    "familyId": "string",
    "delivered": "boolean",
    "deliveredAt": "ISO date string | null"
  }
}
```
Errors: 401, 403 (אינך המחלק השבועי), 404 (משפחה לא נמצאה בקבוצה)

### User Experience — GET /me/group-view
Method: GET
Path: /api/v1/me/group-view
Auth: JwtAuthGuard
Request: none
Response:
```json
{
  "data": {
    "group": { "id": "string", "name": "string" },
    "members": [
      { "userId": "string", "fullName": "string", "paidThisMonth": "boolean" }
    ],
    "currentDistributor": { "userId": "string", "fullName": "string", "phone": "string" } | null,
    "families": [
      {
        "id": "string",
        "name": "string",
        "contactPhone": "string | null",
        "address": "string | null",
        "childrenMinorCount": "number | null",
        "totalMemberCount": "number | null",
        "notes": "string | null"
      }
    ]
  }
}
```
Notes: No revenue or workload data — those are manager-only. Any group member (MEMBER or MANAGER role) can access this.
Errors: 401, 403 (אינך חבר בקבוצה), 404 (קבוצה לא נמצאה)

---

## Organization — Logo Upload via Cloudinary

### Organization — POST /organization/profile/logo
Method: POST
Path: /api/v1/organization/profile/logo
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: multipart/form-data — field `file` (image/png | image/jpeg | image/webp | image/svg+xml, max 2MB)
Response:
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "logoUrl": "string (Cloudinary secure_url)",
    "logoAssetId": "string"
  }
}
```
Notes:
- File is held in memory (memoryStorage) and streamed directly to Cloudinary via the shared CloudinaryService.
- Stored under Cloudinary folder: `amutot/{organizationId}/logos`.
- An Asset record is persisted for audit trail.
- Returns the full OrganizationResponseDto including the new Cloudinary URL.
Errors: 400 (סוג קובץ לא נתמך / קובץ חורג מ-2MB / יש לצרף קובץ תמונה), 401, 403

### Organization — DELETE /organization/profile/logo
Method: DELETE
Path: /api/v1/organization/profile/logo
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: none
Response: `{ data: OrganizationResponseDto }` — logoUrl and logoAssetId set to null
Errors: 401, 403
Errors: 401

---

## Referrals Module

### Referrals — POST /public/landing/:slug/referral-click
Method: POST
Path: /api/v1/public/landing/:slug/referral-click
Auth: Public (optional Bearer token for authenticated users)
Request: `{ code: string, userId?: string }`
Response (HTTP 200): `{ data: { success: boolean } }`
Notes:
  - If authenticated and userId matches the referral owner → skip (do not count own clicks)
  - If anonymous, deduplicate by (referralId, ip, calendar day) — one click per IP per day per referral
  - Always returns success: true when the referral code exists (even if click is skipped)
  - Returns success: false only when the referral code does not exist
Errors: 200 (no error states — silent skip on dedupe)

### Referrals — GET /referrals/me
Method: GET
Path: /api/v1/referrals/me
Auth: JwtAuthGuard
Response: `{ data: { code, isActive, clickCount, paymentCount, totalAmount, landingSlug } }`
Errors: 401

### Referrals — GET /referrals/admin/stats
Method: GET
Path: /api/v1/referrals/admin/stats
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Response: `{ data: [{ userId, fullName, phone, code, isActive, clickCount, paymentCount, totalAmount }] }`
Errors: 401, 403

---

### Admin — Weekly Status: No Distributor
Method: GET
Path: /api/v1/admin/weekly-status/no-distributor
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: query `weekKey` (optional, format YYYY-Wxx)
Response:
```json
{
  "data": [
    {
      "groupId": "string",
      "groupName": "string",
      "managerId": "string | null",
      "managerName": "string | null",
      "lastActivity": "ISO8601"
    }
  ]
}
```
Notes: Returns groups without a WeeklyDistributorAssignment for the current ISO week. Tenant-scoped.
Errors: 401, 403

---

### Admin — Weekly Status: Incomplete Orders
Method: GET
Path: /api/v1/admin/weekly-status/incomplete-orders
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request: query `weekKey` (optional, format YYYY-Wxx)
Response:
```json
{
  "data": [
    {
      "groupId": "string",
      "groupName": "string",
      "managerId": "string | null",
      "managerName": "string | null",
      "orderStatus": "DRAFT | COMPLETED | undefined",
      "completedOrders": "number",
      "totalOrders": "number",
      "lastUpdate": "ISO8601"
    }
  ],
  "meta": {
    "totalGroups": "number",
    "incompleteGroups": "number"
  }
}
```
Notes: Returns groups where at least one WeeklyOrder for the week is NOT COMPLETED. Tenant-scoped.
Errors: 401, 403

---

### Admin — Weekly Status: Alert Group Managers
Method: POST
Path: /api/v1/admin/weekly-status/alert-managers
Auth: JwtAuthGuard + RolesGuard (ADMIN)
Request:
```json
{
  "groupIds": ["string"],
  "title": "string",
  "body": "string",
  "expiresAt": "ISO8601 (optional)"
}
```
Response:
```json
{
  "data": {
    "alertId": "string",
    "recipientCount": "number"
  }
}
```
Notes: Resolves manager user IDs for the given groups (scoped to org), creates an Alert with audience GROUP_MANAGERS, and fan-outs push notifications only to those specific managers. Reuses the existing alerts pipeline via AlertsService.createAlertForUsers.

---

## Community Module (Phase 1)

All endpoints in this module are gated behind the `COMMUNITY_PROFESSIONS` feature flag.
When the flag is off all endpoints return 404 — as if they do not exist.

### Community — GET /api/v1/professions
Method: GET
Path: /api/v1/professions
Auth: JwtAuthGuard + FeatureFlagGuard
Request: –
Response: `{ data: [{ id, nameHe, sortOrder, professions: [{ id, nameHe, sortOrder }] }] }`
Headers: `Cache-Control: public, max-age=300`
Notes: Platform-level catalog — not tenant-scoped. Ordered by sortOrder then nameHe.
Errors: 401, 404 (flag off)

### Community — GET /api/v1/professions/search
Method: GET
Path: /api/v1/professions/search?q=<string>
Auth: JwtAuthGuard + FeatureFlagGuard
Request: `q` (min 1 char, required)
Response: `{ data: [{ id, nameHe, category: { id, nameHe } }] }` — flat list, max 30 results
Notes: Case-insensitive match on Profession.nameHe OR ProfessionCategory.nameHe.
Errors: 400 (q too short), 401, 404 (flag off)

### Community — PUT /api/v1/users/me/professions
Method: PUT
Path: /api/v1/users/me/professions
Auth: JwtAuthGuard + FeatureFlagGuard
Request: `{ primary: string, secondary?: string[] (max 5), otherProfession?: string (max 120) }`
Response: `{ data: { primary: { id, nameHe, category: { id, nameHe } }, secondary: [...], otherProfession: string | null } }`
Errors: 400 `INVALID_PROFESSION` (invalid/dup professionId), 401, 403 `SUPER_ADMIN_NO_PROFESSION` (platform admin), 404 (flag off)
Notes: Transactional replace — deletes all existing UserProfession rows then inserts new ones.

### Community — PUT /api/v1/users/me/privacy
Method: PUT
Path: /api/v1/users/me/privacy
Auth: JwtAuthGuard + FeatureFlagGuard
Request: `{ showInCommunitySearch: boolean }`
Response: `{ data: { showInCommunitySearch: boolean } }`
Errors: 400, 401, 404 (flag off)

### Community — PUT /api/v1/users/me/bio
Method: PUT
Path: /api/v1/users/me/bio
Auth: JwtAuthGuard + FeatureFlagGuard
Request: `{ shortBio: string (max 280, empty clears) }`
Response: `{ data: { shortBio: string | null } }`
Errors: 400, 401, 404 (flag off)

### Community — GET /api/v1/community/people
Method: GET
Path: /api/v1/community/people
Auth: JwtAuthGuard + FeatureFlagGuard
Request (query params): `name?`, `professionId?`, `categoryId?`, `q?`, `cursor?`, `limit?` (default 20, max 50)
Response: `{ data: { items: [{ id, fullName, avatarUrl, professions: [{ id, nameHe, isPrimary, category: { id, nameHe } }], otherProfession, shortBio, phone }], nextCursor: string | null } }`
Notes: Tenant-scoped. Excludes requesting user, users with showInCommunitySearch=false, SUPER_ADMIN users, soft-deleted users. Cursor pagination on id ASC.
Errors: 401, 404 (flag off)
Errors: 400, 401, 403
