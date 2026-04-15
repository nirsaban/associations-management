# PWA Implementation - ניהול עמותות

This document describes the Progressive Web App (PWA) implementation for the Amutot Management Platform.

## Overview

The platform is configured as a fully installable PWA with:
- Offline support
- Push notifications
- App-like experience
- Hebrew RTL interface

## Files Structure

```
apps/web/
├── public/
│   ├── manifest.json          # PWA manifest with RTL/Hebrew config
│   ├── sw.js                  # Service worker for offline & push
│   ├── offline.html           # Offline fallback page (Hebrew)
│   ├── icon.svg               # Base icon template
│   └── ICONS_README.md        # Icon generation instructions
├── src/
│   ├── lib/
│   │   └── push.ts            # Push notification utilities
│   ├── hooks/
│   │   └── usePushNotifications.ts  # React hook for push state
│   ├── components/
│   │   └── pwa/
│   │       ├── ServiceWorkerRegistration.tsx
│   │       ├── PushNotificationToggle.tsx
│   │       └── index.ts
│   └── app/
│       ├── layout.tsx         # PWA metadata
│       └── providers.tsx      # Includes SW registration
└── next.config.js             # Service worker headers
```

## Features

### 1. Manifest (manifest.json)

Configured with:
- **name**: "ניהול עמותות"
- **short_name**: "עמותות"
- **dir**: "rtl"
- **lang**: "he"
- **theme_color**: "#004650"
- **display**: "standalone"

### 2. Service Worker (sw.js)

Implements:
- **Install event**: Caches core assets
- **Activate event**: Cleans old caches
- **Fetch event**: Network-first strategy with cache fallback
- **Push event**: Shows Hebrew RTL notifications
- **Notification click**: Opens app or focuses existing window
- **Offline fallback**: Shows Hebrew offline page

### 3. Push Notifications

#### Client-Side API (`lib/push.ts`)

```typescript
// Check support
isPushNotificationSupported(): boolean

// Get permission status
getNotificationPermissionStatus(): NotificationPermission

// Request permission
requestNotificationPermission(): Promise<NotificationPermission>

// Register service worker
registerServiceWorker(): Promise<ServiceWorkerRegistration>

// Subscribe to push
subscribeToPushNotifications(vapidKey?: string): Promise<PushSubscriptionData>

// Unsubscribe
unsubscribeFromPushNotifications(): Promise<void>

// Check subscription status
isSubscribedToPush(): Promise<boolean>

// Get current subscription
getCurrentPushSubscription(): Promise<PushSubscriptionData | null>
```

#### React Hook (`hooks/usePushNotifications.ts`)

```typescript
const {
  isSupported,      // Boolean: browser support
  permission,       // 'granted' | 'denied' | 'default'
  isSubscribed,     // Boolean: current subscription state
  isLoading,        // Boolean: operation in progress
  error,            // Error | null
  subscription,     // PushSubscriptionData | null
  subscribe,        // () => Promise<void>
  unsubscribe,      // () => Promise<void>
  refreshStatus,    // () => Promise<void>
} = usePushNotifications();
```

#### UI Component (`components/pwa/PushNotificationToggle.tsx`)

Ready-to-use toggle component with:
- Automatic permission detection
- Hebrew UI
- Loading states
- Error handling
- RTL-friendly toggle switch

### 4. Backend Integration

The frontend expects these API endpoints:

```
GET  /push/vapid-public-key
POST /push/subscribe
POST /push/unsubscribe
```

Expected request format for `/push/subscribe`:

```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "deviceInfo": {
    "userAgent": "...",
    "platform": "...",
    "language": "he"
  }
}
```

## Usage

### Enabling Service Worker

The service worker is automatically registered in production.

For development:
```env
NEXT_PUBLIC_ENABLE_SW=true
```

### Using Push Notifications

#### In a settings page:

```tsx
import { PushNotificationToggle } from '@/components/pwa';

export default function Settings() {
  return (
    <div>
      <h2>הגדרות</h2>
      <PushNotificationToggle />
    </div>
  );
}
```

#### Custom implementation:

```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function CustomNotifications() {
  const { isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  return (
    <button onClick={isSubscribed ? unsubscribe : subscribe}>
      {isSubscribed ? 'בטל התראות' : 'הירשם להתראות'}
    </button>
  );
}
```

#### Direct API usage:

```tsx
import { subscribeToPushNotifications } from '@/lib/push';

async function enablePush() {
  try {
    const subscription = await subscribeToPushNotifications();
    console.log('Subscribed:', subscription);
  } catch (error) {
    console.error('Failed to subscribe:', error);
  }
}
```

## Backend Push Notification Format

When sending push notifications from the backend, use this format:

```json
{
  "title": "כותרת ההתראה",
  "body": "תוכן ההתראה",
  "icon": "/icon-192.png",
  "badge": "/icon-192.png",
  "tag": "notification-id",
  "requireInteraction": false,
  "data": {
    "url": "/path/to/open",
    "customField": "value"
  }
}
```

The service worker automatically sets `dir: "rtl"` and `lang: "he"` for all notifications.

## Icon Requirements

⚠️ **Action Required**: Generate PNG icons from the SVG template

See `public/ICONS_README.md` for detailed instructions.

Required files:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-192-maskable.png` (192x192 with safe zone)
- `favicon.ico` (32x32)

## Testing

### Test Service Worker Registration

```typescript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg);
});
```

### Test Push Subscription

```typescript
import { showTestNotification } from '@/lib/push';

// Show a test notification
await showTestNotification();
```

### Test Offline Mode

1. Open DevTools → Network
2. Select "Offline"
3. Navigate to a previously visited page
4. Should see offline page if not cached

## Security Considerations

1. **VAPID Keys**: Backend must provide valid VAPID public key
2. **HTTPS Required**: Push notifications only work over HTTPS
3. **Tenant Isolation**: Backend must filter notifications by organizationId
4. **Permission Check**: Always check permission before attempting subscription

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️ iOS 16.4+ | ✅ |
| Install Prompt | ✅ | ❌ | ✅ iOS | ✅ |

## Troubleshooting

### Service Worker not registering

1. Check HTTPS (required except localhost)
2. Check `next.config.js` headers
3. Check browser console for errors
4. Verify `sw.js` is accessible at `/sw.js`

### Push subscription failing

1. Verify HTTPS
2. Check notification permission
3. Verify VAPID key from backend
4. Check backend `/push/subscribe` endpoint
5. Check browser console

### Notifications not appearing

1. Check system notification settings
2. Verify permission is "granted"
3. Check if focus-mode/do-not-disturb is enabled
4. Test with `showTestNotification()`

### Offline page not showing

1. Visit the app online first (to cache assets)
2. Check service worker is active
3. Verify `offline.html` is cached
4. Check network tab for 404s

## Future Enhancements

Potential improvements:
- Background sync for offline form submissions
- Periodic background sync for data updates
- Advanced caching strategies per route
- Push notification preferences per type
- Web Share API integration
- Badging API for unread counts

## References

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [VAPID Keys](https://datatracker.ietf.org/doc/html/rfc8292)
