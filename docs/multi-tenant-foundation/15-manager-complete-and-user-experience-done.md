# 15 — השלמת מנהל קבוצה + חוויית משתמש רגיל

תאריך: 2026-04-21

---

## ביקורת פרומפט 14 — מה באמת עבד ומה לא

### מה עבד:
- כל ה-backend endpoints קיימים עם לוגיקה נכונה (13 endpoints במודול manager, 4 באלרטים)
- כל 6 עמודי הפרונטאנד קיימים עם תוכן אמיתי (לא stubs)
- מודל Alert נוסף לסכמה ועובד
- שליחת push notifications אסינכרונית

### מה לא עבד (נמצא בביקורת):

| בעיה | חומרה | תיקון |
|---|---|---|
| Dashboard layout לא מזהה GROUP_MANAGER — בודק רק `systemRole === 'ADMIN'` | קריטי | הוספת `else if (user?.isGroupManager) navKey = 'GROUP_MANAGER'` |
| Auth store חסר שדה `isGroupManager` — layout לא יכול להשתמש בו | קריטי | הוספת `isGroupManager`, `managedGroupId`, `groupMembershipGroupId` ל-User interface |
| OTP/Biometry login לא שומרים `isGroupManager` ב-store | קריטי | עדכון שתי הקומפוננטות לשמור מ-`/auth/me` |
| Nav link `/manager/my-families` מפנה לנתיב שלא קיים (עמוד ב-`/manager/families`) | קריטי | תיקון ל-`/manager/families` |
| `getGroupFamilies()` לא מחזיר `childrenMinorCount`/`totalMemberCount` | באג | הוספת השדות ל-SELECT |
| Nav home של GROUP_MANAGER מפנה ל-`/` במקום `/manager/dashboard` | באג | תיקון ל-`/manager/dashboard` |

**מסקנה:** העמודים עצמם בסדר, אבל המשתמש לא הגיע אליהם בגלל ניתוב שבור + ניווט שלא מזהה את התפקיד.

---

## קבצים שנוצרו / שונו

### סכמה

| קובץ | פעולה |
|---|---|
| `prisma/schema.prisma` | הוספת מודל `WeeklyFamilyDelivery` + קשרי גומלין |
| `apps/api/src/common/tenant/tenant.constants.ts` | הוספת `WeeklyFamilyDelivery` ל-tenant models |

### בקאנד — endpoints חדשים

| קובץ | פעולה |
|---|---|
| `apps/api/src/modules/manager/user-experience.controller.ts` | חדש — 3 routes: GET /me/weekly-distribution, PUT delivery, GET /me/group-view |
| `apps/api/src/modules/manager/dto/mark-delivery.dto.ts` | חדש — DTO לסימון חלוקה |
| `apps/api/src/modules/manager/manager.service.ts` | הוספת 3 methods: getMyWeeklyDistribution, markFamilyDelivery, getMyGroupView. תיקון getGroupFamilies (שדות חסרים) |
| `apps/api/src/modules/manager/manager.module.ts` | רישום UserExperienceController |
| `apps/api/src/modules/auth/auth.service.ts` | הרחבת getMe — מחזיר isGroupManager, managedGroupId, groupMembershipGroupId |

### פרונטאנד — קומפוננטות משותפות (חדש)

| קובץ | תיאור |
|---|---|
| `apps/web/src/components/group-experience/MembersList.tsx` | רשימת חברים עם סטטוס תשלום |
| `apps/web/src/components/group-experience/FamilyCard.tsx` | כרטיס משפחה מתרחב — editable/readonly |
| `apps/web/src/components/group-experience/DonationIframeCard.tsx` | כרטיס תרומה עם iframe |
| `apps/web/src/components/group-experience/AlertsList.tsx` | רשימת התראות אחרונות (self-fetching) |
| `apps/web/src/components/group-experience/CurrentWeekDistributorCard.tsx` | כרטיס מחלק שבועי |
| `apps/web/src/components/group-experience/index.ts` | barrel export |

### פרונטאנד — עמודי משתמש רגיל (חדש)

| קובץ | תיאור |
|---|---|
| `apps/web/src/app/(dashboard)/user/dashboard/page.tsx` | דף הבית — חלוקה/סטטוס + תרומה + התראות |
| `apps/web/src/app/(dashboard)/user/my-group/page.tsx` | הקבוצה שלי — חברים + מחלק (ללא הכנסות/עומס) |
| `apps/web/src/app/(dashboard)/user/families/page.tsx` | משפחות — read-only |
| `apps/web/src/app/(dashboard)/user/my-donations/page.tsx` | תרומות — זהה למנהל |

### פרונטאנד — תיקונים

