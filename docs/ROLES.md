# Roles & Permissions — תפקידים והרשאות

Single source of truth for who can do what.
If a new capability is added to the product, its row is added here **before** implementation.

Legend: ✅ allowed · ❌ not allowed · 🟡 allowed with condition (see notes)

---

## Role reminder

| Code | Hebrew | Scope | Key rule |
|---|---|---|---|
| `SUPER_ADMIN` | סופר אדמין | Platform (across all organizations) | Never acts as ADMIN of any organization |
| `ADMIN` | אדמין | One organization | Zero visibility into any other organization |
| `GROUP_MANAGER` | מנהל קבוצה | One group | Works only within own group |
| `GROUP_MEMBER` | חבר קבוצה | One group | May be assigned the Weekly Distributor state |
| `REGULAR_USER` | משתמש רגיל | One organization, no group | Self-service only |

Weekly Distributor is a **state** of a Group Member, not a role. Rotates weekly.

A single user can simultaneously be `REGULAR_USER` + `GROUP_MEMBER` + `GROUP_MANAGER` + the current week's `WEEKLY_DISTRIBUTOR`. UI shows the most relevant context; backend evaluates every action against all applicable scopes.

---

## Platform management

| Capability | SUPER_ADMIN | ADMIN | GROUP_MANAGER | GROUP_MEMBER | REGULAR_USER |
|---|:-:|:-:|:-:|:-:|:-:|
| Create organization + first admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Activate / deactivate organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| View list of all organizations | ✅ | ❌ | ❌ | ❌ | ❌ |
| View platform-wide overview / stats | ✅ | ❌ | ❌ | ❌ | ❌ |
| Full CRUD on any entity in any organization | ✅ | ❌ | ❌ | ❌ | ❌ |

## Organization management (within own organization)

| Capability | SUPER_ADMIN | ADMIN | GROUP_MANAGER | GROUP_MEMBER | REGULAR_USER |
|---|:-:|:-:|:-:|:-:|:-:|
| View association-wide overview | ✅ | ✅ | ❌ | ❌ | ❌ |
| Import users / families / groups via CSV | ✅ | ✅ | ❌ | ❌ | ❌ |
| CRUD users in own org | ✅ | ✅ | ❌ | ❌ | ❌ |
| CRUD groups in own org | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign a manager to a group | ✅ | ✅ | ❌ | ❌ | ❌ |
| CRUD families in own org | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign family to a group | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all payments in own org | ✅ | ✅ | ❌ | ❌ | ❌ |
| View reminder history for any user in own org | ✅ | ✅ | ❌ | ❌ | ❌ |
| Monitor weekly completion across all groups | ✅ | ✅ | ❌ | ❌ | ❌ |

## Group management (within own group only)

| Capability | SUPER_ADMIN | ADMIN | GROUP_MANAGER | GROUP_MEMBER | REGULAR_USER |
|---|:-:|:-:|:-:|:-:|:-:|
| View own group dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| View group members | ✅ | ✅ | ✅ | 🟡 (1) | ❌ |
| View group families | ✅ | ✅ | ✅ | ❌ | ❌ |
| Fill weekly order per family | ✅ | ✅ | ✅ (own group) | ❌ | ❌ |
| Update weekly order per family | ✅ | ✅ | ✅ (own group) | ❌ | ❌ |
| Assign weekly distributor | ✅ | ✅ | ✅ (own group) | ❌ | ❌ |
| View paid/unpaid status of members in own group | ❌ (2) | ✅ | ✅ (own group) | ❌ | ❌ |
| View families outside own group | ✅ | ✅ | ❌ | ❌ | ❌ |

Notes:
1. Group members may see basic group context (name, members list) — no operational data.
2. SUPER_ADMIN sees payment data at platform scope, not at group scope — they don't operate at group scope by design.

## Weekly distribution (temporary state)

| Capability | Weekly Distributor | non-distributor group member |
|---|:-:|:-:|
| See "you are this week's distributor" card | ✅ | ❌ |
| See relevant families with addresses + contacts | ✅ | ❌ |
| See weekly order details per family (read-only) | ✅ | ❌ |
| Modify weekly orders | ❌ | ❌ |
| Assign another distributor | ❌ | ❌ |

## Personal capabilities (every active user)

| Capability | SUPER_ADMIN | ADMIN | GROUP_MANAGER | GROUP_MEMBER | REGULAR_USER |
|---|:-:|:-:|:-:|:-:|:-:|
| Log in via phone + OTP | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own basic info | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage own push subscription | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own monthly payment status | 🟡 (3) | ✅ | ✅ | ✅ | ✅ |
| Pay monthly dues | 🟡 (3) | ✅ | ✅ | ✅ | ✅ |
| Choose group at onboarding | ❌ | ❌ | ❌ (auto-set) | ✅ (once) | ✅ (once) |

Notes:
3. SUPER_ADMIN has no organizationId and no payment obligation. The monthly payment experience is hidden for this role.

---

## Data isolation rules (non-negotiable)

1. Every tenant-scoped query is filtered by `organizationId` via the Prisma extension. SUPER_ADMIN requests bypass the filter.
2. `ADMIN` of organization A cannot read, list, create, update, or delete anything belonging to organization B — attempts return 403 or empty results.
3. `GROUP_MANAGER` of group G cannot operate on any group other than G, even within the same organization.
4. Weekly Distributor sees only delivery-relevant data for the current week's assignment.
5. No role except `SUPER_ADMIN` can ever cross organization boundaries.

## How to add a new capability

1. Add the row to the correct table above with ✅ / ❌ / 🟡 for every role.
2. If it crosses scopes (e.g. admin-level but also exposed to group manager), add a clarifying note.
3. Only then implement the endpoint / UI. Controller guards must match this table exactly.