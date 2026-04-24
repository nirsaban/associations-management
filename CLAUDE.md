# CLAUDE.md

Context file auto-loaded by Claude Code at the start of every session.
Update this file when any of the locked facts below change — everything else in the repo depends on them being accurate.

---

## What this project is

Multi-tenant association management platform.
One platform hosts many **organizations** (code) a.k.a. **עמותות** (UI/Hebrew).
Each organization is a self-contained tenant: users, groups, families, payments, notifications — all scoped to one organization.

## Stack

- Backend: NestJS (TypeScript)
- ORM: Prisma
- Database: PostgreSQL
- Frontend: Next.js (App Router) + Tailwind, same monorepo
- Auth: JWT + phone OTP (Green API)
- Tenant isolation: Prisma `$extends` auto-filter by organizationId, bypassed for SUPER_ADMIN

## Role hierarchy — DO NOT merge these enums

- `PlatformRole.SUPER_ADMIN` — platform-level, above all organizations
- `SystemRole.ADMIN` — manages ONE organization
- `SystemRole.USER` — regular user or group member (distinguished by `GroupMembership`)
- `GroupRole.MANAGER` — on `GroupMembership.role`, manages one group
- `GroupRole.MEMBER` — on `GroupMembership.role`, belongs to a group

**Weekly Distributor is NOT a role.** It is a temporary weekly state stored on `WeeklyDistributorAssignment`.

## Absolute rules (break these → breaking the product)

1. Tenant isolation is absolute. An ADMIN of org A has zero visibility into org B. Only `SUPER_ADMIN` crosses organizations.
2. Phone number is unique **within** an organization, never globally. Constraint: `@@unique([organizationId, phone])` on `User`.
3. `SUPER_ADMIN` never acts as `ADMIN` of a specific organization. Different role, different panel.
4. Creating a new organization and its first ADMIN happens in a single transaction — never half-created.
5. Organization status is an **enum** (`ACTIVE` | `INACTIVE`), not a boolean.
6. Every tenant-scoped query goes through the Prisma extension. Do not bypass it unless you're a SUPER_ADMIN endpoint.

## Terminology — use exactly these, never mix

| Scope | English | Hebrew | Who operates here |
|---|---|---|---|
| platform-wide | across all organizations | רמת פלטפורמה | SUPER_ADMIN |
| association-wide | inside one organization | רמת עמותה | ADMIN |
| group-wide | inside one group | רמת קבוצה | GROUP MANAGER |

❌ Never use the vague phrase "system-wide" — always pick one of the three above.

## Language

- **Code** (identifiers, comments, variable names): English
- **User-facing UI**: Hebrew, RTL
- **Error messages shown to users**: Hebrew
- **Error codes**: English (e.g. `ORG_SLUG_CONFLICT`)
- **Commit messages**: Hebrew
- **Docs (reports, MDs, decisions)**: Hebrew

## Terminology mapping — code ↔ UI

| Code (English) | UI (Hebrew) |
|---|---|
| Organization | עמותה |
| Super Admin | סופר אדמין |
| Admin | אדמין |
| Group Manager | מנהל קבוצה |
| Group Member | חבר קבוצה |
| Regular User | משתמש רגיל |
| Weekly Distributor | מחלק שבועי |
| Family | משפחה |
| Weekly Order | הזמנה שבועית |
| Payment | תשלום |

Full glossary: `docs/GLOSSARY.md`.

## Documentation conventions

- `docs/<feature>/NN-*.md` — frozen per-feature reports (snapshot, plan, done). Never edit after writing; if reality changed, write a new numbered file.
- `docs/<feature>/README.md` — index of that feature's docs.
- `docs/ARCHITECTURE.md` — living, updated as architecture changes.
- `docs/ROLES.md` — living, updated when permissions change.
- `docs/GLOSSARY.md` — living, updated when terminology changes.
- Root `docs/README.md` — top-level index of features.

## How to run the stack

```bash
# Install
npm install

# Reset + migrate + seed (dev only — data is wiped)
npx prisma migrate reset --force

# Start backend
npm run start:dev

# Start frontend (in a second terminal)
npm run dev --workspace=web
```

## Seed credentials (dev)

See `docs/multi-tenant-foundation/03-done.md` for current dev login phones.
Rotate these whenever the seed changes.

## Non-negotiable style

- No component libraries on the frontend (no shadcn, no MUI, no Chakra, no Radix). Tailwind only.
- No merging of the three role enums.
- No renaming `Organization` to `Association` in code.
- No removing existing manual `organizationId` filters in services (the Prisma extension makes them redundant but safe — leave them).

## Generic Admin Panel (Super Admin)

- Backend: `apps/api/src/modules/platform-admin/` — generic CRUD for all Prisma models (SUPER_ADMIN only)
- Frontend: `apps/web/src/app/platform/admin/` — dynamic table + form, auto-adapts to schema
- Uses `Prisma.dmmf.datamodel.models` for runtime schema introspection — zero per-model boilerplate
- When adding a new Prisma model: run `prisma generate` → it auto-appears in the admin panel
- To add a Hebrew label: update `MODEL_LABELS` in `platform-admin-schema.service.ts`
- To hide sensitive fields: update `HIDDEN_FIELDS` in `platform-admin-schema.service.ts`
- To hide entire models: update `HIDDEN_MODELS` in `platform-admin-schema.service.ts`

## When in doubt

1. Check this file first
2. Then `docs/GLOSSARY.md` and `docs/ROLES.md`
3. Then the latest `NN-done.md` for the feature you're touching
4. If still ambiguous: ask in chat, do NOT guess