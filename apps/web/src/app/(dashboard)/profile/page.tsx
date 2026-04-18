'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { User, Phone, Mail, Building2, Users, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';

interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  systemRole: string;
  platformRole?: string;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    setupCompleted?: boolean;
    isActive?: boolean;
  };
  registrationCompleted?: boolean;
}

export default function ProfilePage() {
  const { user } = useAuthStore();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: UserProfile }>(API_ROUTES.USERS.ME);
      return response.data.data;
    },
    enabled: !!user,
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
        <p className="text-body-md text-on-surface-variant">פרטים אישיים והגדרות חשבון</p>
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
            <p className="text-body-lg font-medium">{profile?.organization?.name || 'לא משויך'}</p>
          </div>

          {/* Role */}
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              תפקיד
            </p>
            <p className="text-body-lg font-medium">{profile?.systemRole || 'לא הוגדר'}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
