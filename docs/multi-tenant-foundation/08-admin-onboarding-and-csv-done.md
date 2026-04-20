# 08 — אשף הגדרות אדמין + ייבוא משתמשים מ-CSV

תאריך: 2026-04-20

---

## סיכום

שתי יכולות חדשות נשלחו יחד:

1. **אשף הגדרות (Onboarding)** — 3 שלבים שאדמין חדש עובר בכניסה ראשונה
2. **ייבוא משתמשים מ-CSV** — כולל אימות, תצוגה מקדימה, שגיאות לפי שורה, ייבוא בטרנזקציה

---

## קבצים שנוצרו / שונו

### Feature 1 — Onboarding

**Backend:**
- `apps/api/src/modules/organization/dto/onboarding-step1.dto.ts` — DTO שלב 1 (שם, כתובת, לוגו, תיאור)
- `apps/api/src/modules/organization/dto/onboarding-step2.dto.ts` — DTO שלב 2 (קישור תרומות, תיאור)
- `apps/api/src/modules/organization/dto/onboarding-step3.dto.ts` — DTO שלב 3 (פרטי קשר)
- `apps/api/src/modules/organization/organization.controller.ts` — 3 endpoints חדשים
- `apps/api/src/modules/organization/organization.service.ts` — 3 שיטות חדשות + verifyAdminAccess
- `apps/api/src/modules/platform/dto/organization-response.dto.ts` — שדות חדשים ב-DTO

**Frontend:**
- `apps/web/src/app/(setup)/setup/organization/page.tsx` — אשף 3 שלבים (הוחלף)

**Schema:**
- `prisma/schema.prisma` — 7 עמודות חדשות ב-Organization

### Feature 2 — CSV Import

**Backend:**
- `apps/api/src/modules/csv-import/csv-import.controller.ts` — endpoints חדשים (validate, commit, template)
- `apps/api/src/modules/csv-import/csv-import.service.ts` — לוגיקת אימות מלאה עם קבוצות ותפקידים
- `apps/api/src/modules/csv-import/csv-import.module.ts` — הוספת PrismaService

**Frontend:**
- `apps/web/src/app/(dashboard)/admin/csv-import/page.tsx` — דף ייבוא מלא (הוחלף)

### שינויים משותפים

- `prisma/seed.ts` — עמותה A עם setupCompleted=false
- `apps/api/src/modules/organization/organization.service.spec.ts` — בדיקות
- `apps/api/src/modules/csv-import/csv-import.service.spec.ts` — בדיקות

---

## מפת Routes

### Onboarding API

| Method | Route | תיאור |
|--------|-------|--------|
| PATCH | `/organization/me/onboarding/step-1` | שם, כתובת, לוגו, תיאור |
| PATCH | `/organization/me/onboarding/step-2` | קישור תרומות, תיאור |
| PATCH | `/organization/me/onboarding/step-3` | פרטי קשר + setupCompleted=true |

### CSV Import API

| Method | Route | תיאור |
|--------|-------|--------|
| POST | `/admin/import/users/validate` | אימות CSV ללא שמירה |
| POST | `/admin/import/users/commit` | ייבוא שורות תקינות בטרנזקציה |
| GET | `/admin/import/users/template` | הורדת תבנית CSV |

### Frontend Routes

| Route | תיאור |
|-------|--------|
| `/setup/organization` | אשף הגדרות (3 שלבים) |
| `/admin/csv-import` | ייבוא משתמשים מ-CSV |

---

## תבנית CSV

```csv
phone,fullName,groupName,role
0501234567,ישראל ישראלי,ביתר א,מנהל קבוצה
0501234568,חיים כהן,ביתר א,חבר קבוצה
0501234569,שרה לוי,,תורם
```

קידוד: UTF-8 with BOM

---

## מטריצת אימות — role × groupName

| groupName | role | תוצאה |
|-----------|------|--------|
| ריק | תורם | משתמש ללא קבוצה (SystemRole=USER, ללא GroupMembership) |
| ריק | חבר קבוצה | שגיאה: "חבר קבוצה חייב שם קבוצה" |
| ריק | מנהל קבוצה | שגיאה: "מנהל קבוצה חייב שם קבוצה" |
| מלא | תורם | שגיאה: "כאשר שם קבוצה מלא, תפקיד חייב להיות חבר קבוצה או מנהל קבוצה" |
| מלא | חבר קבוצה | משתמש + GroupMembership (MEMBER) |
| מלא | מנהל קבוצה | משתמש + GroupMembership (MANAGER) + עדכון managerUserId בקבוצה |

**כללים נוספים:**
- קבוצה חדשה נוצרת אוטומטית אם לא קיימת
- מנהל אחד בלבד לכל קבוצה — שני מנהלים לאותה קבוצה = שגיאה על השורה השנייה
- טלפון כפול באותה עמותה = שגיאה
- טלפון זהה בעמותות שונות = מותר

---

## DECISIONS

1. **Onboarding endpoints נוספו לתוך OrganizationModule הקיים** — לא נוצר מודול חדש כי ה-context (organization/me) זהה.
2. **Route /setup/organization נשמר** (כפי שכבר מוגדר ב-middleware) במקום /onboarding — קבוע ב-middleware שכבר קיים.
3. **שדה adminPhone מתמלא מ-`GET /auth/me`** — במקום לשנות את ה-organization endpoint.
4. **CSV validate + commit שניהם שולחים את ה-csvContent** — commit מאמת מחדש לפני כתיבה (prevent stale data).
5. **אשף הגדרות הישן הוחלף** — הקוד הקודם היה boilerplate עם slug+logo+settings; הוחלף ב-3 שלבים לפי הספק.
6. **PrismaService נוסף ישירות ל-CsvImportModule** — הקונטרולר צריך לבדוק setupCompleted.

---

## TODOs ידועים

- [ ] העלאת לוגו כקובץ (כרגע MVP עם URL string בלבד)
- [ ] תמיכה במספר אדמינים לעמותה
- [ ] ייבוא CSV למשפחות עם כללי אימות דומים
- [ ] שליחת SMS/הודעה למשתמשים מיובאים (כרגע ייבוא שקט)
- [ ] MonthlyPaymentStatus ליוזרים מיובאים (כרגע לא נוצר)
