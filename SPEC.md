# MVP Implementation Spec

## Current State Assessment

The codebase has significant infrastructure already in place:

### ✅ Completed
- Docker Compose setup (PostgreSQL, pgAdmin, API, Web)
- Prisma schema with all required models
- Migrations applied
- Seed data with test organizations and users
- Basic NestJS API structure with modules
- Basic Next.js frontend structure
- Auth module with phone + OTP + JWT
- Platform module for Super Admin
- Basic CRUD services for Users, Groups, Families

### ❌ Needs Fixing/Completion
1. **TypeScript errors in web app** - Unused variables, type mismatches
2. **Missing guards and policies** - OrganizationScopeGuard, GroupManagerPolicy
3. **Incomplete API endpoints** - Homepage context, manager routes, admin routes
4. **Frontend screens incomplete** - Many placeholders
5. **Missing MonthlyPaymentStatus model** - Not in schema per CLAUDE.md
6. **Push subscriptions model missing** - PushSubscription not in schema
7. **OtpCode model missing** - Using in-memory sessions instead
8. **WebhookEvent model missing** - For payment webhook logging

---

## Phase-by-Phase Implementation Plan

### Phase 1: Fix Prisma Schema Gaps ✅
Schema already has most entities. Missing:
- MonthlyPaymentStatus (can be derived from Payment model)
- PushSubscription (using pushSubscription JSON field in User)
- OtpCode (using in-memory sessions, acceptable for MVP)

**Decision**: Schema is acceptable for MVP. No changes needed.

### Phase 2: Fix TypeScript Errors
Files with errors:
- `apps/web/src/app/(dashboard)/admin/csv-import/_components/CsvImporter.tsx`
- `apps/web/src/app/(dashboard)/payments/page.tsx`
- `apps/web/src/app/(dashboard)/weekly/page.tsx`
- `apps/web/src/app/(platform)/platform-secret/admins/_components/CreateAssociationModal.tsx`

### Phase 3: Complete Auth & Guards
- Verify JwtAuthGuard works
- Verify SuperAdminGuard works
- Add OrgRoleGuard
- Add GroupManagerPolicy
- Add OrganizationScopeGuard

### Phase 4: Complete Platform Super Admin
Backend endpoints needed:
- GET /platform/organizations ✅
- POST /platform/organizations ✅
- GET /platform/organizations/:id
- PATCH /platform/organizations/:id
- POST /platform/organizations/:id/first-admin ✅

Frontend screens:
- /platform-secret/admins ✅ (needs polishing)

### Phase 5: Complete Organization Setup Wizard
Backend endpoints needed:
- GET /associations/me ✅
- PATCH /associations/me/setup ✅
- POST /associations/me/logo

Frontend screens:
- /setup/association ✅ (needs verification)

### Phase 6: Complete Login Flow
- Phone input → OTP → redirect by role
- Hebrew text
- RTL layout
- Error handling

### Phase 7: Complete Admin CRUD
Backend endpoints:
- Users CRUD ✅
- Groups CRUD ✅
- Families CRUD ✅

Frontend screens:
- /admin/users ✅ (needs verification)
- /admin/groups (needs implementation)
- /admin/families (needs implementation)

### Phase 8: Complete CSV Import
Backend endpoints:
- POST /admin/import/users/preview
- POST /admin/import/users/commit
- POST /admin/import/families/preview
- POST /admin/import/families/commit
- POST /admin/import/groups/preview
- POST /admin/import/groups/commit

Frontend:
- /admin/csv-import ✅ (has type errors)

### Phase 9: Homepage Context Engine
Backend:
- GET /homepage/context

Frontend:
- Dynamic dashboard based on role

### Phase 10: User Screens
- /dashboard
- /profile
- /my-group
- /my-donations

### Phase 11: Manager Screens
- /manager/dashboard
- /manager/weekly-orders
- /manager/families
- /manager/members

### Phase 12: Admin Dashboard
- /admin/dashboard with stats
- Revenue charts
- Unpaid users
- Groups overview

### Phase 13: Payments
- Webhook handler (idempotent)
- MonthlyPaymentStatus tracking
- Payment history

### Phase 14: Reminders
- Max 3 per month
- Skip paid users
- Stop after payment

### Phase 15: Push Notifications
- PWA manifest
- Service worker
- Push subscription
- Admin push actions

---

## Agent Task Assignments

### DB/Prisma Agent
- No schema changes needed for MVP
- Skip this phase

### Backend Lead
Files to modify:
- `apps/api/src/modules/platform/platform.controller.ts` - Add PATCH endpoint
- `apps/api/src/modules/associations/associations.controller.ts` - Add logo upload
- `apps/api/src/modules/homepage/` - Create module
- `apps/api/src/modules/admin/` - Create admin-specific routes
- `apps/api/src/modules/manager/` - Create manager-specific routes
- `apps/api/src/common/guards/` - Add missing guards

### Frontend Lead
Files to fix:
- `apps/web/src/app/(dashboard)/admin/csv-import/_components/CsvImporter.tsx`
- `apps/web/src/app/(dashboard)/payments/page.tsx`
- `apps/web/src/app/(dashboard)/weekly/page.tsx`
- `apps/web/src/app/(platform)/platform-secret/admins/_components/CreateAssociationModal.tsx`

Files to complete:
- All dashboard screens
- Admin screens
- Manager screens
- User screens

### Auth/Security Agent
- Review all endpoints for tenant isolation
- Verify guards are applied correctly
- Test authorization rules

### QA Agent
- Run typecheck
- Run lint
- Run tests
- Verify acceptance criteria

---

## Acceptance Criteria Checklist

Per CLAUDE.md Section 26:

- [ ] Product is named ניהול עמותות
- [ ] No old project branding remains
- [ ] Multi-tenant organizations work
- [ ] Super Admin hidden route works
- [ ] Super Admin can create organization
- [ ] Super Admin can create first admin by phone
- [ ] First admin logs in with OTP
- [ ] First admin completes organization setup
- [ ] Admin manages only their organization
- [ ] Admin can create/import users
- [ ] Admin can create groups
- [ ] Admin can assign managers
- [ ] Admin can create families
- [ ] Admin can view revenue
- [ ] Admin can view unpaid users
- [ ] Admin can send payment reminders to unpaid users only
- [ ] Admin can send weekly order reminders to managers
- [ ] Admin can send weekly distributor reminders to managers
- [ ] User sees only own profile, group, donations, payment status, notifications
- [ ] Group manager sees only own group
- [ ] Group manager can create one weekly order per family
- [ ] Group manager can assign one weekly distributor from group members
- [ ] Weekly distributor sees only delivery data
- [ ] Payment webhook is idempotent
- [ ] Monthly payment status updates after successful payment
- [ ] Reminders stop after payment
- [ ] Max 3 reminders per user per month
- [ ] CSV imports have preview, row-level errors, duplicate handling, commit
- [ ] PWA install and push subscription flow exist
- [ ] No cross-tenant data leakage exists
- [ ] Backend authorization enforces all permissions
- [ ] UI is Hebrew RTL
- [ ] pnpm build, pnpm typecheck, pnpm lint, and tests pass
