# CLAUDE.md

This file gives Claude Code full project guidance when working in this repository.

## Product Name

ניהול עמותות

Internal English name:

Amutot Management Platform

## Core Identity

This is a multi-tenant SaaS platform for Israeli nonprofits.

The system allows many nonprofit organizations to manage users, donations/payments, distribution groups, supported families, weekly shopping orders, weekly distributors, reminders, push notifications, and admin dashboards.

The UI is Hebrew-first and RTL only.

Remove and avoid all references to:

* Nachalat David
* Nachalat-david
* נחלת דוד

This product is generic SaaS for nonprofit management.

---

## Stack

* Next.js App Router
* NestJS
* Prisma
* PostgreSQL
* TypeScript
* Tailwind CSS
* PWA
* Push Notifications
* Green API for OTP delivery
* Docker Compose
* pnpm monorepo / Turborepo

---

## Commands

```bash
pnpm install
pnpm dev

docker compose up -d postgres pgadmin

pnpm build
pnpm typecheck
pnpm lint
pnpm format

pnpm test
pnpm test:watch

pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

---

## Architecture

Monorepo structure:

```txt
apps/
  web/
  api/

packages/
  types/
  ui/
  utils/

prisma/
  schema.prisma
```

Backend API prefix:

```txt
/api/v1
```

Swagger:

```txt
/api/docs
```

Ports:

| Service    | Port |
| ---------- | ---- |
| Web        | 3000 |
| API        | 3001 |
| PostgreSQL | 5432 |
| pgAdmin    | 5050 |

---

# 1. SaaS Multi-Tenant Model

The platform supports multiple nonprofit organizations.

Each organization is a tenant.

Every organization can manage:

* users
* donors/members
* distribution groups
* group managers
* group members
* families
* weekly shopping orders
* weekly distributor assignments
* donations/payments
* monthly payment statuses
* payment reminders
* push notifications
* CSV imports
* admin dashboards

Every business entity must belong to one `organizationId`.

Every backend query must be scoped by `organizationId`, except platform-level Super Admin flows.

Never rely on frontend filtering for tenant isolation.

Tenant isolation is a critical security rule.

---

# 2. Platform / Super Admin

There is a platform-level Super Admin.

The Super Admin is the owner/operator of the SaaS platform.

Super Admin can:

* create organizations
* create the first admin for each organization by phone number
* view organizations list
* activate/deactivate organizations
* access hidden platform admin screens

Super Admin does not manage normal daily organization data in MVP.

Hidden routes:

```txt
/platform-secret/admins
/platform-secret/associations
```

These routes:

* must not appear in regular navigation
* must be protected by `SUPER_ADMIN`
* must not be accessible by organization admins

Backend routes:

```txt
GET    /platform/organizations
POST   /platform/organizations
GET    /platform/organizations/:id
PATCH  /platform/organizations/:id
POST   /platform/organizations/:id/first-admin
```

---

# 3. Organization First Admin Flow

Flow:

1. Super Admin creates a new organization.
2. Super Admin adds the first organization admin by phone number.
3. The first admin logs in with phone + OTP.
4. If organization setup is incomplete, redirect to organization setup wizard.
5. Admin sets:

   * organization name
   * slug
   * logo
   * contact phone
   * contact email
   * address
   * basic settings
6. After setup, admin enters the organization admin dashboard.
7. Admin starts creating/importing:

   * users
   * groups
   * families
   * group managers
   * memberships
   * payments
   * weekly operations

---

# 4. Roles and Permission Model

Do not use one flat role for all logic.

Always separate:

## Platform Role

```ts
SUPER_ADMIN
```

## Organization System Role

```ts
ADMIN
USER
```

## Contextual Roles

```ts
GROUP_MANAGER
GROUP_MEMBER
```

## Operational State

```ts
WEEKLY_DISTRIBUTOR
```

Important rules:

* `SUPER_ADMIN` manages tenants.
* `ADMIN` manages one organization only.
* `USER` has self access only.
* `GROUP_MANAGER` is contextual: user manages a specific group.
* `GROUP_MEMBER` is contextual: user belongs to a group.
* `WEEKLY_DISTRIBUTOR` is temporary per week and group.
* Weekly distributor is not a permanent role.

Authorization must consider:

* platformRole
* systemRole
* organizationId
* self ownership
* group membership
* group manager context
* weekly distributor assignment
* payment state
* business rules

---

# 5. Critical Authorization Rules

## Super Admin

Can access only platform-level screens and APIs.

Can create organizations and first admins.

## Organization Admin

Can manage only their organization.

Can CRUD:

* users
* groups
* families
* memberships
* weekly orders
* weekly distributor assignments
* payments
* notifications
* CSV imports

Cannot access other organizations.

Cannot access hidden platform routes.

## Regular User

Can see:

* own profile
* own group
* own donation/payment history
* own monthly payment status
* own notifications
* weekly distributor notice if assigned

Cannot see other users’ payment statuses.

## Group Manager

Can see only managed group context.

Can see:

* own group members
* own group families
* weekly tasks
* paid/unpaid status of group members only
* weekly order status
* weekly distributor assignment

Cannot see:

* other groups
* other organizations
* payment amounts of members
* admin dashboard

## Weekly Distributor

Can see only delivery-relevant data for current week:

* group name
* families for delivery
* addresses
* phone numbers
* notes
* order summary if needed

Cannot edit orders, payments, users, or families.

---

# 6. Auth Flow: Phone + Green API OTP

No passwords.

No public registration from scratch.

Users are created by:

1. Super Admin as first organization admin
2. Organization Admin manually
3. Organization Admin via CSV import

Login flow:

```txt
POST /auth/start-login
POST /auth/verify-otp
GET  /auth/me
POST /auth/logout
POST /auth/refresh
```

Flow:

1. User enters phone.
2. Backend normalizes phone.
3. Backend finds existing user.
4. If not found, return safe error.
5. Backend creates OTP.
6. Store OTP hash only.
7. Send OTP through Green API.
8. In development, allow mock OTP mode.
9. User verifies OTP.
10. Backend returns JWT access/refresh tokens.
11. Redirect user based on role/context/state.

JWT must include:

* userId
* organizationId if organization user
* platformRole if SUPER_ADMIN
* systemRole

Environment variables:

```env
JWT_SECRET=
GREEN_API_INSTANCE_ID=
GREEN_API_TOKEN=
GREEN_API_BASE_URL=
OTP_TTL_MINUTES=5
OTP_MOCK_MODE=true
```

Green API service:

```txt
apps/api/src/modules/auth/green-api.service.ts
```

Security:

* OTP expires
* OTP attempts limited
* OTP stored hashed
* no hardcoded API keys
* login rate limiting required

---

# 7. Organization Setup Wizard

Route:

```txt
/setup/organization
```

Backend:

```txt
GET   /organization/me
PATCH /organization/me/setup
POST  /organization/me/logo
```

Show setup wizard if:

```ts
organization.setupCompleted === false
```

Steps:

1. Basic details

   * name
   * slug
   * logo
   * contact phone
   * contact email
   * address

2. Settings

   * can users choose group
   * default monthly donation amount
   * payment link placeholder

3. Finish

   * set setupCompleted=true
   * redirect to admin dashboard

Only organization `ADMIN` can complete setup.

---

# 8. Core Domain Models

Use Prisma as the source of truth.

Every tenant-owned model needs:

* id
* organizationId
* createdAt
* updatedAt
* deletedAt where relevant

## Organization

Tenant root.

Fields:

* id
* name
* slug
* logoUrl
* contactPhone
* contactEmail
* address
* status
* setupCompleted
* createdBySuperAdminId
* createdAt
* updatedAt
* deletedAt

## User

Fields:

* id
* organizationId nullable only for SUPER_ADMIN
* phone unique globally
* fullName
* email
* platformRole optional
* systemRole
* isActive
* registrationCompleted
* groupChoiceLocked
* createdAt
* updatedAt
* deletedAt

MVP decision:
`phone` is globally unique.

Reason:
Login by phone remains simple and does not require tenant selection.

## DistributionGroup

Fields:

* id
* organizationId
* name
* managerUserId
* isActive
* createdAt
* updatedAt
* deletedAt

## GroupMembership

Fields:

* id
* organizationId
* groupId
* userId
* status
* joinedAt
* createdAt
* updatedAt

Unique:

* groupId + userId

## Family

Fields:

* id
* organizationId
* groupId optional
* familyName
* address
* contactPhone
* contactName
* notes
* metadataJson
* status
* createdAt
* updatedAt
* deletedAt

## WeeklyOrder

Fields:

* id
* organizationId
* groupId
* familyId
* weekKey
* createdByUserId
* shoppingListJson
* notes
* status
* createdAt
* updatedAt

Unique:

* familyId + weekKey

## WeeklyDistributorAssignment

Fields:

* id
* organizationId
* groupId
* weekKey
* assignedUserId
* assignedByUserId
* createdAt
* updatedAt

Unique:

* groupId + weekKey

## Payment

Fields:

* id
* organizationId
* userId
* amount
* currency
* monthKey
* paymentDate
* source
* externalTransactionId
* status
* rawWebhookPayload
* createdAt

## MonthlyPaymentStatus

Fields:

* id
* organizationId
* userId
* monthKey
* isPaid
* paidAt
* paymentId
* reminderCount
* lastReminderAt
* createdAt
* updatedAt

Unique:

* userId + monthKey

## PaymentReminder

Fields:

* id
* organizationId
* userId
* monthKey
* reminderNumber
* channel
* status
* sentAt
* createdAt

## Notification

Fields:

* id
* organizationId
* userId
* type
* title
* body
* channel
* status
* sentAt
* metadataJson
* createdAt

## PushSubscription

Fields:

* id
* organizationId
* userId
* endpoint
* p256dh
* auth
* deviceInfo
* isActive
* createdAt
* updatedAt

## OtpCode

Fields:

* id
* phone
* otpHash
* purpose
* expiresAt
* consumedAt
* attemptCount
* createdAt

## WebhookEvent

Fields:

* id
* organizationId optional
* provider
* eventId
* eventType
* status
* rawPayload
* processedAt
* createdAt

---

# 9. Backend Modules

Use NestJS modules:

```txt
platform
organizations
auth
users
groups
memberships
families
weekly-orders
weekly-distributors
payments
payment-status
reminders
notifications
push
webhooks
admin
csv-import
homepage
dashboard
common/prisma
common/authz
common/dates
common/storage
common/jobs
```

Every module should use:

* controller
* service
* DTOs
* class-validator
* Swagger decorators
* guards/policies
* tests where relevant
* Prisma transactions for critical flows

Common backend tools:

* `PrismaService`
* `JwtAuthGuard`
* `PlatformRoleGuard`
* `OrgRoleGuard`
* `OrganizationScopeGuard`
* `SelfOrAdminPolicy`
* `GroupManagerPolicy`
* `WeeklyDistributorPolicy`
* `@CurrentUser()`
* `@OrganizationId()`
* `TransformInterceptor`
* `HttpExceptionFilter`

---

# 10. API Response Format

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "statusCode": 400
}
```

