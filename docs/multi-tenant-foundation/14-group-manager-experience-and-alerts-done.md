# 14 — חוויית מנהל קבוצה והתראות

תאריך: 2026-04-21

---

## סיכום

נבנתה חוויית מנהל הקבוצה המלאה — 4 עמודים עיקריים + 2 עמודי משנה + פיצ'ר התראות חוצה-תפקידים.
מנהל הקבוצה הוא גם תורם, ולכן ממשק שלו כולל גם את משטחי התרומה.

---

## קבצים שנוצרו / שונו

### סכמה ומיגרציה

| קובץ | פעולה |
|---|---|
| `prisma/schema.prisma` | הוספת `AlertAudience` enum, מודל `Alert`, הסרת `@unique` מ-`assignedUserId` ב-`WeeklyDistributorAssignment`, שינוי יחס User מ-one-to-one ל-one-to-many |
| `apps/api/src/common/tenant/tenant.constants.ts` | הוספת `Alert` ל-`TENANT_SCOPED_MODELS` |

### בקאנד — מודול התראות (חדש)

| קובץ | תיאור |
|---|---|
| `apps/api/src/modules/alerts/alerts.module.ts` | מודול NestJS |
| `apps/api/src/modules/alerts/alerts.controller.ts` | 4 endpoints: POST/GET/DELETE admin, GET /me/alerts |
| `apps/api/src/modules/alerts/alerts.service.ts` | לוגיקה עסקית + שליחת push notifications |
| `apps/api/src/modules/alerts/dto/create-alert.dto.ts` | DTO לייצור התראה |
| `apps/api/src/modules/alerts/dto/index.ts` | barrel export |
| `apps/api/src/app.module.ts` | הוספת AlertsModule |

### בקאנד — הרחבת מודול Manager

| קובץ | פעולה |
|---|---|
| `apps/api/src/modules/manager/manager.controller.ts` | הוספת 9 endpoints חדשים |
| `apps/api/src/modules/manager/manager.service.ts` | הוספת methods: getWeeklyStatus, updateFamily, getFamilyWeeklyOrder, upsertFamilyWeeklyOrder, getMembersWithPaymentStatus, getDistributorWorkload, getGroupRevenue, getDonationInfo, getMyPaymentsWithStatus |
| `apps/api/src/modules/manager/dto/update-family.dto.ts` | DTO לעדכון משפחה (5 שדות מותרים בלבד) |
| `apps/api/src/modules/manager/dto/upsert-weekly-order.dto.ts` | DTO ל-upsert הזמנה |
| `apps/api/src/modules/manager/dto/index.ts` | barrel export מעודכן |

### פרונטאנד — עמודי מנהל קבוצה

| קובץ | תיאור |
|---|---|
| `apps/web/src/app/(dashboard)/manager/dashboard/page.tsx` | דף הבית — ברכה, כפתורי משימות שבועיות, iframe תרומה, התראות |
| `apps/web/src/app/(dashboard)/manager/my-group/page.tsx` | הקבוצה שלי — סטטיסטיקות, חברים, עומס מחלקים, תרשים הכנסות |
| `apps/web/src/app/(dashboard)/manager/families/page.tsx` | המשפחות שלי — כרטיסים מתרחבים עם עריכה inline |
| `apps/web/src/app/(dashboard)/manager/my-donations/page.tsx` | התרומות שלי — סטטוס חודשי, iframe, היסטוריה |
| `apps/web/src/app/(dashboard)/manager/weekly-orders/page.tsx` | מילוי קניות — textarea במודל/bottom sheet |
| `apps/web/src/app/(dashboard)/manager/weekly-distributor/page.tsx` | מינוי מחלק — בחירה מחברי קבוצה + היסטוריה |
| `apps/web/src/app/(dashboard)/layout.tsx` | עדכון ניווט GROUP_MANAGER + הוספת alerts לאדמין |
| `apps/web/src/lib/constants.ts` | הוספת MANAGER ו-ALERTS routes |

### פרונטאנד — התראות אדמין

| קובץ | תיאור |
|---|---|
| `apps/web/src/app/(dashboard)/admin/alerts/page.tsx` | ניהול התראות — יצירה, רשימה, מחיקה |

### תיעוד

| קובץ | פעולה |
|---|---|
| `docs/ROLES.md` | הוספת הרשאות: alerts, family edit, workload, revenue |
| `docs/multi-tenant-foundation/14-group-manager-experience-and-alerts-done.md` | קובץ זה |

---

## Endpoints חדשים

### מנהל קבוצה (Manager)

| Method | Path | תיאור |
|---|---|---|
| GET | `/manager/group/weekly-status?weekKey=` | סטטוס תפעולי שבועי מלא |
| PATCH | `/manager/group/families/:familyId` | עדכון מטא-דאטה של משפחה (שדות מותרים בלבד) |
| GET | `/manager/group/families/:familyId/weekly-order?weekKey=` | הזמנה שבועית למשפחה |
| PUT | `/manager/group/families/:familyId/weekly-order` | upsert הזמנה שבועית |
| GET | `/manager/group/members-and-payment-status` | חברים + שולם/לא שולם + תאריך |
| GET | `/manager/group/distributor-workload` | עומס מחלקים ב-52 שבועות + highest/lowest |
| GET | `/manager/group/revenue` | הכנסות חודשיות + שנתיות של הקבוצה |
| GET | `/manager/donation-info` | מידע תרומה (paymentLink, תיאור, לוגו) |
| GET | `/manager/my-payments` | היסטוריית תשלומים + isCurrentMonthPaid |

