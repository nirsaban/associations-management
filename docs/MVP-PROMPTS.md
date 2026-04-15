# MVP Build Prompts — One Phase Per Session

Copy-paste ONE prompt per Claude Code session.
After each phase, close the session and open a new one for the next phase.

---

## RESUME PROMPT (use when starting a new session)

```
Read CLAUDE.md sections 25-26. Inspect the codebase:
- ls apps/api/src/modules/
- ls apps/web/src/app/
- Check prisma/schema.prisma for existing models
- Run: pnpm typecheck 2>&1 | tail -30
- Run: pnpm build 2>&1 | tail -30
Report: which MVP phases (1-15) are DONE, PARTIAL, or NOT STARTED.
Do not fix anything yet — just report status.
```

---

## PHASE 1 — Docker + Prisma Schema + Seed

```
/start-feature Phase 1 — Docker + Prisma Schema + Seed Data

Read CLAUDE.md sections 8 and 24 completely.

1. Verify docker-compose.yml has postgres + pgadmin
2. Run: docker compose up -d postgres pgadmin
3. Ensure prisma/schema.prisma has ALL entities from CLAUDE.md section 8:
   Organization, User, DistributionGroup, GroupMembership, Family,
   WeeklyOrder, WeeklyDistributorAssignment, Payment, MonthlyPaymentStatus,
   PaymentReminder, Notification, PushSubscription, OtpCode, WebhookEvent
4. Every tenant entity must have organizationId + deletedAt
5. Run: pnpm prisma generate && pnpm prisma migrate dev --name full_schema
6. Create prisma/seed.ts per section 24 — no "Nachalat David" references
7. Run seed
8. Verify: pnpm typecheck && pnpm build

Do NOT move to other phases. End with status report.
```

---

## PHASE 2 — Auth Module (Phone + OTP + JWT)

```
/start-feature Phase 2 — Auth Module with Phone + OTP + JWT

Read CLAUDE.md sections 4, 5, 6, 9.

Build apps/api/src/modules/auth/:
- auth.module.ts, auth.controller.ts, auth.service.ts
- otp.service.ts — hash storage, verify, expire (5 min), max 5 attempts
- green-api.service.ts — mock mode when OTP_MOCK_MODE=true (code=123456)
- jwt.strategy.ts — payload: sub, phone, organizationId, platformRole, systemRole
- jwt-auth.guard.ts
- DTOs with class-validator
- Decorators: @CurrentUser(), @OrganizationId(), @Public()

Endpoints:
- POST /api/v1/auth/start-login
- POST /api/v1/auth/verify-otp
- GET /api/v1/auth/me
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout

Register in AppModule.
Test with curl using a seeded phone number.
End with: pnpm typecheck && pnpm build
```

---

## PHASE 3 — Guards + Authorization Policies

```
/start-feature Phase 3 — Guards and Authorization Layer

Read CLAUDE.md sections 4, 5, 9.

Build apps/api/src/common/guards/:
- platform-role.guard.ts (SUPER_ADMIN only)
- org-role.guard.ts (ADMIN/USER per org)
- organization-scope.guard.ts (ensures orgId from JWT matches)

Build apps/api/src/common/authz/:
- self-or-admin.policy.ts
- group-manager.policy.ts
- group-member.policy.ts
- weekly-distributor.policy.ts

Rules:
- organizationId ALWAYS from JWT, never from request body
- Group manager restricted to own group only
- Weekly distributor is temporary state, not permanent role
- Payment amounts never exposed to group managers

End with: pnpm typecheck && pnpm build
```

---

## PHASE 4 — Platform Super Admin

```
/start-feature Phase 4 — Platform Super Admin Module

Read CLAUDE.md sections 2, 3.

BACKEND — apps/api/src/modules/platform/:
- PlatformRoleGuard on all routes
- GET /api/v1/platform/organizations
- POST /api/v1/platform/organizations
- GET /api/v1/platform/organizations/:id
- PATCH /api/v1/platform/organizations/:id
- POST /api/v1/platform/organizations/:id/first-admin

FRONTEND — apps/web/src/app/platform-secret/:
- /platform-secret/admins — manage super admin functions
- /platform-secret/associations — org list, create org, create first admin
- These routes must NOT appear in sidebar or navigation
- Protected by SUPER_ADMIN role check
- Hebrew RTL UI

End with: pnpm typecheck && pnpm build
```

---

## PHASE 5 — Login + Organization Setup Wizard

