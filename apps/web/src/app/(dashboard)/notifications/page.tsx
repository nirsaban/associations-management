'use client';

import React, { useState } from 'react';
import { Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: Notification[]; meta: { total: number; page: number; limit: number } }>('/notifications?limit=100');
      return response.data.data;
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-container text-on-success-container border-success/20';
      case 'warning':
        return 'bg-warning-container text-on-warning-container border-warning/20';
      case 'error':
        return 'bg-error-container text-on-error-container border-error/20';
      case 'info':
      default:
        return 'bg-primary-container/30 text-on-surface border-primary/20';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="card h-64 animate-pulse bg-surface-container" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת התראות</span>
        </div>
      </div>
    );
  }

  const filteredNotifications =
    notifications?.filter((n) => filter === 'all' || (filter === 'unread' && !n.isRead)) || [];

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline mb-2">התראות</h1>
          <p className="text-body-md text-on-surface-variant">
            {unreadCount > 0 ? `${unreadCount} התראות חדשות` : 'אין התראות חדשות'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="btn-outline btn-sm"
              disabled={markAllAsRead.isPending}
            >
              סמן הכל כנקרא
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-elevated p-2 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-on-primary'
              : 'hover:bg-surface-container text-on-surface-variant'
          }`}
        >
          הכל ({notifications?.length || 0})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary text-on-primary'
              : 'hover:bg-surface-container text-on-surface-variant'
          }`}
        >
          לא נקראו ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          רשימת התראות
        </h2>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant">
              {filter === 'unread' ? 'אין התראות שלא נקראו' : 'אין התראות להצגה'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  notification.isRead
                    ? 'bg-surface-container border-outline/20 opacity-75'
                    : `${getTypeColor(notification.type)} border-2`
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead.mutate(notification.id);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">{getTypeIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-body-lg font-medium">{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="px-2 py-1 rounded-full bg-primary text-on-primary text-label-sm font-medium flex-shrink-0">
                          חדש
                        </span>
                      )}
                    </div>
                    <p className="text-body-md text-on-surface-variant mb-3">{notification.body}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {format(new Date(notification.createdAt), 'd MMMM yyyy, HH:mm', {
                        locale: he,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
