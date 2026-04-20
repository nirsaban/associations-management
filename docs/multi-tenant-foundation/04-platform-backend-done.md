# 04 — Super Admin Platform Module (Backend)

**Status:** DONE
**Date:** 2026-04-20

---

## Files Created / Changed

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/modules/platform/dto/create-organization-with-admin.dto.ts` | Combined DTO for org + first admin creation |
| `apps/api/src/modules/platform/dto/update-organization-status.dto.ts` | DTO with `@IsEnum` for status toggle |
| `apps/api/src/modules/platform/dto/platform-overview-response.dto.ts` | Response DTO for platform overview |
| `apps/api/src/modules/platform/dto/organization-list-response.dto.ts` | DTOs for org list items and detail with counts |
| `apps/api/src/modules/platform/platform.service.spec.ts` | 11 unit tests for service |
| `apps/api/src/modules/platform/platform.controller.spec.ts` | 5 unit tests for controller |
| `apps/api/test/platform.e2e-spec.ts` | E2E test scenarios (documented, placeholder assertions) |

### Modified Files

| File | What Changed |
|------|-------------|
| `apps/api/src/modules/platform/platform.service.ts` | Added `createOrganizationWithAdmin`, `findAllWithCounts`, `findOneWithDetails`, `getOverview`, and private helpers for unpaid counts, weekly order/distributor gaps |
| `apps/api/src/modules/platform/platform.controller.ts` | Rewired to use new service methods; added `GET /platform/overview`; `POST /platform/organizations` now uses combined DTO; `PATCH /:id/status` uses validated DTO |

### Unchanged Files (preserved for backward compat)

| File | Note |
|------|------|
| `apps/api/src/modules/platform/dto/create-organization.dto.ts` | Still used by legacy `POST /platform/organizations` (org-only, no admin) and `PATCH /platform/organizations/:id` |
| `apps/api/src/modules/platform/dto/create-first-admin.dto.ts` | Still used by legacy `POST /platform/organizations/:id/first-admin` |
| `apps/api/src/modules/platform/dto/organization-response.dto.ts` | Still used by legacy wrappers and status toggle response |
| `apps/api/src/modules/platform/platform.module.ts` | No changes needed |
| `apps/api/src/app.module.ts` | PlatformModule was already imported |

---

## Endpoints

All endpoints require `Authorization: Bearer <SUPER_ADMIN JWT>`.
All return `{ data: ... }` or `{ data: ..., meta: ... }` format.
Route prefix: `/api/v1/platform`

### 1. `POST /platform/organizations`

Creates organization + first admin in a single Prisma `$transaction`.

**Request:**
```json
{
  "organization": {
    "name": "עמותת צדקה",
    "slug": "tzedaka-org",
    "contactPhone": "025812345",
    "contactEmail": "info@tzedaka.org.il",
    "address": "רחוב הרב קוק 15, ירושלים"
  },
  "firstAdmin": {
    "fullName": "דוד כהן",
    "phone": "0501234567"
  }
}
```

**Response (201):**
```json
{
  "data": {
    "organization": {
      "id": "clx...",
      "name": "עמותת צדקה",
      "slug": "tzedaka-org",
      "status": "ACTIVE",
      "setupCompleted": false,
      "createdAt": "2026-04-20T..."
    },
    "admin": {
      "id": "clx...",
      "fullName": "דוד כהן",
      "phone": "0501234567"
    }
  }
}
```

**Errors:**
- `409` — slug already exists or phone already exists (Hebrew messages)

### 2. `GET /platform/organizations`

Lists all organizations with counts.

**Query params:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` — filters by name or slug (case-insensitive)
- `status` — `active` | `inactive` | `all` (default: all)

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "עמותת צדקה",
      "slug": "tzedaka-org",
      "status": "ACTIVE",
      "setupCompleted": true,
      "contactPhone": "025812345",
      "contactEmail": "info@tzedaka.org.il",
      "createdAt": "2026-04-20T...",
      "counts": {
        "usersCount": 15,
        "groupsCount": 3,
        "familiesCount": 10,
        "unpaidThisMonthCount": 5
      }
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10
  }
}
```

### 3. `GET /platform/organizations/:id`

Full detail for a single organization.

**Response (200):**
```json
{
  "data": {
    "id": "clx...",
    "name": "עמותת צדקה",
    "slug": "tzedaka-org",
    "status": "ACTIVE",
    "setupCompleted": true,
    "contactPhone": "025812345",
    "contactEmail": "info@tzedaka.org.il",
    "address": "רחוב הרב קוק 15, ירושלים",
    "logoUrl": null,
    "settings": {},
    "createdAt": "2026-04-20T...",
    "updatedAt": "2026-04-20T...",
    "counts": {
      "usersCount": 15,
      "groupsCount": 3,
      "familiesCount": 10,
      "unpaidThisMonthCount": 5
    },
    "admins": [
      {
        "id": "clx...",
        "fullName": "דוד כהן",
        "phone": "0501234567",
        "email": "admin@tzedaka.org.il",
        "registrationCompleted": true
      }
    ]
  }
}
```

### 4. `PATCH /platform/organizations/:id/status`

Toggle organization status.

**Request:**
```json
{
  "status": "INACTIVE"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "clx...",
    "name": "עמותת צדקה",
    "slug": "tzedaka-org",
    "status": "INACTIVE",
    "setupCompleted": true,
    "createdAt": "2026-04-20T...",
    "updatedAt": "2026-04-20T..."
  }
}
```

### 5. `GET /platform/overview`

Platform-wide dashboard numbers in one response.

**Response (200):**
```json
{
  "data": {
    "totalOrganizations": 5,
    "activeOrganizations": 4,
    "inactiveOrganizations": 1,
    "totalUsers": 100,
    "totalAdmins": 5,
    "totalSuperAdmins": 1,
    "totalGroups": 15,
    "totalFamilies": 50,
    "unpaidThisMonthAcrossPlatform": 35,
    "organizationsMissingWeeklyOrdersThisWeek": 2,
    "organizationsMissingWeeklyDistributorThisWeek": 1
  }
}
```

---

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Kept legacy endpoints** (`POST /:id/first-admin`, `PATCH /:id`) alongside new ones | Backward compatibility — existing callers (frontend, tests) don't break. The new `POST /organizations` (with admin) is the preferred path forward. |
| D2 | **Used `user.groupBy` for unpaid counts** | More efficient than fetching all users and filtering in JS. Groups by `organizationId` in a single query. |
| D3 | **`unpaidThisMonthCount` = users WITHOUT a `isPaid=true` MonthlyPaymentStatus for current month** | This counts all active users who haven't paid, not just those with a record set to `isPaid=false`. New users with no record at all are also counted as unpaid. |
| D4 | **"Missing weekly orders" = orgs with groups that have families but zero orders this week** | An org is "missing" if at least one active group has families but no weekly order for the current weekKey. |
| D5 | **"Missing weekly distributor" = orgs with active groups but no distributor assignment this week** | Any active group without a WeeklyDistributorAssignment for the current weekKey counts. |
| D6 | **Error messages in Hebrew** | Per CLAUDE.md spec. Error codes remain HTTP standard (409, 404, etc.). |
| D7 | **Direct instantiation in tests** instead of NestJS TestingModule | Vitest + NestJS TestingModule has path alias resolution issues. Direct `new PlatformService(mockPrisma)` is simpler and equally valid for unit tests. |
| D8 | **E2E test file uses documented scenarios** (placeholder assertions) | No jest-e2e config exists; the project uses vitest. Real E2E tests require a running database. Scenarios are documented for future implementation. |

---

## TODO for Frontend (Prompt C)

### Pages to Build

| Route | Purpose | Endpoint |
|-------|---------|----------|
| `/platform-secret/associations` | Organizations list | `GET /api/v1/platform/organizations` |
| `/platform-secret/associations/new` | Create org + admin form | `POST /api/v1/platform/organizations` |
| `/platform-secret/associations/:id` | Org detail view | `GET /api/v1/platform/organizations/:id` |
| `/platform-secret/admins` | Platform overview dashboard | `GET /api/v1/platform/overview` |

### API Shapes (TypeScript)

```typescript
// POST /platform/organizations — request
interface CreateOrganizationWithAdminRequest {
  organization: {
    name: string;        // required
    slug: string;        // required, kebab-case
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
  };
  firstAdmin: {
    fullName: string;    // required
    phone: string;       // required, 05XXXXXXXX
  };
}

