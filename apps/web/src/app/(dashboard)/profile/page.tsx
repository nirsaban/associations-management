'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { User, Phone, Mail, Building2, Users, Bell, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';

interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  organizationName?: string;
  groupName?: string;
  groupId?: string;
  notificationSettings: {
    pushEnabled: boolean;
    emailEnabled: boolean;
  };
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: UserProfile }>(API_ROUTES.USERS.ME);
      return response.data.data;
    },
    enabled: !!user,
  });

  const updateNotifications = useMutation({
    mutationFn: async (settings: { pushEnabled: boolean; emailEnabled: boolean }) => {
      const response = await api.patch<{ data: UserProfile }>(
        API_ROUTES.USERS.ME,
        { notificationSettings: settings }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

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
          <span>שגיאה בטעינת הפרופיל</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg font-headline mb-2">הפרופיל שלי</h1>
        <p className="text-body-md text-on-surface-variant">
          פרטים אישיים והגדרות חשבון
        </p>
      </div>

      {/* Personal Information */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          פרטים אישיים
        </h2>

        <div className="space-y-4">
          {/* Full Name */}
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1">שם מלא</p>
            <p className="text-body-lg font-medium">{profile?.fullName || 'לא הוזן'}</p>
          </div>

          {/* Phone */}
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              טלפון
            </p>
            <p className="text-body-lg font-medium">{profile?.phone}</p>
          </div>

          {/* Email */}
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              דואר אלקטרוני
            </p>
            <p className="text-body-lg font-medium">{profile?.email || 'לא הוזן'}</p>
          </div>
        </div>
      </div>

      {/* Organization & Group */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <Building2 className="h-6 w-6 text-secondary" />
          ארגון וקבוצה
        </h2>

        <div className="space-y-4">
          {/* Organization */}
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1">ארגון</p>
            <p className="text-body-lg font-medium">{profile?.organizationName || 'לא משויך'}</p>
          </div>

          {/* Group */}
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              קבוצה
            </p>
            <p className="text-body-lg font-medium">{profile?.groupName || 'לא משויך לקבוצה'}</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-tertiary" />
          הגדרות התראות
        </h2>

        <div className="space-y-4">
          {/* Push Notifications */}
          <div className="p-4 rounded-lg bg-surface-container flex items-center justify-between">
            <div>
              <p className="text-body-md font-medium">התראות דחיפה</p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                קבל התראות בזמן אמת במכשיר
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={profile?.notificationSettings?.pushEnabled ?? false}
                onChange={(e) => {
                  updateNotifications.mutate({
                    pushEnabled: e.target.checked,
                    emailEnabled: profile?.notificationSettings?.emailEnabled ?? false,
                  });
                }}
              />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="p-4 rounded-lg bg-surface-container flex items-center justify-between">
            <div>
              <p className="text-body-md font-medium">התראות במייל</p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                קבל עדכונים בדואר אלקטרוני
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={profile?.notificationSettings?.emailEnabled ?? false}
                onChange={(e) => {
                  updateNotifications.mutate({
                    pushEnabled: profile?.notificationSettings?.pushEnabled ?? false,
                    emailEnabled: e.target.checked,
                  });
                }}
              />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