```
/start-feature Phase 5 — Login Screen + Organization Setup Wizard

Read CLAUDE.md sections 6, 7, 12.

FRONTEND — Login (apps/web/src/app/(auth)/login/):
- Phone input screen
- OTP input screen
- Loading, error, invalid states
- Hebrew text: התחברות, מספר טלפון, שלחו לי קוד אימות, קוד אימות
- Redirect by role after login:
  - SUPER_ADMIN → /platform-secret/admins
  - ADMIN with setupCompleted=false → /setup/organization
  - ADMIN → /admin/dashboard
  - USER → /dashboard

BACKEND + FRONTEND — Org Setup (apps/web/src/app/setup/organization/):
- GET /api/v1/organization/me
- PATCH /api/v1/organization/me/setup
- Wizard: name, slug, logo, contact phone, email, address, settings
- Set setupCompleted=true on finish
- Redirect to /admin/dashboard

Hebrew RTL. End with: pnpm typecheck && pnpm build
```

---

## PHASE 6 — Users / Groups / Families CRUD

```
/start-feature Phase 6 — Users, Groups, Families CRUD

Read CLAUDE.md sections 8, 9, 11, 12.

BACKEND modules (each with controller, service, DTOs, Swagger):
- apps/api/src/modules/users/ — CRUD, search by phone/name, soft delete
- apps/api/src/modules/groups/ — CRUD, assign manager, manage members
- apps/api/src/modules/memberships/ — join/leave group
- apps/api/src/modules/families/ — CRUD, assign to group

All endpoints: JwtAuthGuard + OrgRoleGuard('ADMIN') + organizationId scoping.

FRONTEND admin screens:
- /admin/users — table, search, create, edit, soft delete
- /admin/groups — list, manager, members count, families count
- /admin/families — list, create/edit, assign to group

Hebrew RTL. End with: pnpm typecheck && pnpm build
```

---

## PHASE 7 — CSV Import

```
/start-feature Phase 7 — CSV Import with Preview and Commit

Read CLAUDE.md section 14.

BACKEND — apps/api/src/modules/csv-import/:
- POST /api/v1/admin/import/users/preview
- POST /api/v1/admin/import/users/commit
- POST /api/v1/admin/import/families/preview
- POST /api/v1/admin/import/families/commit
- POST /api/v1/admin/import/groups/preview
- POST /api/v1/admin/import/groups/commit

Each import: upload → parse → validate → preview with row-level errors →
duplicate detection → commit only after approval → result summary.

FRONTEND — /admin/imports:
- Upload CSV file
- Preview table: valid rows (green), invalid rows (red), duplicates (yellow)
- Row-level error messages in Hebrew
- Confirm/cancel buttons
- Result summary after commit

Organization scoped. Admin only. End with: pnpm typecheck && pnpm build
```

---

## PHASE 8 — Homepage Context + User Dashboard

```
/start-feature Phase 8 — Homepage Context Engine + User Dashboard

Read CLAUDE.md sections 13, 12.

BACKEND — apps/api/src/modules/homepage/:
- GET /api/v1/homepage/context
- Returns: user summary, org summary, setup state, payment summary,
  group summary, manager summary, distributor summary, admin summary,
  notifications, visible cards, quick actions
- Rendering priority per section 13

FRONTEND screens:
- /dashboard — User dashboard with cards from homepage context:
  - Profile summary card
  - Monthly payment status + CTA
  - My group card
  - Donation history card
  - Weekly distributor notice (if assigned)
  - Notifications card
- /profile — name, phone, email, org, group, notification settings
- /my-group — group name, manager, membership status
- /my-donations — payment history table (own data only)
- /notifications — notification list with read/unread

Role-based card visibility. Hebrew RTL.
End with: pnpm typecheck && pnpm build
```

---

## PHASE 9 — Manager Dashboard + Weekly Operations

```
/start-feature Phase 9 — Manager Dashboard + Weekly Orders + Distributor

Read CLAUDE.md sections 12, 17, 18.

BACKEND:
- apps/api/src/modules/weekly-orders/:
  - GET /api/v1/manager/group/weekly-tasks?weekKey=
  - POST /api/v1/manager/group/families/:familyId/weekly-order
  - PATCH /api/v1/manager/group/weekly-orders/:orderId
  - One order per family per week. Manager sees own group only.

- apps/api/src/modules/weekly-distributors/:
  - POST /api/v1/manager/group/weekly-distributor
  - GET /api/v1/weekly-distributors/me/current
  - GET /api/v1/distributor/current
  - Assigned user must be group member. One per group per week.

FRONTEND:
- /manager/dashboard — group summary, members, families, weekly tasks, paid/unpaid (no amounts!)
- /manager/weekly-orders — family list, create/update shopping list per family
- /manager/families — families in managed group only
- /manager/members — members with paid/unpaid status only
- /distributor/current — "אתה המחלק השבועי" + family list + addresses + phones

Hebrew RTL. End with: pnpm typecheck && pnpm build
```

