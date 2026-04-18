'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker } from '@/lib/push';

/**
 * Component that handles service worker registration
 * Should be included in the root layout providers
 */
export function ServiceWorkerRegistration() {
  const [, setIsRegistered] = useState(false);
  const [, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only register in production or when explicitly enabled
    const shouldRegister =
      process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!shouldRegister) {
      console.log('[PWA] Service worker disabled in development');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers are not supported in this browser');
      return;
    }

    let isSubscribed = true;

    const register = async () => {
      try {
        const registration = await registerServiceWorker();

        if (!isSubscribed) return;

        setIsRegistered(true);
        console.log('[PWA] Service worker registered successfully');

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('[PWA] New service worker available');

              // Optionally, show a notification to the user to refresh
              if (window.confirm('עדכון חדש זמין. האם לרענן את הדף?')) {
                window.location.reload();
              }
            }
          });
        });

        // Listen for controller change (new service worker took over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] Service worker controller changed');
        });
      } catch (err) {
        if (!isSubscribed) return;

        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('[PWA] Service worker registration failed:', error);
      }
    };

    register();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // This component doesn't render anything
  // It just handles the side effect of registering the service worker
  return null;
}
