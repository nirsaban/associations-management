# 06 — Frontend ↔ Backend Alignment Fix — Done

**Status:** DONE
**Date:** 2026-04-20

---

## סיכום

יישור 4 חוסרי-התאמה בין הפרונטנד (Prompt C) לבאקנד (Prompt B).
הבאקנד הוא מקור האמת — כל שינוי נעשה בצד הפרונטנד בלבד.

---

## קבצים ששונו

| קובץ | סיבה |
|---|---|
| `apps/web/src/hooks/usePlatform.ts` | שכתוב טייפים, הוספת `useOverview`, שינוי mutation ליצירת עמותה לקריאה אטומית אחת |
| `apps/web/src/app/platform/page.tsx` | שימוש ב-`GET /platform/overview` במקום חישוב client-side |
| `apps/web/src/app/platform/organizations/page.tsx` | הצגת counts אמיתיים מ-response במקום placeholder "—" |
| `apps/web/src/app/platform/organizations/new/page.tsx` | שליחת `{ organization, firstAdmin }` בקריאה אחת |
| `apps/web/src/app/platform/organizations/[id]/page.tsx` | שימוש ב-`admins[]` array ו-`counts` אמיתיים |

---

## FIX 1 — יצירת עמותה בקריאה אחת (CRITICAL)

**לפני:** הפרונטנד שלח 2 קריאות ברצף — `POST /platform/organizations` ואז `POST /platform/organizations/:id/first-admin`. אם הקריאה השנייה נכשלה, העמותה נוצרה ללא אדמין.

**אחרי:** הפרונטנד שולח קריאה אחת `POST /platform/organizations` עם body:
```json
{
  "organization": { "name", "slug", "contactPhone?", "contactEmail?", "address?" },
  "firstAdmin": { "fullName", "phone" }
}
```
הבאקנד מבצע `$transaction` אטומי. הצלחה → redirect + toast. שגיאת 409 → שגיאה inline.

**שינויים:**
- `usePlatform.ts`: `useCreateOrganizationWithAdmin` שולח body אחד ל-endpoint אחד
- `new/page.tsx`: שדה `admin` שונה ל-`firstAdmin`, נוסף `address` ל-request

---

## FIX 2 — דשבורד עם /platform/overview

**לפני:** הדשבורד שלף `GET /platform/organizations` וחישב סטטיסטיקות client-side. 5 כרטיסים הציגו "—" וכרטיסי התראה הציגו placeholder.

**אחרי:** הדשבורד שולף `GET /platform/overview` שמחזיר 11 מספרים מצטברים. כל 8 כרטיסי הסטטיסטיקה מציגים ערכים אמיתיים. 2 כרטיסי ההתראה מציגים:
- `organizationsMissingWeeklyOrdersThisWeek` — "X עמותות ללא הזמנות שבועיות השבוע"
- `organizationsMissingWeeklyDistributorThisWeek` — "X עמותות ללא מחלק שבועי השבוע"

**שינויים:**
- `usePlatform.ts`: hook חדש `useOverview()` עם טייפ `PlatformOverview`
- `page.tsx`: שכתוב מלא — import של `useOverview` במקום `useOrganizations`

---

## FIX 3 — Counts אמיתיים בטבלת עמותות

**לפני:** עמודות משתמשים/קבוצות/משפחות/לא-שילמו הציגו "—" כי ה-DTO הישן לא כלל counts.

**אחרי:** הטייפ `OrganizationListItem` כולל `counts: { usersCount, groupsCount, familiesCount, unpaidThisMonthCount }`. הטבלה מציגה את המספרים. `unpaidThisMonthCount > 0` מודגש באדום.

**שינויים:**
- `usePlatform.ts`: טייפ `OrganizationListItem` עם `counts` nested object
- `organizations/page.tsx`: 4 תאי "—" הוחלפו ב-`org.counts.*`, סוג ה-prop `OrganizationDto` → `OrganizationListItem`

---

## FIX 4 — Counts אמיתיים + admins מערך בעמוד פרטים

**לפני:** עמוד הפרטים השתמש ב-`firstAdmin?` (אובייקט בודד) ו-CountCards עם "—".

**אחרי:** הטייפ `OrganizationDetail` כולל `admins: AdminEntry[]` (מערך) ו-`counts`. CountCards מציגים ערכים אמיתיים. מנהלים מוצגים כרשימה (לא רק ראשון). שדות `phone`/`email` מתאימים לשמות הבאקנד (`contactPhone`/`contactEmail`).

**שינויים:**
- `usePlatform.ts`: טייפים `OrganizationDetail` ו-`AdminEntry`
- `[id]/page.tsx`: שכתוב מלא — לולאה על `org.admins`, counts אמיתיים, שדות `contactPhone`/`contactEmail`

---

## DECISIONS

| # | החלטה | סיבה |
|---|---|---|
| D1 | שמירת backward-compat ב-`usePlatform()` | דפי `/platform-secret/` הישנים עדיין קיימים ומשתמשים ב-legacy types עם `isActive: boolean` |
| D2 | `unpaidThisMonthCount > 0` מודגש באדום | ברור ויזואלית — מספר חיובי = דורש תשומת לב |
| D3 | מערך `admins[]` מוצג כרשימה עם cards | הבאקנד מחזיר מערך, לא אובייקט בודד — תומך בעתיד במספר מנהלים |

---

## אימות

- `npx tsc --noEmit --project apps/web/tsconfig.json` — עובר ללא שגיאות
- אין שינוי בקבצי באקנד
- אין שינוי ב-layout, auth guard, toast, או middleware

---

## מעבר מנטלי על 4 הזרימות

### 1. יצירת עמותה
סופר אדמין → `/platform/organizations/new` → ממלא שם + slug + אדמין ראשון → submit → `POST /platform/organizations` עם `{ organization, firstAdmin }` → 201 → redirect + toast "עמותה נוצרה ואדמין ראשון נוסף" → מגיע ל-`/platform/organizations` → רואה את העמותה החדשה ברשימה עם counts=0

### 2. דשבורד סקירה כללית
סופר אדמין → `/platform` → `GET /platform/overview` → רואה 8 כרטיסי סטטיסטיקה עם מספרים אמיתיים + 2 כרטיסי התראה עם מספרי עמותות חסרות

### 3. רשימת עמותות
סופר אדמין → `/platform/organizations` → `GET /platform/organizations` → טבלה עם שם, slug, סטטוס, משתמשים, קבוצות, משפחות, לא-שילמו (מספרים אמיתיים), תאריך, פעולות → toggle סטטוס → PATCH → optimistic update → צפייה → navigate to detail

### 4. פרטי עמותה
סופר אדמין → `/platform/organizations/:id` → `GET /platform/organizations/:id` → פרטי עמותה (שדות read-only) + toggle סטטוס + רשימת מנהלים (cards) + נתונים (4 count cards עם מספרים אמיתיים) + חזור לרשימה
