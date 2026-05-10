import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

const URL_TO_ROUTE: Array<[RegExp, string]> = [
  [/\/distributor/i, '/(app)/distributor'],
  [/\/group/i, '/(app)/group'],
  [/\/alerts/i, '/(app)/alerts'],
  [/\/families\/(.+)/i, '/(app)/families/$1'],
  [/\/families/i, '/(app)/families'],
  [/\/manager\/weekly-distributor/i, '/(app)/manager-distributor'],
  [/\/payments?/i, '/(app)/payments'],
  [/\/orders?/i, '/(app)/orders'],
];

function urlToRoute(url?: string | null): string | null {
  if (!url) return null;
  for (const [re, route] of URL_TO_ROUTE) {
    const m = url.match(re);
    if (m) return route.replace('$1', m[1] ?? '');
  }
  return null;
}

export function useNotificationRouter() {
  const router = useRouter();
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { url?: string } | undefined;
      const route = urlToRoute(data?.url);
      if (route) router.push(route as any);
    });
    return () => sub.remove();
  }, [router]);
}
