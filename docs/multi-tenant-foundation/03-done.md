# דוח סיום — בסיס Multi-Tenant (Prompt A')

תאריך: 2026-04-20

## קבצים ששונו

| קובץ | שינוי |
|-------|-------|
| `prisma/schema.prisma` | הסרת @unique מ-User.phone, הוספת @@unique([organizationId, phone]), הוספת enum OrganizationStatus, החלפת Organization.isActive ב-status, הוספת role: GroupRole על GroupMembership |
| `apps/api/src/common/prisma/prisma.service.ts` | הוספת Prisma middleware לבידוד שוכרים אוטומטי + ClsService dependency |
| `apps/api/src/app.module.ts` | הוספת ClsModule.forRoot, הוספת TenantInterceptor כ-APP_INTERCEPTOR |
| `apps/api/src/modules/platform/platform.service.ts` | החלפת isActive→status, תיקון toggleStatus signature, תיקון בדיקת ייחודיות טלפון לפי עמותה |
| `apps/api/src/modules/platform/platform.controller.ts` | החלפת @Body('isActive') ב-@Body('status') |
| `apps/api/src/modules/platform/dto/organization-response.dto.ts` | החלפת isActive: boolean ב-status: string |
| `apps/api/src/modules/organization/organization.service.ts` | תיקון mapToDto: isActive→status |
| `apps/api/src/modules/auth/auth.service.ts` | תיקון select: isActive→status על Organization |
| `apps/api/src/common/guards/roles.guard.ts` | הוספת bypass ל-SUPER_ADMIN |
| `prisma/seed.ts` | שכתוב מלא: 2 עמותות, טלפון משותף, GroupRole על memberships |
| `apps/api/package.json` | הוספת nestjs-cls dependency |

## קבצים שנוצרו

| קובץ | תיאור |
|-------|-------|
| `apps/api/src/common/tenant/tenant.constants.ts` | רשימת מודלים tenant-scoped ו-non-tenant |
| `apps/api/src/common/tenant/tenant.interceptor.ts` | NestJS interceptor שמעביר JWT→CLS context |
| `prisma/migrations/20260419211020_multi_tenant_gap_fixes/migration.sql` | SQL migration: phone uniqueness, status enum, GroupRole |
| `apps/api/test/tenant-isolation.e2e-spec.ts` | 13 בדיקות עשן לבידוד שוכרים |
| `apps/api/vitest.config.ts` | הגדרת vitest עם path aliases |

## Migration שנוצר

`20260419211020_multi_tenant_gap_fixes` — מכיל:
1. הסרת unique constraint גלובלי מ-User.phone + הוספת composite unique (organizationId, phone) + index על phone
2. יצירת enum OrganizationStatus, הוספת עמודת status, מיגרציית נתונים מ-isActive, מחיקת isActive ו-index שלו
3. הוספת עמודת role (GroupRole, default MEMBER) ל-GroupMembership

## פלט Seed — טלפונים להתחברות

| תפקיד | טלפון | שם |
|--------|--------|----|
| סופר אדמין | `0501234567` | מנהל פלטפורמה |
| אדמין עמותה A (חסד ואהבה) | `0501234568` | ישראל מנהל |
| אדמין עמותה B (אור לעם) | `0509876543` | אברהם ניהול |

טלפון משותף בין עמותות (הוכחת ייחודיות): `0501234571` (קיים גם ב-A וגם ב-B)

## בדיקות — 13/13 עוברות

```
✓ בידוד שוכרים — אדמין A לא רואה משתמשים/קבוצות/משפחות/תשלומים של B
✓ סופר אדמין — רואה את שתי העמותות ומשתמשים מכולן
✓ ייחודיות טלפון — אותו טלפון בשתי עמותות ללא התנגשות
✓ ייחודיות טלפון — כפילות באותה עמותה נכשלת
✓ GroupRole — מנהלי קבוצות מסומנים MANAGER, חברים MEMBER
✓ סטטוס עמותה — ACTIVE enum, אין שדה isActive
```

## החלטות אוטונומיות (DECISIONS)

1. **DECISION: Migration ידנית** — `prisma migrate dev` דורש TTY אינטראקטיבי ולא רץ ב-non-interactive mode. יצרתי את קובץ ה-SQL ידנית והרצתי דרך `prisma migrate deploy`.

2. **DECISION: Prisma $use middleware במקום $extends** — השתמשתי ב-`$use` middleware (שכבר קיים בקוד בסיס למחיקה רכה) במקום `$extends`, כי: תואם לגרסת Prisma 5.22 הקיימת, עקבי עם הגישה הקיימת, ופשוט יותר ליישום.

3. **DECISION: CLS try/catch fallback** — ב-PrismaService, כשאין CLS פעיל (seed, migration, scripts), הסינון נדלג. זה מאפשר ל-seed ו-scripts לרוץ ללא בעיות בלי לדרוש CLS context.

4. **DECISION: בדיקות spec קיימות לא תוקנו** — `platform.service.spec.ts` ו-`platform.controller.spec.ts` (16 בדיקות) כבר היו שבורים לפני השינויים שלי. ה-mocks לא תואמים ל-API הנוכחי של PlatformService. לא תיקנתי אותם כי הם מחוץ ל-scope.

5. **DECISION: vitest.config.ts נוצר** — לא היה קובץ vitest config באפליקציה. יצרתי אחד עם path aliases (@common, @modules, @) כדי שהבדיקות יוכלו לרוץ עם NestJS path aliases.

## מה דולג (וסיבה)

| פריט | סיבה |
|-------|-------|
| תיקון platform.service.spec.ts / platform.controller.spec.ts | pre-existing failures, 16 בדיקות שבורות לפני השינויים |
| Super Admin endpoints חדשים | Prompt B |
| Super Admin UI | Prompt C |
| הסרת סינון ידני מ-services קיימים | ההוראות קובעות "do NOT remove existing manual organizationId filters" |

## רשימת TODO ל-Prompts הבאים

### Prompt B — Super Admin Backend Endpoints
- [ ] וידוא שכל ה-endpoints הקיימים ב-PlatformController עובדים עם ה-OrganizationStatus enum החדש
- [ ] תיקון ה-16 בדיקות השבורות (platform.service.spec.ts, platform.controller.spec.ts)
- [ ] הוספת ClsService mock ל-unit tests שמשתמשים ב-PrismaService

### Prompt C — Super Admin Frontend Panel
- [ ] דף `/platform-secret/associations` — רשימת עמותות
- [ ] דף `/platform-secret/admins` — ניהול סופר אדמינים
- [ ] טופס יצירת עמותה + מנהל ראשון
- [ ] כפתור שינוי סטטוס (ACTIVE/INACTIVE)
- [ ] דף סקירת פלטפורמה

### תיקונים כלליים שזוהו
- [ ] הוספת בדיקה שעמותה INACTIVE לא מאפשרת login למשתמשיה
- [ ] OrganizationScopeGuard — בדיקה שהעמותה בסטטוס ACTIVE לפני שמאפשרת גישה
- [ ] WeeklyDistributorAssignment.assignedUserId הוא @unique גלובלי — צריך להיות @@unique([groupId, weekKey]) בלבד
