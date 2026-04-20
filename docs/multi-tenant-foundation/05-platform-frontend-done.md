# 05 — Super Admin Panel Frontend — Done

תאריך: 2026-04-20

## סיכום

בניית פאנל סופר אדמין מלא תחת `/platform` — דשבורד, רשימת עמותות, יצירת עמותה חדשה עם אדמין ראשון, ועמוד פרטי עמותה.

---

## קבצים שנוצרו

| קובץ | תיאור |
|---|---|
| `apps/web/src/app/platform/layout.tsx` | Layout עם nav bar, auth guard (SUPER_ADMIN בלבד), logout, RTL |
| `apps/web/src/app/platform/page.tsx` | דשבורד סקירה כללית — 8 כרטיסי סטטיסטיקה + 2 כרטיסי התראה |
| `apps/web/src/app/platform/organizations/page.tsx` | רשימת עמותות — טבלה עם toggle סטטוס ומעבר לפרטים |
| `apps/web/src/app/platform/organizations/new/page.tsx` | יצירת עמותה — טופס עם פרטי עמותה + אדמין ראשון |
| `apps/web/src/app/platform/organizations/[id]/page.tsx` | פרטי עמותה — פרטים, סטטוס, רשימת מנהלים, נתונים |
| `apps/web/src/components/ui/Toast.tsx` | רכיב Toast מינימלי עם Context Provider |

## קבצים ששונו

| קובץ | שינוי |
|---|---|
| `apps/web/src/middleware.ts` | הוספת `/platform` כ-prefix מותר ל-SUPER_ADMIN; הפניית login ל-`/platform` |
| `apps/web/src/hooks/usePlatform.ts` | הוספת hooks חדשים (`useOrganizations`, `useOrganization`, `useCreateOrganizationWithAdmin`, `useToggleOrganizationStatus`) עם תיקון ל-API shape; שמירת backward-compat עבור platform-secret |
| `apps/web/src/app/(auth)/login/_components/OtpVerification.tsx` | הפניית SUPER_ADMIN ל-`/platform` במקום `/platform-secret/admins` |
| `apps/web/src/app/(dashboard)/page.tsx` | הפניית SUPER_ADMIN ל-`/platform` |
| `apps/web/src/app/(dashboard)/layout.tsx` | עדכון nav link וredirect של SUPER_ADMIN ל-`/platform` |

---

## תיאור מסכים

### 1. `/platform` — דשבורד סקירה כללית
- 8 כרטיסי סטטיסטיקה בגריד: סה"כ עמותות, פעילות, לא פעילות, + 5 placeholders (משתמשים, מנהלים, קבוצות, משפחות, לא שילמו) שמציגים "—"
- 2 כרטיסי התראה: הזמנות שבועיות חסרות + מחלקים שבועיים חסרים (placeholder)
- לינק "נהל עמותות" בכותרת

### 2. `/platform/organizations` — רשימת עמותות
- טבלה עם עמודות: שם, Slug, סטטוס (badge), משתמשים/קבוצות/משפחות/לא שילמו (placeholder), תאריך הקמה, פעולות
- פעולות שורה: toggle סטטוס (optimistic update + rollback), צפייה
- כפתור "+ עמותה חדשה" בכותרת

### 3. `/platform/organizations/new` — יצירת עמותה
- טופס בשני חלקים: פרטי עמותה (שם, slug עם auto-suggest, טלפון, אימייל, כתובת) + אדמין ראשון (שם, טלפון)
- ולידציה: שדות חובה, פורמט טלפון ישראלי, slug format
- שגיאת 409 slug → שגיאה inline בשדה slug
- הצלחה → redirect + toast

### 4. `/platform/organizations/[id]` — פרטי עמותה
- פרטי עמותה (read-only): שם, slug, סטטוס, הקמה, טלפון, אימייל, כתובת, תאריך
- כפתור toggle סטטוס
- רשימת מנהלים (שם + טלפון + סטטוס רישום)
- נתונים (placeholder)
- לינק "חזור לרשימה"

---

## DECISIONS

1. **אין endpoint `/platform/overview` בבאקנד** — הדשבורד מחשב סטטיסטיקות מרשימת העמותות (client-side). עמודות שדורשות נתונים חסרים (משתמשים, קבוצות, משפחות, לא שילמו) מציגות "—". כרטיסי התראה מציגים placeholder.

2. **עדכון middleware** — נוספה תמיכה ב-`/platform` prefix ל-SUPER_ADMIN. כל ההפניות עודכנו מ-`/platform-secret/admins` ל-`/platform`.

3. **Toast component** — נוצר רכיב Toast מינימלי עם React Context (`ToastProvider` + `useToast`). תומך ב-success/error/info. Auto-dismiss אחרי 3.5 שניות עם animation.

4. **תיקון toggleStatus API** — הבאקנד מצפה ל-`{ status: 'ACTIVE' | 'INACTIVE' }` אבל ה-hook הישן שלח `{ isActive: boolean }`. נוצר hook חדש `useToggleOrganizationStatus` עם ה-shape הנכון. ה-hook הישן `usePlatform()` נשמר עם backward-compat.

5. **יצירת עמותה = 2 API calls** — הטופס שולח `POST /platform/organizations` ואז `POST /platform/organizations/:id/first-admin` ברצף. אם הראשון מצליח והשני נכשל, העמותה נוצרת ללא אדמין (ניתן להוסיף אחר כך).

6. **Backward compatibility** — ה-hook `usePlatform()` נשמר עם mapping ל-legacy types (`isActive: boolean`) כדי לא לשבור את דפי `/platform-secret/` הקיימים.

---

## Known TODOs

- [ ] Backend: endpoint `GET /platform/overview` שמחזיר סטטיסטיקות מרוכזות (total users, admins, groups, families, unpaid, orgs without weekly orders/distributors)
- [ ] Backend: endpoint `GET /platform/organizations/:id/stats` שמחזיר counts per org
- [ ] הוספת pagination לטבלת עמותות (כרגע מביא 100 ראשונות)
- [ ] הוספת search/filter לטבלת עמותות
- [ ] עריכת פרטי עמותה (כרגע read-only)
- [ ] הוספת אדמין נוסף מעמוד פרטי עמותה
- [ ] הוספת logo upload בטופס יצירת עמותה
- [ ] ניקוי ומיזוג דפי `/platform-secret/` לתוך `/platform/`
- [ ] מעבר מ-`console.log` ל-logger בקוד login flow
