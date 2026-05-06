'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationToggleProps {
  className?: string;
}

/**
 * Toggle component for enabling/disabling push notifications
 * Shows appropriate UI based on browser support and permission status
 */
export function PushNotificationToggle({ className = '' }: PushNotificationToggleProps) {
  const { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe } =
    usePushNotifications();

  // Browser doesn't support push notifications
  if (!isSupported) {
    return (
      <div className={`text-sm text-text-muted ${className}`}>הדפדפן שלך אינו תומך בהתראות דחיפה</div>
    );
  }

  // Permission denied - show instructions
  if (permission === 'denied') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-sm text-error-strong">הרשאת התראות נחסמה</div>
        <div className="text-xs text-text-muted">כדי לקבל התראות, יש לאפשר הרשאות בהגדרות הדפדפן</div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">התראות דחיפה</div>
          <div className="text-xs text-text-muted">קבל התראות על עדכונים חשובים</div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isSubscribed ? 'bg-primary' : 'bg-surface-alt border border-border'}
          `}
          aria-label={isSubscribed ? 'בטל התראות' : 'אפשר התראות'}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-surface shadow-soft
              transition duration-200 ease-out
              ${isSubscribed ? 'translate-x-[-24px]' : 'translate-x-[-4px]'}
            `}
          />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && <div className="text-xs text-text-muted">מעדכן...</div>}

      {/* Error state */}
      {error && <div className="text-xs text-error-strong">שגיאה: {error.message}</div>}

      {/* Success state */}
      {!isLoading && !error && isSubscribed && (
        <div className="text-xs text-success-strong">התראות מופעלות</div>
      )}
    </div>
  );
}
