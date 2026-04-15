'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribedToPush,
  getCurrentPushSubscription,
  type PushSubscriptionData,
} from '@/lib/push';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: Error | null;
  subscription: PushSubscriptionData | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

/**
 * Hook for managing push notification subscriptions
 * Provides subscription status, permission state, and subscribe/unsubscribe functions
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported] = useState(() => isPushNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermissionStatus()
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Refresh the current subscription status
   */
  const refreshStatus = useCallback(async () => {
    if (!isSupported) return;

    try {
      setIsLoading(true);
      setError(null);

      const [subscribed, currentSub] = await Promise.all([
        isSubscribedToPush(),
        getCurrentPushSubscription(),
      ]);

      setIsSubscribed(subscribed);
      setSubscription(currentSub);
      setPermission(getNotificationPermissionStatus());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[Push] Failed to refresh status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError(new Error('Push notifications are not supported'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const subscriptionData = await subscribeToPushNotifications();

      setIsSubscribed(true);
      setSubscription(subscriptionData);
      setPermission(getNotificationPermissionStatus());

      console.log('[Push] Successfully subscribed to push notifications');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[Push] Failed to subscribe:', error);

      // Update permission status in case it changed
      setPermission(getNotificationPermissionStatus());
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await unsubscribeFromPushNotifications();

      setIsSubscribed(false);
      setSubscription(null);

      console.log('[Push] Successfully unsubscribed from push notifications');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[Push] Failed to unsubscribe:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Check initial subscription status on mount
   */
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  /**
   * Listen for permission changes
   */
  useEffect(() => {
    if (!isSupported || !('permissions' in navigator)) {
      return;
    }

    const checkPermissionChange = async () => {
      try {
        const result = await navigator.permissions.query({
          name: 'notifications' as PermissionName,
        });

        result.addEventListener('change', () => {
          setPermission(getNotificationPermissionStatus());
          refreshStatus();
        });
      } catch (err) {
        // Some browsers don't support querying notification permission
        console.warn('[Push] Permission change detection not supported');
      }
    };

    checkPermissionChange();
  }, [isSupported, refreshStatus]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscription,
    subscribe,
    unsubscribe,
    refreshStatus,
  };
}
