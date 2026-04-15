# PWA Quick Start Guide

## For Frontend Developers

### Using Push Notifications in a Component

```tsx
import { PushNotificationToggle } from '@/components/pwa';

export default function SettingsPage() {
  return (
    <div>
      <h2>הגדרות התראות</h2>
      <PushNotificationToggle />
    </div>
  );
}
```

### Using the Hook

```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function CustomComponent() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return <p>הדפדפן לא תומך בהתראות</p>;
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
    >
      {isSubscribed ? 'בטל התראות' : 'הירשם להתראות'}
    </button>
  );
}
```

### Direct API Usage

```tsx
import {
  subscribeToPushNotifications,
  showTestNotification,
} from '@/lib/push';

async function handleSubscribe() {
  try {
    await subscribeToPushNotifications();
    alert('נרשמת בהצלחה להתראות!');
  } catch (error) {
    alert('שגיאה בהרשמה להתראות');
  }
}

async function testPush() {
  await showTestNotification();
}
```

## For Backend Developers

### Required API Endpoints

```typescript
// GET /push/vapid-public-key
{
  "publicKey": "BG7..."
}

// POST /push/subscribe
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BL8...",
      "auth": "rtq..."
    }
  },
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "MacIntel",
    "language": "he"
  }
}

// POST /push/unsubscribe
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

### Sending Push Notifications

Expected payload format for web-push library:

```json
{
  "title": "כותרת ההתראה",
  "body": "תוכן ההתראה",
  "icon": "/icon-192.png",
  "badge": "/icon-192.png",
  "tag": "unique-notification-id",
  "requireInteraction": false,
  "data": {
    "url": "/dashboard",
    "type": "payment-reminder"
  }
}
```

Note: The service worker automatically adds `dir: "rtl"` and `lang: "he"`.

## Environment Variables

```env
# Enable service worker in development (optional)
NEXT_PUBLIC_ENABLE_SW=true
```

## Testing Checklist

- [ ] Service worker registers (check DevTools → Application → Service Workers)
- [ ] App installs on mobile (A2HS prompt appears)
- [ ] Offline page shows when offline
- [ ] Notification permission request works
- [ ] Push subscription saves to backend
- [ ] Push notifications appear
- [ ] Notification click opens correct page
- [ ] Unsubscribe works

## Common Issues

### Service worker not registering
- Ensure HTTPS (or localhost)
- Check `next.config.js` headers
- Verify `/sw.js` is accessible

### Push subscription fails
- Check VAPID public key from backend
- Verify `/push/subscribe` endpoint
- Ensure HTTPS

### Notifications not showing
- Check browser notification permission
- Verify system notification settings
- Test with `showTestNotification()`

## File Locations

```
apps/web/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── offline.html       # Offline page
├── src/
│   ├── lib/
│   │   └── push.ts        # Push utilities
│   ├── hooks/
│   │   └── usePushNotifications.ts
│   └── components/pwa/
│       ├── ServiceWorkerRegistration.tsx
│       └── PushNotificationToggle.tsx
```

## Browser DevTools

### Check Service Worker
1. Open DevTools
2. Application tab → Service Workers
3. Should see: `sw.js` with status "activated"

### Check Push Subscription
```js
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub =>
    console.log(sub)
  )
);
```

### Test Notification
```js
import { showTestNotification } from '@/lib/push';
await showTestNotification();
```

### Simulate Offline
1. DevTools → Network tab
2. Select "Offline" from dropdown
3. Refresh page → should see offline.html

## Production Checklist

Before deploying PWA to production:

- [ ] Generate PNG icons from SVG template
- [ ] Set up VAPID keys on backend
- [ ] Implement backend push endpoints
- [ ] Test on HTTPS domain
- [ ] Test install on mobile devices
- [ ] Test push notifications end-to-end
- [ ] Verify offline functionality
- [ ] Test notification click actions
- [ ] Check multi-tenant isolation

## Resources

- Full Documentation: `PWA_README.md`
- Icon Guide: `public/ICONS_README.md`
- Implementation Summary: `PWA_IMPLEMENTATION_SUMMARY.md`
