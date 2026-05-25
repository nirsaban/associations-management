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
 *   Also useful on Safari ITP cookie eviction (7-day rule) when the user has
 *   visited recently and localStorage survived but the cookie was cleared.
 */
export function AuthCookieSync() {
  useEffect(() => {
    const persist = useAuthStore.persist;
    if (!persist) return; // SSR / build prerender — nothing to do

    const sync = () => {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) return;
      if (typeof document === 'undefined') return;

      const hasCookie = document.cookie
        .split(';')
        .some(c => c.trim().startsWith('auth_token='));

      if (!hasCookie) {
        const secure = window.location.protocol === 'https:';
        document.cookie = `auth_token=${accessToken}; path=/; max-age=3600; SameSite=Lax${secure ? '; Secure' : ''}`;
      }
    };

    // Run immediately in case the store is already hydrated synchronously.
    if (persist.hasHydrated()) {
      sync();
    }

    // Also run when hydration finishes (Zustand persist async path).
    const unsub = persist.onFinishHydration(() => {
      sync();
    });

    return () => { unsub(); };
  }, []);

  return null;
}
