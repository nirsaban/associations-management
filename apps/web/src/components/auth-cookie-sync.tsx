'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

/**
 * Bridges Zustand persist (localStorage) and the auth_token cookie used by
 * Next.js middleware for routing decisions.
 *
 * Why this exists:
 *   On iOS PWA standalone mode, cookies set in Safari are NOT shared with the
 *   home-screen PWA — but localStorage IS. That creates a redirect loop:
 *     1. User logs in via Safari → cookie + localStorage both set
 *     2. User adds to home screen, opens the PWA
 *     3. PWA hits `/` → middleware sees no cookie → redirects to /login
 *     4. /login sees localStorage `isAuthenticated=true` → redirects to /
 *     5. ...loop
 *
 *   This component runs once on hydration. If we have a valid accessToken in
 *   localStorage but no auth_token cookie, we re-establish the cookie. Next
 *   middleware hit succeeds, loop broken.
 *
 *   If the cookie can't be set (silently rejected by the PWA context), we
 *   force-logout instead of leaving the user in a redirect loop.
 */
export function AuthCookieSync() {
  useEffect(() => {
    // useEffect runs only in the browser and *after* Zustand persist has
    // hydrated from localStorage, so reading the store directly is safe.
    if (typeof document === 'undefined') return;

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      // Nothing to sync — also reset any prior loop tracker
      try { sessionStorage.removeItem('login-loop-started-at'); } catch {}
      return;
    }

    const readCookie = () =>
      document.cookie.split(';').some((c) => c.trim().startsWith('auth_token='));

    if (!readCookie()) {
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      // SameSite=Lax (not Strict): Strict can be silently dropped when set
      // via document.cookie inside an iOS PWA standalone context.
      document.cookie = `auth_token=${accessToken}; path=/; max-age=3600; SameSite=Lax${secure}`;

      if (!readCookie()) {
        // The browser silently rejected our cookie write. Continuing would
        // produce an infinite /login ↔ / redirect loop. Force logout so
        // the user can re-authenticate cleanly.
        try { sessionStorage.removeItem('login-loop-started-at'); } catch {}
        const { logout } = useAuthStore.getState();
        logout();
        return;
      }
    }

    // Cookie is in place — we successfully escaped (or never entered) the
    // loop scenario, clear the watchdog timestamp.
    try { sessionStorage.removeItem('login-loop-started-at'); } catch {}
  }, []);

  return null;
}
