# Testing strategy

## What's tested today (vitest)

- `src/lib/phone.ts` — E.164 conversion, tel/wa/maps href builders
- `src/lib/week.ts` — ISO week-key formatting
- `src/lib/csv.ts` — quote/escape/CRLF parsing, header→record mapping
- `src/lib/alert-templates.ts` — AsyncStorage CRUD with a mock

Run: `pnpm --filter mobile test`

## What's NOT tested (and why)

**React Native screens.** Testing screens needs `@testing-library/react-native` + Jest + `jest-expo` preset. Vitest cannot execute the RN imports (native bridges, Reanimated, expo-router) without a heavy compatibility layer. Adding Jest alongside the existing vitest setup is feasible but significant configuration; skipped until the app stabilises.

**End-to-end (Detox / Maestro).** Same story — meaningful only against a built simulator artifact, not from CI without device infra.

## Adding screen tests later

The scaffold is structured so screen tests would live next to their files: `app/(app)/distributor.test.tsx`, etc. To enable:

1. `pnpm --filter mobile add -D jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest react-test-renderer`
2. Add `jest.config.js` with `preset: 'jest-expo'`.
3. Add `transformIgnorePatterns` for `react-native|expo|@expo|@react-native|nativewind|expo-router`.
4. Add a `pnpm --filter mobile test:rn` script alongside the existing vitest one (don't merge — they have different module systems).

## What to test first when you do

1. `phone.tsx` form: invalid phone shows the alert, valid phone calls `startLogin`.
2. `distributor.tsx`: optimistic toggle reverts on mutation error.
3. `_layout.tsx` AuthGate: redirects unauth → `(auth)/phone`, biometric-locked stays locked.

These three cover the highest-risk paths.
