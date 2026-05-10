# Amutot Mobile (Expo / React Native)

Internal mobile app for the Amutot platform. Reuses the existing NestJS API at `apps/api/`.

## Status

**Phase 1 — Foundation (in progress).** This commit lands the scaffold: workspace, RTL/Hebrew, auth (phone+OTP), secure token storage, axios client with refresh-token interceptor, push registration against `/activation/push/subscribe`, and a role-aware home screen stub. All other web flows still need to be ported screen-by-screen in subsequent phases.

## Run

```bash
# from repo root, first time only
pnpm install

# start the API (separate terminal)
pnpm --filter api start:dev

# start Expo
pnpm --filter mobile start
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go on a physical device.

## Config

Create `apps/mobile/.env` from `.env.example`:

```
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3003/api/v1
```

When testing on a physical device, the API URL must be your LAN IP — `localhost` only works in the iOS simulator.

## Architecture

- **Routing:** `expo-router` (file-based, mirrors Next.js App Router).
  - `app/(auth)/` — phone, otp.
  - `app/(app)/` — authenticated screens.
  - `app/_layout.tsx` — root: hydrate auth, gate routes, register for push after login.
- **Styling:** NativeWind (Tailwind for RN). No component library — same rule as web.
- **State:** Zustand store + `expo-secure-store` for tokens (hardware-backed on iOS/Android, falls back to in-memory).
- **API:** Axios instance with `Authorization: Bearer` injection + 401 → `/auth/refresh` retry. Mirrors `apps/web/src/lib/api.ts`.
- **i18n:** `i18next` + `react-i18next`, Hebrew only, RTL forced via `I18nManager`.
- **Push:** Expo Push Token registered as a `PushSubscription` row with endpoint `expo:<token>`. The backend `web-push` sender will need a small change to detect the `expo:` prefix and dispatch via Expo's push service instead — TODO in next phase.

## Roles

All five roles (SUPER_ADMIN / ADMIN / GROUP_MANAGER / GROUP_MEMBER / USER) authenticate through the same OTP flow. Role-specific home screens land in subsequent phases.

## Bundle IDs

- iOS: `il.amutot.app`
- Android: `il.amutot.app`

## Distribution

Internal only for now (TestFlight / Expo Go / APK). No App Store / Play Store submission.

## Smoke run checklist (manual)

I cannot drive the simulator from CI. Run these locally on first boot:

1. **Backend up:** `pnpm --filter api start:dev` — verify `http://localhost:3003/api/v1/health` 200.
2. **Find your LAN IP:** `ifconfig | grep "inet " | grep -v 127` (mac) — copy the 192.x.x.x.
3. **Set mobile env:** create `apps/mobile/.env` with `EXPO_PUBLIC_API_URL=http://<lan-ip>:3003/api/v1`.
4. **Start Expo:** `pnpm --filter mobile start`. Press `i` (iOS sim), `a` (Android emu), or scan QR with Expo Go.
5. **Login:** dev seed phones in `docs/multi-tenant-foundation/03-done.md`. Verify OTP arrives via Green API (or check logs for the printed code in dev mode).
6. **Walk the tiles:**
   - Distributor → mark a delivery → confirm green check appears, refresh persists.
   - Group → current distributor card populated, members + families render RTL.
   - Orders → tap order → add an item → save → reopen, item present.
   - Payments → status pill matches DB, donate button opens browser.
   - Profile → toggle biometric on, kill app, reopen — should prompt before showing screens.
   - Alerts → fire an alert from web admin, confirm push delivered (requires real device + Expo Go for token).
   - Admin → users list → edit one → save → see updated row.
7. **Tap-to-route:** receive a push, tap it, confirm app opens to the matching screen.

If anything 500s, the request URL likely points at `localhost` instead of your LAN IP — the most common gotcha.
