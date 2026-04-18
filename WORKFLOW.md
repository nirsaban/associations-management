# WORKFLOW.md — Amutot Development Workflow

This document describes the standard development process, git conventions, command reference, and deployment procedures for the Amutot monorepo.

## Development Session Patterns

### 1. New Feature Flow (Typical: 3 Sessions)

#### Session 1: Interview & Specification
- Read CLAUDE.md and related domain docs
- Understand the user requirement (from issue, ticket, or conversation)
- Identify affected entities (Organization, Donor, Member, etc.)
- Create a detailed spec:
  - What data changes?
  - What API endpoints are needed?
  - What UI pages/components are needed?
  - What validation rules apply?
  - Hebrew text (all user-facing strings)?
- Do NOT start implementation yet
- Output: `.claude/specs/<feature-name>.md` with full spec

#### Session 2: Backend Implementation
- Create NestJS module(s) using `/add-module` skill
- Implement controller, service, DTO, spec tests
- Add database schema to `prisma/schema.prisma`
- Run `pnpm prisma migrate dev`
- Write unit tests (aim for 70%+ coverage)
- Update Swagger docs with `@ApiOperation` and `@ApiResponse`
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test` — all must pass
- Create feature branch, commit with conventional commits
- Open PR for review (do NOT merge)

#### Session 3: Frontend Implementation
- Create React components using `/build-component` skill
- Implement forms with React Hook Form + Zod validation
- Add RTL support and Stitch design tokens
- Create TanStack Query hooks for API integration
- Write component tests and Storybook stories
- Verify in RTL layout (set `dir="rtl"` on html element)
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test` — all must pass
- Update feature branch with frontend code
- Update PR description with testing checklist
- Request review (do NOT merge)

---

### 2. Bug Fix Flow

#### Step 1: Diagnose
- Create a reproduction case (unit test, Playwright test, or manual steps)
- Verify the bug exists with the current code
- Narrow down: frontend bug? backend bug? data issue?
- Check logs: backend logs, browser console, network requests

#### Step 2: Confirm Root Cause
- Add a failing test that captures the bug
- Read the relevant code path (service, controller, component)
- Identify the exact line(s) causing the issue
- Check if this affects multi-tenancy, soft deletes, or authorization

#### Step 3: Fix & Test
- Fix the code
- Verify the test now passes
- Check for related code patterns (may have same bug elsewhere)
- Run full test suite: `pnpm test`
- Run lint and typecheck: `pnpm lint`, `pnpm typecheck`
- Commit: `git commit -m "fix: <specific issue> (#<issue-number>)"`
- Open PR with test case included

---

### 3. Context Management

#### When to `/clear`
- After completing a large multi-session feature (3+ sessions)
- Before starting work on a completely different domain
- When token usage approaches limit (check context indicator)
- When the conversation becomes unfocused or history grows very long

#### When to `/compact`
- At the end of each session to maintain readable history
- Before opening a PR to create a clean summary
- To consolidate multiple small commits into clear narrative