// POST /platform/organizations — response
interface CreateOrganizationWithAdminResponse {
  data: {
    organization: OrganizationResponseDto;
    admin: { id: string; fullName: string; phone: string };
  };
}

// GET /platform/organizations — response
interface OrganizationListResponse {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'INACTIVE';
    setupCompleted: boolean;
    contactPhone?: string;
    contactEmail?: string;
    createdAt: string;
    counts: {
      usersCount: number;
      groupsCount: number;
      familiesCount: number;
      unpaidThisMonthCount: number;
    };
  }>;
  meta: { total: number; page: number; limit: number };
}

// GET /platform/organizations/:id — response
interface OrganizationDetailResponse {
  data: OrganizationListResponse['data'][0] & {
    address?: string;
    logoUrl?: string;
    settings?: Record<string, unknown>;
    updatedAt: string;
    admins: Array<{
      id: string;
      fullName: string;
      phone: string;
      email?: string;
      registrationCompleted: boolean;
    }>;
  };
}

// PATCH /platform/organizations/:id/status — request
interface UpdateStatusRequest {
  status: 'ACTIVE' | 'INACTIVE';
}

// GET /platform/overview — response
interface PlatformOverviewResponse {
  data: {
    totalOrganizations: number;
    activeOrganizations: number;
    inactiveOrganizations: number;
    totalUsers: number;
    totalAdmins: number;
    totalSuperAdmins: number;
    totalGroups: number;
    totalFamilies: number;
    unpaidThisMonthAcrossPlatform: number;
    organizationsMissingWeeklyOrdersThisWeek: number;
    organizationsMissingWeeklyDistributorThisWeek: number;
  };
}
```

### Notes for Frontend Developer

1. All `/platform` routes require SUPER_ADMIN JWT — redirect to login if 401/403.
2. These pages should NOT appear in regular navigation (hidden routes).
3. Status toggle can be a simple switch/button on the org list or detail page.
4. The overview endpoint is a single call — no need to aggregate multiple requests.
5. The `counts` on each org in the list make it possible to show summary cards inline.
6. Error messages from 409 responses are in Hebrew — display them directly to the user.
