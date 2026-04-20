# Glossary — מילון מונחים

Single source of truth for terminology. If a term appears in code, UI, docs, or prompts, it must match this file.

Update when a new concept is introduced. Never invent synonyms.

---

## Entities

| Code (English) | UI (Hebrew) | Definition |
|---|---|---|
| Organization | עמותה | A tenant. A self-contained association using the platform. |
| User | משתמש | A person in an organization. Identified by phone within that organization. |
| Group | קבוצה | A distribution group inside an organization. Handles one or more families. |
| Group Membership | חברות בקבוצה | The link between a user and a group they belong to. |
| Family | משפחה | A supported family, handled by one group. Has delivery information. |
| Weekly Order | הזמנה שבועית | One order per family, per week. Filled by the group manager. |
| Weekly Distributor Assignment | שיוך מחלק שבועי | Temporary weekly assignment of one group member as distributor. |
| Payment | תשלום | A monthly payment from a user to the organization. |
| Monthly Payment Status | סטטוס תשלום חודשי | Whether a user paid for a given month. UI-facing status. |
| Payment Reminder | תזכורת תשלום | Reminder sent to a user who has not paid this month. Up to 3 per month. |
| Notification | התראה | Personal or operational alert shown to a user. |
| Push Subscription | מנוי Push | Opt-in device registration for push notifications. |
| OTP Code | קוד חד-פעמי | One-time code used for phone login verification. |

## Roles

| Code | Hebrew | Scope |
|---|---|---|
| PlatformRole.SUPER_ADMIN | סופר אדמין | Platform-level. Above all organizations. |
| SystemRole.ADMIN | אדמין | Organization-level. Manages one organization. |
| SystemRole.USER | משתמש רגיל / חבר קבוצה | Organization-level. Regular user or group member. |
| GroupRole.MANAGER | מנהל קבוצה | Group-level. On `GroupMembership.role`. |
| GroupRole.MEMBER | חבר קבוצה | Group-level. On `GroupMembership.role`. |

## States (not roles)

| Code / Concept | Hebrew | Definition |
|---|---|---|
| Weekly Distributor | מחלק שבועי | A temporary weekly state of a group member. Not a permanent role. Stored on `WeeklyDistributorAssignment`. |
| Organization Status | סטטוס עמותה | `ACTIVE` (פעיל) / `INACTIVE` (לא פעיל). Controlled by `SUPER_ADMIN`. |
| Monthly Payment Status | סטטוס תשלום חודשי | Paid (שולם) / Unpaid (לא שולם) / Reminder sent (נשלחה תזכורת). |

## Scope words — never mix these three

| Term | Hebrew | Who operates at this scope |
|---|---|---|
| platform-wide | רמת פלטפורמה | SUPER_ADMIN — across all organizations |
| association-wide | רמת עמותה | ADMIN — inside one organization |
| group-wide | רמת קבוצה | GROUP_MANAGER — inside one group |

❌ **Banned phrase:** "system-wide" — too ambiguous. Always pick one of the three above.

## Banned / deprecated terms

| Don't use | Use instead |
|---|---|
| Distribution Group / קבוצת חלוקה | Group / קבוצה |
| system-wide | platform-wide / association-wide / group-wide |
| Association (in code) | Organization (code) — Association is UI/Hebrew only |
| Tenant (in UI) | עמותה — "tenant" is a code/architecture concept only |

## Key identifiers

| Field | Rule |
|---|---|
| `User.phone` | Unique **within** an organization (`@@unique([organizationId, phone])`). Never globally unique. |
| `Organization.slug` | Unique globally across the platform. |
| `organizationId` | Present on every tenant-scoped model. Nullable only on `User` for `SUPER_ADMIN`. |

---

When adding a new concept: add the row to the right table here **before** using it in code or UI.