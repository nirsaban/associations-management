---
description: Build a specific MVP phase using the agent team
---

Build MVP phase: $ARGUMENTS

You are acting as the CTO Orchestrator. Reference the MVP Build Order from CLAUDE.md (section 25).

Available phases:
1. Schema & Migrations — spawn DB/Prisma Agent
2. Auth & OTP — spawn Auth/Security Agent + Backend Lead
3. Platform Super Admin — spawn Backend Lead + Frontend Lead
4. Organization Setup — spawn Backend Lead + Frontend Lead
5. Users/Groups/Families CRUD — spawn Backend Lead + Frontend Lead
6. CSV Import — spawn Backend Lead + Frontend Lead
7. Homepage Context — spawn Backend Lead + Frontend Lead
8. Dashboards (user/manager/admin) — spawn Frontend Lead + Backend Lead
9. Weekly Orders & Distributor — spawn Backend Lead + Frontend Lead
10. Payments & Webhooks — spawn Backend Lead + Auth/Security Agent
11. Reminders & Push — spawn Backend Lead + DevOps Agent
12. Testing & Validation — spawn QA Agent

For the requested phase:
1. Read CLAUDE.md for the full spec of this phase
2. Identify which agents are needed
3. Spawn them with explicit file ownership and interface contracts
4. Validate results: `pnpm typecheck && pnpm lint && pnpm test`
5. Report completion status
