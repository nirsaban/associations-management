# 07 — תיקון באג: SUPER_ADMIN לא מנותב ל-/platform אחרי התחברות

תאריך: 2026-04-20

---

## הבאג

לאחר התחברות עם טלפון SUPER_ADMIN (0501234567) והזנת OTP, המשתמש נחת על `/` (דשבורד רגיל) במקום על `/platform`.
ניווט ידני ל-`/platform` גם הוחזר ל-`/`.

## סיבת השורש

**שלב 2 באבחון — תגובת backend verifyOtp חסרה `platformRole` באובייקט user.**

הקובץ: `apps/api/src/modules/auth/auth.service.ts`

ה-JWT payload כלל `platformRole` (שורה 187) אך אובייקט ה-user בגוף התשובה (שורות 208-216) **לא כלל את השדה**:

```typescript
// לפני התיקון
user: {
  id: user.id,
  phone: user.phone,
  name: user.fullName,
  email: user.email || undefined,
  systemRole: user.systemRole,        // ✅ קיים
  // platformRole — ❌ חסר!
  organizationId: user.organizationId,
  createdAt: user.createdAt.toISOString(),
}
```

### שרשרת הכשלים

1. Backend שולח user בלי `platformRole` → Frontend שומר ב-Zustand store עם `platformRole: undefined`
2. `OtpVerification` בודק `user?.platformRole === 'SUPER_ADMIN'` → `false` → מנתב ל-`/`
3. Dashboard layout בודק `user.platformRole === 'SUPER_ADMIN'` → `false` → לא מפנה ל-platform
4. Platform layout בודק `user?.platformRole !== 'SUPER_ADMIN'` → `true` → מחזיר ל-`/`

**ה-middleware** עבד נכון (קרא מה-JWT cookie), אך הגנת הצד-לקוח ב-platform layout דרסה אותו.

## מה תוקן

### 1. `apps/api/src/modules/auth/auth.service.ts`
הוספת `platformRole: user.platformRole ?? undefined` לאובייקט user ב:
- תגובת `verifyOtp` (שורה ~209)
- תגובת `refreshToken` (שורה ~260)

### 2. `apps/api/src/modules/auth/dto/token-response.dto.ts`
הוספת שדה `platformRole` ל-`UserDataDto` עם `@ApiProperty({ enum: ['SUPER_ADMIN'], required: false })`.

## אימות ידני (פחות מ-60 שניות)

1. `npx prisma migrate reset --force` (אם ה-seed לא רץ לאחרונה)
2. `npm run start:dev` (backend)
3. `npm run dev --workspace=web` (frontend)
4. פתח דפדפן → `http://localhost:3000/login`
5. הזן טלפון: `0501234567`
6. הזן את ה-OTP מהקונסול של ה-backend
7. **צפוי**: הדפדפן מנתב ל-`/platform` ומציג ממשק ניהול פלטפורמה עם כותרת "ניהול פלטפורמה"
8. רענן את הדף — **צפוי**: נשאר על `/platform` (לא קופץ ל-`/`)
9. נווט ידנית ל-`/` — **צפוי**: מנותב חזרה ל-`/platform` (middleware + dashboard layout)
