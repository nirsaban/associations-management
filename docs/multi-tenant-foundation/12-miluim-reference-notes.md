# 12 — סיכום תבניות מפרויקט miluim (קריאה בלבד)

תאריך: 2026-04-21

---

## מטרה

סיכום הגישות והקבצים הרלוונטיים בפרויקט miluim לשלוש היכולות שאנחנו מממשים:
WebAuthn (ביומטריה), Push Notifications, והוראות התקנת PWA.

---

## 1. WebAuthn / ביומטריה / Passkeys

### קבצים ב-miluim
- `src/lib/webauthn.ts` — ליבת המימוש (registration + authentication)
- `src/app/auth/passkey-setup/page.tsx` — מסך הרשמת passkey
- `src/app/auth/login/page.tsx` — אסטרטגיית passkey-first בהתחברות
- `src/app/dashboard/profile/page.tsx` — ניהול passkeys (הוספה/מחיקה)

### ספריות
- `@simplewebauthn/browser` v13.3.0 (frontend)
- Backend uses `@simplewebauthn/server`

### תבניות שנאמץ
- שימוש ב-`browserSupportsWebAuthn()` + `platformAuthenticatorIsAvailable()` לזיהוי יכולות המכשיר
- Registration: GET options → `startRegistration()` → POST verify
- Authentication: POST options (with phone) → `startAuthentication()` → POST verify
- זיהוי שם מכשיר מ-user agent (iPhone, iPad, Mac, Android, Windows)
- Passkey-first login: אם יש credential רשום + platform authenticator → מציג כפתור ביומטריה ראשון

### מה משנים לפרויקט שלנו
- miluim משתמש ב-personalId (תעודת זהות) — אנחנו נשתמש ב-phone (מזהה ייחודי בתוך ארגון)
- miluim מאפשר multiple passkeys per user — גם אנחנו
- miluim stores login preference in localStorage — אנחנו נשתמש בגישה דומה

---

## 2. Push Notifications / VAPID

### קבצים ב-miluim
- `src/hooks/usePushNotifications.ts` — hook לניהול subscription
- `src/components/ui/PushNotificationToggle.tsx` — toggle button
- `public/sw-push.js` — service worker handler
- `src/components/ServiceWorkerRegister.tsx` — רישום SW

### תבניות שנאמץ
- `urlBase64ToUint8Array()` utility להמרת VAPID key
- Flow: check supported → request permission → get SW registration → subscribe with VAPID → POST to server
- Service worker: `push` event → `showNotification()` with RTL + Hebrew
- Notification click → navigate to URL from payload
- Retry waiting for SW activation (up to 10 attempts)

### מה משנים
- miluim מאפשר dismiss של הבקשה ל-3 ימים — אנחנו דורשים חובה בהפעלה ראשונה (אי אפשר לדלג)
- אנחנו שומרים `activationCompleted` בשרת, לא רק localStorage

---

## 3. PWA Install Instructions

### קבצים ב-miluim
- `src/components/ui/PWAInstallPrompt.tsx` — הוראות לפי פלטפורמה
- `public/manifest.json` — PWA manifest עם RTL + Hebrew
- `next.config.js` — next-pwa configuration

### תבניות שנאמץ
- Platform detection: `/iphone|ipad|ipod/` → iOS, `/android/` → Android, else desktop
- Standalone detection: `navigator.standalone` (iOS) + `matchMedia('(display-mode: standalone)')` (all)
- הוראות בעברית לכל פלטפורמה:
  - iOS: שיתוף → הוסף למסך הבית → הוסף
  - Android: תפריט → התקן אפליקציה → אשר
  - Desktop: אייקון התקנה בשורת הכתובת

### מה משנים
- miluim מאפשר dismiss ל-7 ימים — אנחנו מציגים כמידע (acknowledge) בתוך activation flow
- לא משתמשים ב-next-pwa (כבר יש לנו SW ידני)
- הקומפוננטה תהיה חלק מ-activation flow, לא popup עצמאי

---

## 4. First-Login Gate

### תבנית ב-miluim
- אחרי password login → redirect ל-passkey-setup (אם אין passkey + המכשיר תומך)
- Push prompt מוצג 3 שניות אחרי הגעה ל-home (ניתן לדחות)

### מה אנחנו עושים אחרת
- **Flow מחייב**: push → biometry → PWA (בסדר הזה)
- Push = חובה (אי אפשר לדלג)
- Biometry = מומלץ (אפשר לדלג)
- PWA = מידע (acknowledge ולהמשיך)
- מאוחסן בשרת: `User.activationCompleted = true` אחרי סיום
- Middleware/layout מפנה ל-`/activation` כל עוד `activationCompleted === false`

---

## סיכום ספריות לשימוש

| Package | Where | Purpose |
|---|---|---|
| `@simplewebauthn/server` | Backend (NestJS) | Generate/verify WebAuthn challenges |
| `@simplewebauthn/browser` | Frontend (Next.js) | Trigger browser biometric prompts |
| `web-push` | Backend | Send push notifications via VAPID |

---

## החלטה

מאמצים את הגישות של miluim עם התאמות:
1. Activation flow הוא חובה ומנוהל server-side (לא localStorage בלבד)
2. Phone-based identification (לא personalId)
3. Tailwind בלבד (ללא component libraries)
4. Multi-tenant: credentials + subscriptions scoped to organizationId