Use pagination for all admin list endpoints.

---

# 11. Frontend Structure

```txt
apps/web/src/
  app/
    (auth)/
      login/
    platform-secret/
      admins/
      associations/
    setup/
      organization/
    dashboard/
    profile/
    my-group/
    my-donations/
    notifications/
    settings/
    manager/
      dashboard/
      weekly-orders/
      families/
      members/
    admin/
      dashboard/
      users/
      groups/
      families/
      imports/
      payments/
      push/
      settings/
  components/
    ui/
    layout/
    cards/
    forms/
    tables/
  features/
    auth/
    platform/
    organization-setup/
    homepage/
    admin/
    users/
    groups/
    families/
    weekly-orders/
    weekly-distributors/
    payments/
    notifications/
    csv-import/
    pwa/
  hooks/
  lib/
  types/
```

All UI text must be Hebrew.

Use RTL layout:

* prefer `ms-` and `me-`
* avoid `ml-` and `mr-`
* use `gap-*` instead of directional spacing
* flip directional icons

---

# 12. Main Screens

## Login

Route:

```txt
/login
```

States:

* phone input
* OTP input
* loading
* invalid phone
* user not found
* OTP failed
* OTP expired
* success redirect

Hebrew text examples:

* התחברות
* מספר טלפון
* שלחו לי קוד אימות
* קוד אימות
* התחברות למערכת

