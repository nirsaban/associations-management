import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Baked once when the Next.js server process boots. Every new container
// (= every deploy) produces a different value, which makes the service-worker
// file byte-different and triggers the browser's update flow.
// Existing PWAs already on the home screen pick up the new code the next time
// they launch because `/sw.js` is served with `Cache-Control: max-age=0`.
const SW_VERSION = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const SW_BODY = `/* eslint-disable no-restricted-globals */
// Service Worker for נחלת דוד PWA — generated dynamically on each server boot.
// VERSION is what makes byte-different content per deploy so the browser
// detects an update and the activate-handler purges old caches.

const CACHE_VERSION = ${JSON.stringify(SW_VERSION)};
const CACHE_NAME = 'amutot-' + CACHE_VERSION;
const OFFLINE_URL = '/offline.html';

const CORE_ASSETS = ['/', '/offline.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => (n === CACHE_NAME ? null : caches.delete(n)))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
        });
      }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Always go to the network for API calls and the service worker itself.
  if (event.request.url.includes('/api/')) return;
  if (event.request.url.endsWith('/sw.js')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache).catch(() => undefined);
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match(OFFLINE_URL);
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        }),
      ),
  );
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'נחלת דוד',
    body: 'התקבלה הודעה חדשה',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'he',
    data: {},
  };
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        icon: parsed.icon || data.icon,
        badge: parsed.badge || data.badge,
        dir: 'rtl',
        lang: 'he',
        data: parsed.data || {},
        tag: parsed.tag,
        requireInteraction: parsed.requireInteraction || false,
      };
    } catch {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      dir: data.dir,
      lang: data.lang,
      data: data.data,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    }),
  );
});
`;

export async function GET() {
  return new NextResponse(SW_BODY, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-SW-Version': SW_VERSION,
    },
  });
}