| קובץ | פעולה |
|---|---|
| `apps/web/src/store/auth.store.ts` | הוספת isGroupManager, managedGroupId, groupMembershipGroupId |
| `apps/web/src/app/(dashboard)/layout.tsx` | תיקון זיהוי GROUP_MANAGER, תיקון nav links, עדכון USER nav ל-/user/* |
| `apps/web/src/app/(dashboard)/page.tsx` | שכתוב מלא — pure redirect hub |
| `apps/web/src/app/(auth)/login/_components/OtpVerification.tsx` | שמירת group info ב-store, redirect ל-/user/dashboard |
| `apps/web/src/app/(auth)/login/_components/BiometryLogin.tsx` | אותו שינוי |

### תיעוד

| קובץ | פעולה |
|---|---|
| `docs/ROLES.md` | הוספת: mark delivery, regular user group view, families read-only |
| `docs/multi-tenant-foundation/15-manager-complete-and-user-experience-done.md` | קובץ זה |

---

## Endpoints חדשים

| Method | Path | תיאור | הרשאה |
|---|---|---|---|
| GET | `/me/weekly-distribution` | סטטוס מחלק שבועי + משפחות + חלוקות | כל משתמש מאומת |
| PUT | `/me/weekly-distribution/families/:familyId` | סימון חלוקה למשפחה | מחלק שבועי בלבד |
| GET | `/me/group-view` | תצוגת קבוצה read-only | חבר קבוצה (כל role) |

### GET /me/weekly-distribution — Response

```json
// אם לא מחלק:
{ "data": { "isDistributor": false } }

// אם מחלק:
{
  "data": {
    "isDistributor": true,
    "assignmentId": "cuid",
    "weekStart": "2026-04-20",
    "groupName": "קבוצה א'",
    "families": [{
      "id": "cuid",
      "name": "משפחת כהן",
      "contactPhone": "0521234567",
      "address": "רחוב ביאליק 5",
      "weeklyOrderContent": "לחם 2, חלב 3",
      "delivered": false,
      "deliveredAt": null
    }],
    "totalCount": 3,
    "deliveredCount": 1
  }
}
```

### PUT /me/weekly-distribution/families/:familyId — Request/Response

```json
// Request:
{ "delivered": true }

// Response:
{ "data": { "id": "cuid", "familyId": "cuid", "delivered": true, "deliveredAt": "2026-04-21T..." } }
```

---

## סדר ניתוב לאחר התחברות

```
1. activationCompleted === false        → /activation
2. platformRole === 'SUPER_ADMIN'       → /platform
3. isGroupManager === true              → /manager/dashboard
4. systemRole === 'ADMIN'               → /admin
5. משתמש רגיל                          → /user/dashboard
```

עמוד `/` (root) משמש כ-redirect hub בלבד — מפנה לפי תפקיד.

---

## החלטות (DECISIONS)

### 1. `/dashboard` כ-alias
עמוד `/` נשמר כ-redirect שמפנה לפי תפקיד. סימניות ישנות לא ישברו.

### 2. משתמש רגיל — מה רואה ומה לא
- חברי קבוצה: ✅ (שם + שולם/לא שולם)
- משפחות: ✅ (read-only, ללא עריכה)
- הכנסות: ❌ (מנהל בלבד — פרטיות)
- עומס מחלקים: ❌ (מנהל בלבד)
- מחלק שבועי נוכחי: ✅

### 3. סימון חלוקה — מי יכול
רק המחלק השבועי הנוכחי (WeeklyDistributorAssignment.assignedUserId === currentUser.id AND weekKey === currentWeek). כל ניסיון אחר → 403.

### 4. קומפוננטות משותפות
MembersList, FamilyCard, DonationIframeCard, AlertsList, CurrentWeekDistributorCard — משותפות בין /manager ו-/user. לא שוכפל קוד.

### 5. ניווט מותנה למשתמש ללא קבוצה
משתמש ללא `groupMembershipGroupId` רואה בתפריט רק "דף הבית" ו"התרומות שלי". הלשוניות "הקבוצה שלי" ו"המשפחות שלי" מוסתרות (העמודים מציגים הודעת "אינך משויך לקבוצה" אם מגיעים ישירות).

### 6. WeeklyFamilyDelivery — מודל חדש
מאפשר מעקב per-family delivery status לכל שבוע. @@unique על (assignmentId, familyId) מונע כפילויות.

---

## TODOs ידועים

- [ ] הוסתרות לשוניות nav דינמית למשתמש ללא קבוצה (כרגע העמודים מטפלים — nav מציג הכל)
- [ ] טלפון חברים ב-group-view (כרגע לא מוחזר מה-API)
- [ ] היסטוריית חלוקות אישית ("היית מחלק X פעמים")
- [ ] Notification push כשמחלק שבועי מסיים את כל החלוקות
- [ ] E2E tests לזרימת חלוקה מלאה