## Hidden Super Admin

Routes:

```txt
/platform-secret/admins
/platform-secret/associations
```

Screens:

* organizations list
* create organization
* create first admin by phone
* organization status
* first admin details

Do not show this in sidebar or navigation.

## Organization Setup

Route:

```txt
/setup/organization
```

Screens:

* organization name
* logo upload
* contact details
* basic settings
* finish setup

## User Dashboard

Route:

```txt
/dashboard
```

Cards:

* profile summary
* monthly payment status
* payment CTA
* my group
* donation history
* weekly distributor notice if relevant
* notifications

## Profile

Route:

```txt
/profile
```

Shows:

* name
* phone
* email
* organization
* group membership
* notification settings

## My Group

Route:

```txt
/my-group
```

Shows:

* group name
* manager name
* own membership status
* no sensitive payment data

## My Donations

Route:

```txt
/my-donations
```

Shows:

* own payment history
* monthKey
* amount
* status
* payment date

## Manager Dashboard

Route:

```txt
/manager/dashboard
```

Shows:

* group summary
* group members
* families
* weekly task completion
* missing weekly orders
* distributor assignment status
* paid/unpaid member summary only

## Manager Weekly Orders

Route:

```txt
/manager/weekly-orders
```

Features:

* list families
* one weekly order per family
* create/update shopping list
* status draft/completed
* validation