#### Context Best Practices
- Always read CLAUDE.md and WORKFLOW.md at start of new session
- Keep one feature/bug per session (avoid context switching)
- Use `/compact` after each successful commit
- Summarize key decisions in PR description (don't rely on conversation history)

---

## Git & GitHub Conventions

### Branch Naming

```
feature/short-description     # New feature (e.g., feature/donor-tagging)
fix/short-description         # Bug fix (e.g., fix/soft-delete-leak)
chore/short-description       # Dependency updates, configs (e.g., chore/upgrade-next-14)
docs/short-description        # Documentation only (e.g., docs/api-endpoints)
```

Always create branches from `main`:
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature
```

### Commit Message Format (Conventional Commits)

```
feat: add donor tagging feature to organization dashboard
^--^  ^-----------------------------------------------^
|     |
|     +-> Summary in present tense (what does it do?)
|
+------> Type: feat, fix, chore, docs, test, perf, refactor

Body (optional, for context):
- Multi-tenancy verified in OrganizationGuard
- Added unit tests (72% coverage)
- Swagger docs updated

Breaking changes (if applicable):
BREAKING CHANGE: DonorDTO.tags now required field
```

Valid commit types:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — dependency updates, configs, build changes
- `docs:` — documentation (e.g., Swagger, README)
- `test:` — test files only
- `perf:` — performance optimization
- `refactor:` — code reorganization (no behavioral change)

### Pull Request Requirements

Every PR must have:

1. **Title**: matches the primary commit message
   - Good: `feat: add donor tagging`
   - Bad: `WIP`, `update`, `fix stuff`

2. **Description** (use this template):
   ```markdown
   ## What
   Brief description of changes

   ## Why
   Link to issue or context

   ## Testing
   - [ ] Unit tests passing (70%+ coverage)
   - [ ] Lint passing (`pnpm lint`)
   - [ ] TypeScript passing (`pnpm typecheck`)
   - [ ] Swagger docs updated (API changes only)
   - [ ] RTL tested (UI changes only)
   - [ ] No console.log in production code
   - [ ] organizationId scoping verified (backend changes)

   ## Files Changed
   - `apps/api/src/donors/` — new donor tagging service
   - `apps/web/app/donors/` — tagging UI
   ```

3. **Automated Checks** (CI must pass):
   - ESLint: `pnpm lint`
   - TypeScript: `pnpm typecheck`
   - Unit tests: `pnpm test`
   - Build: `pnpm build`

4. **Code Review**: At least one approval before merge

5. **Merge Strategy**: Squash and merge to keep main history clean

### Rules
- Never commit directly to `main`
- Never force push to `main` or `develop`
- Never merge your own PR without review
- All conversations in PRs should reference this workflow and CLAUDE.md

---

## Development Commands Reference

All commands run from the monorepo root (`/sessions/laughing-intelligent-bardeen/mnt/amutot/`).

### Install & Setup
```bash
# Install all dependencies
pnpm install

# Generate Prisma client (run after schema changes)
pnpm prisma:generate

# Create and apply a new database migration
pnpm prisma:migrate

# Deploy migrations in production
pnpm prisma:migrate:deploy

# Open Prisma Studio (visual database browser)
pnpm prisma:studio
```

### Development
```bash
# Start all dev servers (web on :3010, api on :3003)
pnpm dev

# Watch and rebuild (no server start)
pnpm build

# Type check all packages
pnpm typecheck

# Lint all code (ESLint)
pnpm lint

# Format all code (Prettier)
pnpm format

# Check formatting without changing files
pnpm format:check
```

### Testing
```bash
# Run all unit tests
pnpm test

# Run tests in watch mode (useful during development)
pnpm test:watch

# Run tests for a specific package
pnpm --filter web test
pnpm --filter api test

# Run with coverage report
pnpm test -- --coverage
```

### Build & Production
```bash
# Build all packages and apps
pnpm build

# Clean all artifacts and node_modules
pnpm clean
```

### Package-Specific Commands

Run commands in specific packages:
```bash
# Just the frontend
pnpm --filter web dev
pnpm --filter web test
pnpm --filter web lint

# Just the backend
pnpm --filter api dev
pnpm --filter api test
pnpm --filter api lint

# Just shared packages
pnpm --filter ui build
pnpm --filter types build
pnpm --filter utils test
```

### Turbo Commands (Advanced)

```bash
# Run a task and show dependencies (useful for understanding build graph)
turbo run build --graph

# Force rebuild even if cached
turbo run build --force

# Run tasks in specific packages only
turbo run test --filter "packages/types"

# View task cache
turbo prune --scope="@amutot/api"
```

---

## Module Addition Checklist

### Step 1: Design
- [ ] Read CLAUDE.md Domain Model section
- [ ] Identify entity name (English and Hebrew)
- [ ] Define relationships to other entities (Organization, User, etc.)
- [ ] List required fields and validation rules
- [ ] Identify API endpoints needed (CRUD + custom actions)
- [ ] Write specification in `.claude/specs/module-<name>.md`

### Step 2: Database Schema
- [ ] Add model to `prisma/schema.prisma`
- [ ] Include: `id`, `organizationId`, `createdAt`, `updatedAt`, `deletedAt`
- [ ] Add indexes on `organizationId` and filter fields
- [ ] Add relation fields to Organization and other entities
- [ ] Run `pnpm prisma:migrate dev --name add_<entity_name>`
- [ ] Verify migration file is correct (do NOT edit manually)
- [ ] Test schema with `pnpm prisma:studio`

### Step 3: Backend (NestJS)
- [ ] Create module structure: `apps/api/src/<entity>/`
  ```
  src/<entity>/
  ├── <entity>.controller.ts
  ├── <entity>.service.ts
  ├── <entity>.module.ts
  ├── dto/
  │   ├── create-<entity>.dto.ts
  │   ├── update-<entity>.dto.ts
  │   └── list-<entity>.query.dto.ts
  ├── <entity>.service.spec.ts
  └── <entity>.controller.spec.ts
  ```
- [ ] Use `/add-module` skill or scaffold manually
- [ ] Implement controller with routes: `GET`, `POST`, `PATCH`, `DELETE`
- [ ] Add guards: `@UseGuards(JwtAuthGuard, RolesGuard)`
- [ ] Add Swagger decorators on every endpoint
- [ ] Write DTO classes with `@IsString()`, `@IsOptional()`, etc.
- [ ] Implement service with database queries using Prisma
- [ ] **Important**: All queries must include `where: { organizationId, deletedAt: null }`
- [ ] Use soft delete: `update({ data: { deletedAt: new Date() } })`
- [ ] Write unit tests covering all public methods
- [ ] Run `pnpm --filter api test` — verify 70%+ coverage
- [ ] Run `pnpm --filter api lint` — zero warnings
- [ ] Run `pnpm --filter api typecheck` — zero errors

### Step 4: Shared Types
- [ ] Create `packages/types/src/<entity>.ts`
- [ ] Export Zod schema: `z.object({ ... })`
- [ ] Export TypeScript interface (if needed): `export interface <Entity> { ... }`
- [ ] Use same fields as backend DTO
- [ ] Import and reuse in both backend DTO and frontend forms
- [ ] Test with `pnpm --filter types test`

### Step 5: Frontend (React)
- [ ] Create app route: `apps/web/app/(dashboard)/<entity-plural>/`
- [ ] Create components:
  ```
  app/<entity>s/
  ├── page.tsx
  ├── _components/
  │   ├── <Entity>List.tsx
  │   ├── <Entity>Form.tsx
  │   └── <Entity>Card.tsx
  ├── _hooks/
  │   └── use<Entities>.ts (React Query)
  └── _types/
      └── <entity>.ts (local types if needed)
  ```
- [ ] Use `/build-component` skill for each component
- [ ] Implement React Query hooks in `_hooks/use<Entities>.ts`
- [ ] Use Stitch design tokens from `packages/ui/styles/tokens.css`
- [ ] Support RTL: use `ms-` / `me-` instead of `ml-` / `mr-`
- [ ] Handle states: loading, empty, error, success
- [ ] Add form validation with React Hook Form + Zod
- [ ] Create Storybook story for each component
- [ ] Test RTL layout with `dir="rtl"` on html element
- [ ] Run `pnpm --filter web test` — verify tests pass
- [ ] Run `pnpm --filter web lint` — zero warnings
- [ ] Run `pnpm --filter web typecheck` — zero errors

### Step 6: Integration & Review
- [ ] Link API URL in `.env` — `NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1`
- [ ] Start dev servers: `pnpm dev`
- [ ] Test flow end-to-end: create, read, update, delete
- [ ] Test with RTL enabled (set `dir="rtl"` in layout)
- [ ] Verify multi-tenancy: create two orgs, confirm isolation
- [ ] Check soft delete: delete a record, verify it's gone from UI but still in DB
- [ ] Verify auth: log out, try accessing protected routes (should redirect)
- [ ] Create PR with description referencing this checklist
- [ ] Wait for code review and CI to pass
- [ ] Do NOT merge until all checks pass

---

## Deployment Guide

### Prerequisites
- Docker installed locally
- PostgreSQL 15 (or managed database service)
- Node.js 20+
- pnpm 9+

### Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local values:
   # DATABASE_URL=postgresql://user:password@localhost:5432/amutot_dev
   # JWT_SECRET=your-secret-key
   # NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
   ```

3. **Set up database**:
   ```bash
   pnpm prisma:migrate
   pnpm prisma:studio  # optional: visual inspection
   ```

4. **Start dev servers**:
   ```bash
   pnpm dev
   # Frontend: http://localhost:3010
   # Backend API: http://localhost:3003/api/v1
   # Swagger docs: http://localhost:3003/api/v1
   ```

### Docker Compose (Local with Containers)

1. **Copy and configure**:
   ```bash
   cp .env.example .env.docker
   # Edit .env.docker
   ```

2. **Start all services**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Initialize database** (first time only):
   ```bash
   docker-compose exec api pnpm prisma migrate deploy
   ```

4. **Access services**:
   - Frontend: http://localhost:3010
   - API: http://localhost:3003/api/v1
   - pgAdmin: http://localhost:5050 (user: admin@admin.com, pass: admin)

5. **View logs**:
   ```bash
   docker-compose logs -f web
   docker-compose logs -f api
   docker-compose logs -f postgres
   ```

6. **Stop all services**:
   ```bash
   docker-compose down
   ```

### Staging Environment

1. **Build Docker images**:
   ```bash
   docker build -t amutot-api:staging -f apps/api/Dockerfile.api .
   docker build -t amutot-web:staging -f apps/web/Dockerfile.web .
   ```

2. **Push to registry** (example: Docker Hub):
   ```bash
   docker tag amutot-api:staging your-registry/amutot-api:staging
   docker push your-registry/amutot-api:staging
   ```

3. **Deploy with Docker Compose or Kubernetes**:
   ```bash
   # Via Docker Compose
   docker-compose -f docker-compose.staging.yml up -d
   
   # Via Kubernetes
   kubectl apply -f k8s/staging/
   ```

4. **Run migrations**:
   ```bash
   docker exec amutot-api pnpm prisma migrate deploy
   ```

### Production Environment

#### Pre-deployment Checklist
- [ ] All PRs reviewed and merged to `main`
- [ ] CI pipeline passed (lint, test, build, typecheck)
- [ ] Database backups enabled
- [ ] Environment variables configured securely (use secrets manager)
- [ ] CORS configured for production domain
- [ ] SSL certificates provisioned
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up

#### Deployment Steps

1. **Build images**:
   ```bash
   docker build -t amutot-api:v1.0.0 -f apps/api/Dockerfile.api .
   docker build -t amutot-web:v1.0.0 -f apps/web/Dockerfile.web .
   ```

2. **Tag and push**:
   ```bash
   docker tag amutot-api:v1.0.0 your-registry/amutot-api:v1.0.0
   docker tag amutot-web:v1.0.0 your-registry/amutot-web:v1.0.0
   docker push your-registry/amutot-api:v1.0.0
   docker push your-registry/amutot-web:v1.0.0
   ```

3. **Deploy to cluster**:
   - Update image tags in deployment manifests
   - Apply Kubernetes manifests or deploy via CI/CD
   - Verify pods are running: `kubectl get pods`

4. **Database migrations**:
   ```bash
   # Run in a temporary pod or directly
   docker run -e DATABASE_URL=... your-registry/amutot-api:v1.0.0 \
     pnpm prisma migrate deploy
   ```

5. **Verify deployment**:
   - Check API health: `GET /api/v1/health`
   - Check frontend loads: visit app domain
   - Monitor logs for errors
   - Run smoke tests (manual or automated)

#### Rollback
If issues occur after deployment:
```bash
# Revert to previous image version
kubectl set image deployment/amutot-api \
  api=your-registry/amutot-api:v0.9.0

# Wait for rollout to complete
kubectl rollout status deployment/amutot-api
```

### Troubleshooting

#### Database connection errors
```bash
# Check DATABASE_URL is set correctly
echo $DATABASE_URL

# Test connection
docker exec amutot-api psql $DATABASE_URL -c "SELECT 1"

# Check migrations are applied
docker exec amutot-api pnpm prisma migrate status
```

#### Build failures
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build

# Check for TypeScript errors
pnpm typecheck

# Check for lint errors
pnpm lint
```

#### Container won't start
```bash
# View logs
docker logs amutot-api

# Check environment variables
docker inspect amutot-api | grep Env

# Rebuild without cache
docker build --no-cache -t amutot-api:staging -f apps/api/Dockerfile.api .
```

---

## Agent Skills

Reusable commands for common tasks (run with `/command-name` in Claude Code):

| Command | Usage |
|---------|-------|
| `/build-component` | Create a Stitch-based React component with tests and Storybook |
| `/add-module` | Scaffold a full NestJS domain module (controller, service, DTOs) |
| `/add-api-route` | Add a single API endpoint to existing module |
| `/write-test` | Generate unit tests for a source file |
| `/review-pr` | Check PR for security, multi-tenancy, RTL, and test coverage |
| `/migrate-airtable` | Map Airtable table to Prisma schema and generate sync |

---

## Definition of Done

A feature, bug fix, or task is not complete until ALL of the following are true:

- [ ] **TypeScript compiles**: `pnpm typecheck` — zero errors
- [ ] **Linting passes**: `pnpm lint` — zero warnings
- [ ] **Tests pass**: `pnpm test` — all tests pass, 70%+ coverage on changed files
- [ ] **No hardcoded strings**: All UI text is in Hebrew, in i18n/localization file
- [ ] **No `console.log`**: All debug logging removed from production code
- [ ] **Soft deletes used**: No hard deletes — always use `deletedAt` field
- [ ] **Organization scoping**: All backend queries include `organizationId` filter
- [ ] **RTL tested**: UI changes tested with `dir="rtl"` on html element
- [ ] **API documented**: New endpoints have `@ApiOperation` and `@ApiResponse` decorators
- [ ] **PR reviewed**: At least one approval from another team member
- [ ] **CI passed**: GitHub Actions pipeline shows all checks passing

---

## Quick Reference

### Common Tasks

**I want to add a new API endpoint**
1. Update `prisma/schema.prisma` if new data needed
2. Run `pnpm prisma:migrate dev`
3. Add route to NestJS controller
4. Add DTO and validation
5. Implement service method
6. Add Swagger docs
7. Write tests
8. Run `pnpm --filter api test` and `pnpm lint`
9. Commit with `fix:` or `feat:` prefix

**I want to fix a bug**
1. Write a failing test that reproduces the bug
2. Fix the code
3. Verify test now passes
4. Check for related code patterns (may have same bug)
5. Run `pnpm test` to verify no regressions
6. Commit with `fix:` prefix and issue reference

**I want to add Hebrew text**
1. Create or edit `apps/web/i18n/translations.json` (or similar)
2. Add key-value pairs: `{ "donor_list_title": "רשימת תורמים" }`
3. Import i18n hook: `import { useI18n } from '@/hooks/useI18n'`
4. Use in component: `const { t } = useI18n(); return <h1>{t('donor_list_title')}</h1>`
5. Never hardcode text in JSX

**I want to test RTL layout**
1. Open browser DevTools
2. In console: `document.documentElement.dir = 'rtl'`
3. Or edit HTML: `<html dir="rtl">`
4. Check component alignment, spacing, flex direction
5. Use `ms-` (margin-start) instead of `ml-` (margin-left)

---

## Support & Questions

For questions about:
- **Project structure**: See CLAUDE.md
- **Git workflow**: See this file (WORKFLOW.md)
- **Code style**: Run `pnpm lint` and `pnpm format`
- **Testing**: See test files in `**/*.spec.ts`
- **Database**: See `prisma/schema.prisma` and run `pnpm prisma:studio`
- **API docs**: Run `pnpm dev` and visit `http://localhost:3003/api/v1` (Swagger)