### התראות (Alerts)

| Method | Path | תיאור |
|---|---|---|
| POST | `/admin/alerts` | יצירת התראה + שליחת push |
| GET | `/admin/alerts?page=&limit=` | רשימת התראות (אדמין) |
| DELETE | `/admin/alerts/:id` | מחיקת התראה |
| GET | `/me/alerts?limit=` | התראות למשתמש (מסונן לפי audience) |

---

## זרימת שליחת Push Notifications

```
Admin POST /admin/alerts
  │
  ├─ שמירת Alert ב-DB
  │
  ├─ קביעת recipientCount (סינכרוני, לפני תשובה)
  │
  ├─ החזרת תשובה ל-admin
  │
  └─ שליחת push ברקע (אסינכרוני):
       │
       ├─ פתרון נמענים לפי audience:
       │   ALL_USERS → כל המשתמשים בעמותה עם PushSubscription פעיל
       │   GROUP_MANAGERS → משתמשים עם GroupMembership.role=MANAGER
       │
       ├─ שליחה בקבוצות של 20 (PUSH_CONCURRENCY)
       │
       ├─ בהצלחה → ++deliveredCount
       │
       ├─ בשגיאת 410/404 → מחיקת PushSubscription (ניקוי stale)
       │
       └─ עדכון deliveredCount סופי ב-DB
```

Payload:
```json
{
  "type": "alert",
  "title": "...",
  "body": "...",
  "url": "/manager"
}
```

---

## החלטות (DECISIONS)

### 1. MVP — קבוצה מנוהלת אחת
בגרסת MVP, משתמש מנהל קבוצה אחת בלבד. אם יש כמה (לא אמור לקרות), מוחזרת הראשונה הפעילה.

### 2. חלון עומס מחלקים — 52 שבועות
עומס המחלקים מחושב על 52 השבועות האחרונים (שנה).

### 3. מחלקים אחרונים — כרטיסיות אופקיות
3 המחלקים האחרונים מוצגים ככרטיסיות pill בשורה אופקית עם scroll snap על מובייל.

### 4. iframe sandbox
`sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` — ינוצר בעתיד אם ספק התשלום דורש פחות הרשאות.

### 5. קומפוננט תרומות משותף
עמוד `/manager/my-donations` בנוי כעמוד עצמאי אך משתף את אותם APIs ודפוסי עיצוב של עמוד `/my-donations`. לא שוכפלה לוגיקה — שני העמודים קוראים לאותם endpoints.

### 6. אייקון במקום אמוג'י
באנר סיום הזמנות משתמש באייקון `CheckCircle` מ-lucide-react ולא באמוג'י, בהתאם לכלל הנעילה.

### 7. מחיקת התראות — hard delete
Alert לא כלול במנגנון soft-delete (שחל רק על Organization, User, Group, Family). מחיקה היא לצמיתות.

### 8. תיקון @unique על assignedUserId
הוסרה האילוץ `@unique` מ-`WeeklyDistributorAssignment.assignedUserId` שמנע מאותו משתמש לשמש מחלק ביותר משבוע אחד. `@@unique([groupId, weekKey])` מספיק.

### 9. אחסון תוכן הזמנה
`PUT /manager/group/families/:familyId/weekly-order` שומר את התוכן כ-`{ "text": content }` ב-`shoppingListJson`, תואם לגרסה הקודמת שאחסנה מערך פריטים.

---

## TODOs ידועים

- [ ] דייג'סט חודשי של התראות במייל
- [ ] ארכיון + חיפוש התראות
- [ ] בחירת ערוץ התראה לפי קבוצה (push/WhatsApp/SMS)
- [ ] Service Worker: לוודא שה-push handler מטפל ב-`type: 'alert'` ופותח URL מתאים ב-`notificationclick`
- [ ] גרף הכנסות — שדרוג ל-recharts אם כבר מותקן בפרויקט
- [ ] pagination למשפחות אם יותר מ-50

---

## Post-fix: ניתוב לאחר התחברות

### קבצים ששונו

| קובץ | שינוי |
|---|---|
| `apps/api/src/modules/auth/auth.service.ts` | הוספת `isGroupManager` ו-`managedGroupId` לתשובת `/auth/me` |
| `apps/web/src/app/(auth)/login/_components/OtpVerification.tsx` | ניתוב מנהל קבוצה ל-`/manager/dashboard` |
| `apps/web/src/app/(auth)/login/_components/BiometryLogin.tsx` | ניתוב מנהל קבוצה ל-`/manager/dashboard` |
| `apps/web/src/app/(dashboard)/page.tsx` | ניתוב אוטומטי מ-`/` ל-`/manager/dashboard` עבור מנהל קבוצה |

### החלטה

`isGroupManager` מחושב בצד השרת ב-`/auth/me` — שאילתת Prisma אחת עם `include` על `groupMemberships` בפילטר `role: MANAGER`. עדיף על חישוב בצד הלקוח כי ה-endpoint כבר נקרא בכל התחברות, ואין צורך ב-API call נוסף.

### סדר ניתוב

1. `activationCompleted === false` → `/activation`
2. `platformRole === 'SUPER_ADMIN'` → `/platform`
3. `isGroupManager === true` → `/manager/dashboard`
4. `systemRole === 'ADMIN'` → `/` (dashboard layout מטפל ב-setup)
5. אחרת → `/` (דשבורד תורם)
