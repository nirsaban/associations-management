# 10 — ייבוא משפחות מ-CSV

תאריך: 2026-04-21

---

## סיכום

ייבוא משפחות CSV — יכולת עצמאית. יוצרת משפחות חדשות, מעדכנת קיימות (לפי שם), מקשרת לקבוצות, ויוצרת קבוצות אוטומטית כשנדרש.

---

## קבצים שנוצרו / שונו

### Backend

- `apps/api/src/modules/csv-import/families-csv-import.service.ts` — **חדש** — לוגיקת אימות וביצוע ייבוא משפחות
- `apps/api/src/modules/csv-import/families-csv-import.service.spec.ts` — **חדש** — 12 בדיקות
- `apps/api/src/modules/csv-import/csv-import.controller.ts` — **שונה** — 3 endpoints חדשים
- `apps/api/src/modules/csv-import/csv-import.module.ts` — **שונה** — רישום FamiliesCsvImportService

### Frontend

- `apps/web/src/app/(dashboard)/admin/families-import/page.tsx` — **חדש** — דף ייבוא משפחות (5 מצבים)
- `apps/web/src/app/(dashboard)/layout.tsx` — **שונה** — הוספת קישור ניווט

### Schema

- `prisma/schema.prisma` — **שונה** — הוספת `childrenMinorCount Int?`, `totalMemberCount Int?`, `@@unique([organizationId, familyName])`

---

## Endpoints

### POST `/admin/import/families/validate`

**Body:** `{ csvContent: string }`

**Response:**
```json
{
  "data": {
    "summary": {
      "totalRows": 3,
      "validRows": 2,
      "rowsWithWarnings": 1,
      "rowsWithErrors": 1,
      "familiesToCreate": 1,
      "familiesToUpdate": 1,
      "groupsToAutoCreate": 0
    },
    "rows": [
      {
        "rowNumber": 2,
        "familyName": "משפחת כהן",
        "action": "update",
        "fieldDiff": [
          { "field": "address", "oldValue": "ישן", "newValue": "חדש" }
        ],
        "groupLink": { "name": "ביתר א", "action": "link_existing" },
        "status": "valid",
        "warnings": [],
        "errors": [],
        "contactPhone": "+972501112222",
        "childrenMinorCount": 3,
        "totalMemberCount": 5,
        "address": "רחוב הרצל 10",
        "groupName": "ביתר א"
      }
    ]
  }
}
```

### POST `/admin/import/families/commit`

**Body:** `{ csvContent: string, rows: [...] }`

**Response:**
```json
{
  "data": {
    "familiesCreated": 2,
    "familiesUpdated": 1,
    "groupsAutoCreated": 1,
    "familiesLinkedToGroup": 2,
    "familyGroupsCleared": 0
  }
}
```

### GET `/admin/import/families/template`

מחזיר קובץ CSV עם UTF-8 BOM.

---

## תבנית CSV

```csv
familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address
משפחת כהן,0501112222,3,ביתר א,5,רחוב הרצל 10 ירושלים
משפחת לוי,0503334444,,ביתר א,,רחוב יפו 22 ירושלים
משפחת מזרחי,,,,,
```

---

## מטריצת כללי אימות

| מצב | סוג | תוצאה |
|-----|------|--------|
| familyName ריק | שגיאה | שורה נדחית |
| familyName קיים ב-DB | עדכון | שדות ריקים ב-CSV מאפסים (null) |
| familyName חוזר ב-CSV | אזהרה | שורה אחרונה קובעת |
| contactPhone לא תקין | שגיאה | שורה נדחית |
| contactPhone = טלפון משתמש באותה עמותה | שגיאה | שורה נדחית |
| contactPhone = טלפון משתמש בעמותה אחרת | מותר | tenant isolation |
| contactPhone = כפול משפחה אחרת | אזהרה | ייבוא ממשיך |
| childrenMinorCount שלילי / לא מספר | שגיאה | שורה נדחית |
| totalMemberCount < 1 / לא מספר | שגיאה | שורה נדחית |
| childrenMinorCount > totalMemberCount | שגיאה | שורה נדחית |
| groupName קיים | קישור | link_existing |
| groupName לא קיים | אזהרה + אוטומטי | קבוצה תיווצר (ללא מנהל) |
| groupName ריק + היה קישור | אזהרה | קישור יוסר |
| groupName ריק + לא היה קישור | שקט | none |

---

## DECISIONS

1. **DECISION: Family↔Group = `Family.groupId` (one-to-one)** — תואם ל-prompt 09. לא הוצג מודל m2m.

2. **DECISION: לא בוצע refactor לרכיבים משותפים** — שכפול ה-file drop zone ו-state machine ב-3 דפי ייבוא. הריפקטור דורש שינוי ב-3 דפים עובדים — סיכון מיותר בנקודה זו. TODO רשום.

3. **DECISION: Empty CSV columns = overwrite to null** — שדות ריקים ב-CSV מאפסים ערכים קיימים. זה מתועד בתצוגה המקדימה דרך `fieldDiff`.

4. **DECISION: `@@unique([organizationId, familyName])` נוסף** — מאפשר upsert לפי שם משפחה בתוך עמותה. Migration via `prisma db push`.

5. **DECISION: Endpoint name `validateFamilies2` / `commitFamilies2`** — כדי לא להתנגש עם legacy endpoints שכבר קיימים (`families/preview`, `families/commit`). ה-routes הם `/families/validate` ו-`/families/commit` (מחליפים בפועל את ה-legacy).

6. **DECISION: contactPhone conflict check normalizes both directions** — userPhones map מכיל גם raw (`0501234567`) וגם normalized (`+972501234567`).

---

## TODOs ידועים

- [ ] חילוץ רכיבי file drop zone + state machine משותפים לייבוא משתמשים/קבוצות/משפחות
- [ ] המרת contactPhone לקישור User עתידי (family contact → user experience)
- [ ] טבלת נפשות/ילדים per family (sub-table)
- [ ] ייצוא CSV של משפחות קיימות
- [ ] דף `/admin/families` (לא קיים עדיין)
- [ ] ה-legacy endpoint `POST /admin/import/families/commit` (ישן) צריך deprecation