## Manager Families

Route:

```txt
/manager/families
```

Shows:

* families under managed group only
* address
* contact phone
* notes

## Manager Members

Route:

```txt
/manager/members
```

Shows:

* members of managed group
* paid/unpaid status only
* no payment amounts

## Weekly Distributor View

Can be part of dashboard or route:

```txt
/distributor/current
```

Shows:

* clear notice: אתה המחלק השבועי
* family list
* addresses
* phones
* notes
* no admin controls

## Admin Dashboard

Route:

```txt
/admin/dashboard
```

Shows organization-scoped:

* total users
* total donors
* total groups
* total families
* monthly revenue
* revenue by month
* revenue by year
* unpaid users this month
* groups overview
* weekly operational status
* push shortcuts
* CSV import shortcuts

## Admin Users

Route:

```txt
/admin/users
```

Features:

* table
* search by phone/name
* filters
* create user manually
* edit user
* soft delete
* view details

## Admin Groups

Route:

```txt
/admin/groups
```

Features:

* groups list
* manager
* members count
* families count
* assign manager
* manage members

## Admin Families

Route:

```txt
/admin/families
```

Features:

* families list
* create/edit
* assign to group
* soft delete

## Admin Imports

Route:

```txt
/admin/imports
```

Import types:

* users CSV
* families CSV
* groups CSV

Each import includes:

* upload
* preview
* valid rows
* invalid rows
* duplicate rows
* row-level errors
* confirm commit
* result summary

## Admin Payments

Route:

```txt
/admin/payments
```

Shows:

* payment statuses
* monthly revenue
* yearly revenue
* unpaid users
* reminders history

## Admin Push

Route:

```txt
/admin/push
```

Actions:

* send weekly order reminder to managers
* send weekly distributor reminder to managers
* send payment reminder to unpaid users

---

# 13. Homepage Context Engine

Backend endpoint:

```txt
GET /homepage/context
```

Returns:

* user summary
* organization summary
* setup state
* payment summary
* group summary
* manager summary
* distributor summary
* admin summary
* notifications summary
* visible cards
* quick actions

Rendering priority:

1. organization setup incomplete
2. user registration incomplete
3. urgent payment state
4. weekly distributor state
5. group manager tasks
6. admin overview
7. standard user cards

If user is organization `ADMIN`, default homepage is admin dashboard.

If user is `SUPER_ADMIN`, redirect to hidden platform area.

---

# 14. CSV Import Rules

Admin can import only into their own organization.

Users CSV:

* phone
* fullName

Families CSV:

* familyName
* address
* contactPhone
* metadata

Groups CSV:

* groupName
* managerPhone

Endpoints:

```txt
POST /admin/import/users/preview
POST /admin/import/users/commit
POST /admin/import/families/preview
POST /admin/import/families/commit
POST /admin/import/groups/preview
POST /admin/import/groups/commit
```

Rules:

* Admin only
* organization scoped
* preview before commit
* row-level errors
* duplicate detection
* phone validation
* managerPhone must belong to user in same organization
* no cross-tenant lookup
* result summary required

Result shape:

* totalRows
* validRows
* invalidRows
* createdCount
* updatedCount
* skippedCount
* errors

---

# 15. Payments and Donations

Every user should pay once per month.

Payment can represent donation/payment history.

`monthKey` format:

```txt
YYYY-MM
```

Rules:

* successful webhook creates Payment
* successful webhook updates MonthlyPaymentStatus
* duplicate webhooks are idempotent
* user sees own payments only
* admin sees organization payments only
* manager sees paid/unpaid only for own members
* manager never sees payment amounts

Endpoints:

```txt
GET /payments/me
GET /payments/me/status
GET /admin/payments
GET /admin/unpaid-users
GET /admin/revenue/monthly
GET /admin/revenue/by-month
GET /admin/revenue/by-year
POST /webhooks/payments/:provider
```

---

# 16. Reminders

Payment reminders:

* max 3 per user per month
* skip paid users
* stop after payment
* log every reminder

Endpoints:

```txt
POST /admin/push/payment-reminder-unpaid
POST /reminders/run-payment-cycle
GET /reminders/status
```

Reminder process:

1. Find unpaid users in organization.
2. Exclude users with reminderCount >= 3.
3. Send push/notification.
4. Create PaymentReminder.
5. Update MonthlyPaymentStatus.
6. Return summary.

---

# 17. Weekly Orders

Group manager must create one weekly order for each family in their group.

Rules:

* one order per family per week
* manager can create only for own group
* admin can inspect all within organization
* no cross-group access
* weekKey required

Endpoints:

```txt
GET  /manager/group/weekly-tasks?weekKey=
POST /manager/group/families/:familyId/weekly-order
PATCH /manager/group/weekly-orders/:orderId
GET  /admin/weekly-status
```

---

# 18. Weekly Distributor

One weekly distributor per group per week.

Rules:

* assigned user must be group member
* manager can assign only inside own group
* admin can inspect organization-wide
* distributor sees delivery data only

Endpoints:

```txt
POST /manager/group/weekly-distributor
GET  /weekly-distributors/me/current
GET  /distributor/current
```

---

# 19. Push Notifications

Push uses PWA subscriptions.

Endpoints:

```txt
POST /push/subscribe
POST /push/unsubscribe
GET  /notifications
PATCH /notifications/:id/read
```

Admin push actions:

