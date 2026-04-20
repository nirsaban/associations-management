# 09 — ייבוא קבוצות מ-CSV

תאריך: 2026-04-21

---

## סיכום

ייבוא קבוצות CSV — יכולת עצמאית מייבוא המשתמשים. יוצרת/מעדכנת קבוצות, מקצה מנהלים, מוסיפה חברים, ויוצרת/מקשרת משפחות.

---

## קבצים שנוצרו / שונו

### Backend

- `apps/api/src/modules/csv-import/groups-csv-import.service.ts` — **חדש** — לוגיקת אימות וביצוע ייבוא קבוצות
- `apps/api/src/modules/csv-import/csv-import.controller.ts` — **שונה** — 3 endpoints חדשים (validate, commit, template)
- `apps/api/src/modules/csv-import/csv-import.module.ts` — **שונה** — רישום GroupsCsvImportService
- `apps/api/src/modules/csv-import/groups-csv-import.service.spec.ts` — **חדש** — 9 בדיקות

### Frontend

- `apps/web/src/app/(dashboard)/admin/groups-import/page.tsx` — **חדש** — דף ייבוא קבוצות (5 מצבים)
- `apps/web/src/app/(dashboard)/layout.tsx` — **שונה** — הוספת קישור ניווט "ייבוא קבוצות"

### Dependencies

- `csv-parse` — הותקן ב-apps/api — parser CSV מלא עם תמיכה בשדות במרכאות

---

## Endpoints

### POST `/admin/import/groups/validate`

**Body:** `{ csvContent: string }`

**Response:**
```json
{
  "data": {
    "summary": {
      "totalRows": 2,
      "validRows": 2,
      "rowsWithWarnings": 1,
      "rowsWithErrors": 0,
      "groupsToCreate": 1,
      "groupsToUpdate": 1,
      "familiesToAutoCreate": 1,
      "skippedMemberPhones": 0
    },
    "rows": [
      {
        "rowNumber": 2,
        "groupName": "ביתר א",
        "phoneManager": "+972501234567",
        "members": [{ "phone": "+972501234568", "exists": true }],
        "families": [{ "name": "משפחת כהן", "action": "link_existing" }],
        "status": "valid",
        "warnings": [],
        "errors": []
      }
    ]
  }
}
```

### POST `/admin/import/groups/commit`

**Body:** `{ csvContent: string, rows: [...] }`

**Response:**
```json
{
  "data": {
    "groupsCreated": 1,
    "groupsUpdated": 1,
    "membersAdded": 3,
    "managersAssigned": 2,
    "managersReplaced": 1,
    "familiesCreated": 1,
    "familiesLinked": 2,
    "skippedMemberPhones": [{ "row": 2, "phone": "+972599999999", "reason": "לא נמצא בעמותה" }]
  }
}
```

### GET `/admin/import/groups/template`

מחזיר קובץ CSV עם UTF-8 BOM.

---

## תבנית CSV

```csv
groupName,phoneManager,groupMembers,familiesWhoCare
ביתר א,0501234567,"0501234568,0501234569","משפחת כהן,משפחת לוי"
ביתר ב,0501234571,"0501234572,0501234573","משפחת מזרחי"
```

---

## מטריצת כללי אימות

| מצב | סוג | תוצאה |
|-----|------|--------|
| groupName ריק | שגיאה | שורה נדחית |
| phoneManager ריק | שגיאה | שורה נדחית |
| phoneManager לא תקין | שגיאה | שורה נדחית |
| phoneManager לא קיים בעמותה | שגיאה | שורה נדחית |
| phoneManager מעמותה אחרת | שגיאה | כאילו לא קיים (tenant isolation) |
| חבר לא קיים בעמותה | אזהרה + דילוג | שורה תקינה, חבר ידלג |
| חבר עם טלפון לא תקין | אזהרה + דילוג | שורה תקינה, חבר ידלג |
| שם קבוצה כפול ב-CSV | אזהרה + מיזוג | שורות מוזגות, מנהל אחרון גובר |
| קבוצה קיימת ב-DB | אזהרה | קבוצה תעודכן |
| מנהל קיים שונה ממנהל חדש | אזהרה | מנהל יוחלף |
| משפחה לא קיימת | אוטומטי | משפחה חדשה תיווצר |
| משפחה קיימת בקבוצה אחרת | אזהרה | קישור יוחלף |
| phoneManager מופיע גם ב-groupMembers | שקט | מנוקה כפילות |
| חבר כפול באותה שורה | שקט | מנוקה כפילות |

---

## DECISIONS

1. **DECISION: Family.groupId (one-to-one)** — הסכמה משתמשת ב-`groupId: String?` על Family ולא many-to-many. קישור משפחה הוא החלפת groupId.

2. **DECISION: csv-parse (לא papaparse)** — הותקן `csv-parse` בצד השרת לפרסור CSV עם שדות במרכאות. קל משקל, ללא תלויות.

3. **DECISION: שכפול UI של file drop zone** — הקוד של ה-drop zone שוכפל מדף ייבוא משתמשים. חילוץ לרכיב משותף ידרוש refactor של דף קיים — רשום כ-TODO.

4. **DECISION: commit מאמת מחדש** — ה-commit endpoint מאמת מחדש את ה-CSV (כמו בייבוא משתמשים) כדי למנוע נתונים ישנים.

5. **DECISION: מנהל שהוחלף נהפך ל-MEMBER** — כשמנהל קבוצה מוחלף, ה-GroupMembership הישן שלו עובר מ-MANAGER ל-MEMBER (לא נמחק).

6. **DECISION: phone normalization דו-כיוונית** — ה-map של userByPhone מכיל גם את הפורמט המקורי (`0501234567`) וגם את הפורמט המנורמל (`+972501234567`), כי ה-seed/DB שומרים פורמט שונה.

---

## TODOs ידועים

- [ ] חילוץ רכיב file drop zone משותף לייבוא משתמשים וקבוצות
- [ ] דף `/admin/groups` ו-`/admin/families` (עדיין לא קיימים — לינקים מהסיכום מפנים לשם)
- [ ] ייצוא CSV של קבוצות קיימות
- [ ] ביטול/עריכת ייבוא (rollback)
- [ ] setupCompleted guard גם ב-403 response ברמת SUPER_ADMIN (לא רלוונטי — SA לא נכנס לנתיבי admin)