---

## PHASE 10 — Admin Dashboard

```
/start-feature Phase 10 — Admin Dashboard

Read CLAUDE.md section 12 (Admin Dashboard, Admin Payments, Admin Push).

BACKEND:
- apps/api/src/modules/admin/ or apps/api/src/modules/dashboard/:
  - GET /api/v1/admin/dashboard — org stats
  - GET /api/v1/admin/weekly-status — weekly operational status

FRONTEND — /admin/dashboard:
- Total users, groups, families
- Monthly revenue, revenue by month, revenue by year
- Unpaid users this month
- Groups overview
- Weekly operational status (orders completed, distributors assigned)
- Quick action buttons: send reminders, CSV import
- All org-scoped

Hebrew RTL. End with: pnpm typecheck && pnpm build
```

---

## PHASE 11 — Payments + Webhooks

```
/start-feature Phase 11 — Payments, Webhooks, MonthlyPaymentStatus

Read CLAUDE.md sections 15, 8.

BACKEND:
- apps/api/src/modules/payments/:
  - GET /api/v1/payments/me — user's own payments
  - GET /api/v1/payments/me/status — current month status
  - GET /api/v1/admin/payments — org payments (admin only)
  - GET /api/v1/admin/unpaid-users
  - GET /api/v1/admin/revenue/monthly
  - GET /api/v1/admin/revenue/by-month
  - GET /api/v1/admin/revenue/by-year

- apps/api/src/modules/webhooks/:
  - POST /api/v1/webhooks/payments/:provider
  - MUST be idempotent (check externalTransactionId)
  - Creates Payment + updates MonthlyPaymentStatus
  - Stores raw webhook payload

FRONTEND — /admin/payments:
- Payment statuses table
- Monthly/yearly revenue display
- Unpaid users list
- Manager sees paid/unpaid only — NEVER amounts

monthKey format: YYYY-MM. End with: pnpm typecheck && pnpm build
```

---

## PHASE 12 — Reminders + Push Notifications

```
/start-feature Phase 12 — Payment Reminders + Push Notifications + PWA

Read CLAUDE.md sections 16, 19, 20.

BACKEND — Reminders:
- apps/api/src/modules/reminders/:
  - POST /api/v1/reminders/run-payment-cycle
  - GET /api/v1/reminders/status
  - Max 3 reminders per user per month
  - Skip paid users. Stop after payment.
  - Create PaymentReminder record for each send.

BACKEND — Push:
- apps/api/src/modules/push/:
  - POST /api/v1/push/subscribe
  - POST /api/v1/push/unsubscribe
  - GET /api/v1/notifications
  - PATCH /api/v1/notifications/:id/read

BACKEND — Admin push:
  - POST /api/v1/admin/push/weekly-orders-reminder
  - POST /api/v1/admin/push/weekly-distributor-reminder
  - POST /api/v1/admin/push/payment-reminder-unpaid

FRONTEND:
- /admin/push — send reminder buttons
- PWA: manifest.json, service-worker.js, install prompt, push subscription
- Notification permission prompt

Hebrew RTL. End with: pnpm typecheck && pnpm build
```

---

## PHASE 13 — Tests + Final Validation

```
/start-feature Phase 13 — Tests and Final Validation

Read CLAUDE.md sections 23, 26.

Write tests for ALL items in section 23:
- Super Admin can create org + first admin
- Normal admin cannot access platform routes
- Admin cannot access another organization
- Every query is organization scoped
- Phone login works / fails correctly
- OTP verification + expiry
- Group manager restricted to own group
- Weekly order unique per family/week
- Weekly distributor unique per group/week
- Payment webhook is idempotent
- Payment marks month as paid
- Reminders stop after payment / max 3 per month
- CSV import validates rows / org-scoped
- User sees own donations only
- Manager does NOT see payment amounts

Then run full validation:
- pnpm typecheck
- pnpm lint
- pnpm test
- pnpm build

Fix ALL errors until everything passes.
Report final status against section 26 acceptance criteria.
```

---

## TROUBLESHOOTING

If Claude Code hits token limit mid-phase:
1. Open new session
2. Paste the RESUME PROMPT (top of this file)
3. It will report what's done
4. Re-paste the same phase prompt — it will continue from where it stopped

If build/typecheck fails between phases:
```
Read the errors from: pnpm typecheck 2>&1 | head -50
Fix all TypeScript errors. Do not add new features.
Then run: pnpm typecheck && pnpm build
Report when clean.
```