```txt
POST /admin/push/weekly-orders-reminder
POST /admin/push/weekly-distributor-reminder
POST /admin/push/payment-reminder-unpaid
```

Rules:

* organization scoped
* create Notification record
* deactivate invalid subscriptions
* return targeted/sent/failed/skipped summary

---

# 20. PWA Requirements

Frontend must include:

* manifest
* service worker
* installable app
* push subscription registration
* notification permission prompt
* offline shell for basic layout

---

# 21. Backend Implementation Rules

Every endpoint needs:

* `JwtAuthGuard`
* authorization guard or policy
* DTO with validation
* organization scope
* Swagger decorators
* service-level business validation
* tests for critical logic

Never use:

```ts
prisma.model.delete()
```

Use soft delete:

```ts
deletedAt: new Date()
```

Reads must filter:

```ts
deletedAt: null
```

Use NestJS `Logger`.
Do not use `console.log`.

No `any`.

---

# 22. Date Helpers

Implement:

```ts
getCurrentMonthKey(): string // YYYY-MM
getCurrentWeekKey(): string  // ISO week
normalizePhone(phone: string): string
validatePhone(phone: string): boolean
```

Timezone assumption:

```txt
Asia/Jerusalem
```

---

# 23. Testing Requirements

Add tests for:

* Super Admin can create organization
* Super Admin can create first admin
* normal admin cannot access platform routes
* admin cannot access another organization
* every query is organization scoped
* user cannot login if phone does not exist
* OTP verification works
* group manager cannot access another group
* manager cannot assign distributor outside group
* weekly order unique per family/week
* weekly distributor unique per group/week
* payment webhook is idempotent
* payment marks month as paid
* reminders do not send after payment
* max 3 reminders per month
* CSV import validates rows
* CSV import does not create data in wrong organization
* user sees own donations only
* manager does not see payment amounts

---

# 24. Seed Data

Seed should include:

* one SUPER_ADMIN
* one demo organization
* one organization ADMIN
* several users
* one group manager
* group members
* groups
* families
* weekly orders
* weekly distributor assignment
* payments across months
* unpaid users
* notifications

No seed data may contain “Nachalat David” or “נחלת דוד”.

---

# 25. MVP Build Order

When implementing from scratch, use this order:

1. Remove old branding.
2. Verify monorepo structure.
3. Implement Prisma multi-tenant schema.
4. Add migrations.
5. Add seed data.
6. Implement auth with phone OTP + Green API mock.
7. Implement JWT and guards.
8. Implement platform Super Admin module.
9. Implement hidden platform screens.
10. Implement organization setup wizard.
11. Implement users/groups/families CRUD.
12. Implement CSV import preview/commit.
13. Implement homepage context.
14. Implement user dashboard.
15. Implement manager dashboard.
16. Implement weekly orders.
17. Implement weekly distributor.
18. Implement payments and donation history.
19. Implement admin dashboard.
20. Implement push notifications.
21. Implement reminder flows.
22. Add tests.
23. Verify docker compose and full E2E flow.

---

# 26. Acceptance Criteria

The MVP is ready only when:

* Product is named ניהול עמותות.
* No old project branding remains.
* Multi-tenant organizations work.
* Super Admin hidden route works.
* Super Admin can create organization.
* Super Admin can create first admin by phone.
* First admin logs in with OTP.
* First admin completes organization setup.
* Admin manages only their organization.
* Admin can create/import users.
* Admin can create groups.
* Admin can assign managers.
* Admin can create families.
* Admin can view revenue.
* Admin can view unpaid users.
* Admin can send payment reminders to unpaid users only.
* Admin can send weekly order reminders to managers.
* Admin can send weekly distributor reminders to managers.
* User sees only own profile, group, donations, payment status, and notifications.
* Group manager sees only own group.
* Group manager can create one weekly order per family.
* Group manager can assign one weekly distributor from group members.
* Weekly distributor sees only delivery data.
* Payment webhook is idempotent.
* Monthly payment status updates after successful payment.
* Reminders stop after payment.
* Max 3 reminders per user per month.
* CSV imports have preview, row-level errors, duplicate handling, and commit.
* PWA install and push subscription flow exist.
* No cross-tenant data leakage exists.
* Backend authorization enforces all permissions.
* UI is Hebrew RTL.
* `pnpm build`, `pnpm typecheck`, `pnpm lint`, and tests pass.

