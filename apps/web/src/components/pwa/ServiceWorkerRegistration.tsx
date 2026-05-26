'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/push';

/**
 * Registers the service worker and forces a silent reload when a new SW
 * version takes over. The SW itself is served dynamically from /sw.js with
 * a fresh build stamp on every deploy, so byte-different content reaches the
 * browser, triggers `updatefound`, and the new SW calls `skipWaiting()` in
 * its install handler. We then listen for `controllerchange` and reload —
 * existing installed PWAs pick up the new code on their next launch without
 * any user interaction.
 *
 * To avoid an infinite reload loop when DevTools "Update on reload" is on
 * (which causes controllerchange to fire repeatedly), we guard with a
 * session-scoped flag.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let unmounted = false;
    let reloadGuard = false;

    const reloadOnce = () => {
      if (reloadGuard) return;
      reloadGuard = true;
      // Defer slightly so the new SW finishes claiming clients before we navigate.
      setTimeout(() => window.location.reload(), 50);
    };

    const onControllerChange = () => reloadOnce();

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const setup = async () => {
      try {
        const registration = await registerServiceWorker();
        if (unmounted) return;

        // If a new SW is already waiting when we register, ask it to take over.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // A new SW just finished installing AND another SW currently
              // controls the page → tell the new one to take over immediately.
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Poll for updates while the PWA is open, so we don't have to wait
        // for a navigation to discover that a new SW exists.
        const checkForUpdate = () => registration.update().catch(() => undefined);
        checkForUpdate();
        const interval = setInterval(checkForUpdate, 60_000);
        const onVisible = () => {
          if (document.visibilityState === 'visible') checkForUpdate();
        };
        document.addEventListener('visibilitychange', onVisible);

        // Cleanup signal: when this useEffect unmounts (HMR / route swap)
        // tear down the interval/listener but DON'T unregister the SW.
        (window as unknown as { __swCleanup?: () => void }).__swCleanup = () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', onVisible);
        };
      } catch (err) {
        console.error('[PWA] Service worker registration failed:', err);
      }
    };

    setup();

    return () => {
      unmounted = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      const cleanup = (window as unknown as { __swCleanup?: () => void }).__swCleanup;
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}
