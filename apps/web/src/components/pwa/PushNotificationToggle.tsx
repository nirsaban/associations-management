'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationToggleProps {
  className?: string;
}

/**
 * Toggle component for enabling/disabling push notifications
 * Shows appropriate UI based on browser support and permission status
 */
export function PushNotificationToggle({
  className = '',
}: PushNotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // Browser doesn't support push notifications
  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        הדפדפן שלך אינו תומך בהתראות דחיפה
      </div>
    );
  }

  // Permission denied - show instructions
  if (permission === 'denied') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-sm text-red-600">
          הרשאת התראות נחסמה
        </div>
        <div className="text-xs text-gray-600">
          כדי לקבל התראות, יש לאפשר הרשאות בהגדרות הדפדפן
        </div>
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
          <div className="text-sm font-medium text-gray-900">
            התראות דחיפה
          </div>
          <div className="text-xs text-gray-600">
            קבל התראות על עדכונים חשובים
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isSubscribed ? 'bg-primary-600' : 'bg-gray-200'}
          `}
          aria-label={isSubscribed ? 'בטל התראות' : 'אפשר התראות'}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white
              transition duration-200 ease-in-out
              ${isSubscribed ? 'translate-x-[-24px]' : 'translate-x-[-4px]'}
            `}
          />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-xs text-gray-500">
          מעדכן...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-xs text-red-600">
          שגיאה: {error.message}
        </div>
      )}

      {/* Success state */}
      {!isLoading && !error && isSubscribed && (
        <div className="text-xs text-green-600">
          התראות מופעלות
        </div>
      )}
    </div>
  );
}