---

# 27. Claude Code Behavior Rules

When working on this repository:

1. Always inspect existing files before editing.
2. Do not invent duplicate architecture if a module already exists.
3. Keep frontend, backend, Prisma, shared types, and tests aligned.
4. Prefer small, complete vertical slices.
5. Never implement UI without backend authorization.
6. Never add business data without `organizationId`.
7. Never expose cross-tenant data.
8. Never expose payment amounts to group managers.
9. Never treat weekly distributor as a permanent role.
10. Always keep user-facing text Hebrew.
11. Always preserve RTL layout.
12. Always add or update tests for important business rules.
13. Always run or explain required validation commands after changes.

---

# 28. Recommended First Claude Code Task

Start with this task if the repository is not fully aligned yet:

```txt
Inspect the repository and compare it against CLAUDE.md.
Then create an implementation plan for bringing the codebase into alignment with the multi-tenant SaaS model.
Do not write code yet.
Focus on:
1. old branding removal
2. Prisma schema gaps
3. auth and OTP gaps
4. tenant isolation gaps
5. Super Admin missing pieces
6. organization setup wizard gaps
7. admin/user/manager dashboard gaps
8. CSV import gaps
9. payments/reminders/push gaps
10. test coverage gaps
Return a prioritized step-by-step plan with exact files to edit.
```

---

# 29. Multi-Agent Orchestration

This project uses Claude Code Agent Teams for parallel development.

## Agent Roster

| Agent | Model | Domain | Owns |
|-------|-------|--------|------|
| cto-orchestrator | Opus | Planning, coordination | SPEC.md, task decomposition |
| backend-lead | Sonnet | NestJS API | `apps/api/src/modules/**` |
| frontend-lead | Sonnet | Next.js UI | `apps/web/src/**` |
| db-prisma-agent | Sonnet | Schema, migrations, types | `prisma/**`, `packages/types/**` |
| auth-security-agent | Sonnet | Auth, guards, tenant isolation | `apps/api/src/modules/auth/**`, `apps/api/src/common/authz/**` |
| qa-agent | Sonnet | Tests, QA reports | `**/*.spec.ts`, `**/*.test.ts` |
| devops-agent | Sonnet | Docker, CI, infra | `docker-compose.yml`, `.github/**`, `turbo.json` |

## Activating the Team

To start a multi-agent session for a new feature, use the slash command:

```
/start-feature [feature description]
```

Or build a specific MVP phase:

```
/build-mvp-phase [phase number or name]
```

## Task Ownership Rules

1. Two agents NEVER modify the same file in the same phase.
2. All inter-agent contracts go in `docs/api-contracts.md`.
3. Agent communication uses SendMessage — do not use comments in code.
4. DB/Prisma Agent runs first when schema changes are needed.
5. Frontend Lead and Backend Lead run in parallel.
6. QA Agent runs last, after all implementation is complete.
7. Auth/Security Agent reviews every new endpoint for authorization.

## Parallel Execution Pattern

```
Phase 0: DB/Prisma Agent (if schema changes)
Phase 1: Backend Lead ║ Frontend Lead ║ DevOps Agent (background)
Phase 2: Auth/Security Agent (review)
Phase 3: QA Agent (tests)
Phase 4: CTO validates: pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Context Hygiene

- CTO orchestrator uses /compact at 50% to preserve planning context.
- Specialist agents focus on their file ownership — no cross-domain edits.
- If an agent needs a file owned by another agent, it messages the CTO and waits.
