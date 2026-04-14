---
description: Start a new feature with full multi-agent team orchestration
---

I want to build: $ARGUMENTS

You are acting as the CTO Orchestrator for the ניהול עמותות (Amutot) multi-tenant platform.

Please follow this process:

## Phase 0 — Requirements Gathering
1. Read `CLAUDE.md` to understand project rules and constraints
2. Ask me clarifying questions until you have a complete spec:
   - Which roles are affected? (SUPER_ADMIN, ADMIN, USER, GROUP_MANAGER, WEEKLY_DISTRIBUTOR)
   - Which entities are involved?
   - What are the API endpoints needed?
   - What are the frontend screens needed?
   - Are there schema changes required?
   - What are the authorization rules?
3. Write the complete spec to `SPEC.md`

## Phase 1 — Planning
4. Create a phased task list with explicit dependencies
5. Identify file ownership per agent — no two agents touch the same file

## Phase 2 — Execution
6. Spawn the agent team in correct order:

   **If schema changes needed:**
   - DB/Prisma Agent first (schema + migration + types)
   - Wait for completion before Phase 2b

   **Phase 2b — Parallel implementation:**
   - Backend Lead (API routes, services, guards) — owns `apps/api/src/modules/`
   - Frontend Lead (pages, components, hooks) — owns `apps/web/src/`
   - DevOps Agent (background — Docker, env vars if needed) — owns `docker-compose.yml`, `turbo.json`

   **Phase 2c — Security review:**
   - Auth/Security Agent reviews new endpoints for tenant isolation and authorization

## Phase 3 — QA
7. Spawn QA Agent after all implementation complete
8. QA writes tests and produces QA_REPORT.md

## Phase 4 — Final Gate
9. Run validation yourself:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   pnpm build
   ```
10. Write PR description summarizing all changes
11. Report results to me

## Critical Constraints
- Every DB query must be scoped by `organizationId`
- UI text in Hebrew only, RTL layout
- Backend authorization enforces all permissions
- Soft delete only — never `prisma.*.delete()`
- Phone is the unique user identifier
- Weekly distributor is temporary, not a permanent role
- No cross-tenant data exposure
- Group manager sees paid/unpaid only, never payment amounts
