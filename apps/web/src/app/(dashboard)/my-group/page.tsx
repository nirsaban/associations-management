'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Users, User, AlertCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface GroupSummary {
  groupId: string;
  groupName: string;
  managerName?: string;
  membershipStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'active' | 'pending' | 'inactive';
  joinedAt?: string;
  memberCount?: number;
}

interface HomepageContext {
  group?: GroupSummary;
}

export default function MyGroupPage() {
  const { user } = useAuthStore();

  const {
    data: context,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['homepage-context-group', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: HomepageContext }>('/homepage/context');
      return response.data.data;
    },
    enabled: !!user,
  });

  const groupData = context?.group;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="card h-64 animate-pulse bg-surface-container" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת פרטי הקבוצה</span>
        </div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="card-elevated max-w-2xl">
          <div className="flex items-center gap-4 mb-4">
            <Info className="h-10 w-10 text-primary" />
            <div>
              <h2 className="text-headline-md font-headline">לא משויך לקבוצה</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                אינך משויך כרגע לקבוצה כלשהי
              </p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-4">
            צור קשר עם מנהל המערכת לשיוך לקבוצה
          </p>
        </div>
      </div>
    );
  }

  const rawStatus = groupData.membershipStatus?.toLowerCase();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'pending':
        return 'ממתין';
      case 'inactive':
        return 'לא פעיל';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-container text-on-success-container';
      case 'pending':
        return 'bg-warning-container text-on-warning-container';
      case 'inactive':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1 sm:mb-2">הקבוצה שלי</h1>
        <p className="text-body-md text-on-surface-variant">פרטי חברות בקבוצה</p>
      </div>

      {/* Group Information */}
      <div className="card-elevated">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-headline-md font-headline mb-1">{groupData.groupName}</h2>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-label-sm font-medium ${getStatusColor(rawStatus)}`}
              >
                {getStatusLabel(rawStatus)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Manager */}
          {groupData.managerName && (
            <div className="p-4 rounded-lg bg-surface-container">
              <p className="text-label-sm text-on-surface-variant mb-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                מנהל הקבוצה
              </p>
              <p className="text-body-lg font-medium">{groupData.managerName}</p>
            </div>
          )}

          {/* Member Count */}
          {groupData.memberCount !== undefined && (
            <div className="p-4 rounded-lg bg-surface-container">
              <p className="text-label-sm text-on-surface-variant mb-1 flex items-center gap-2">
                <Users className="h-4 w-4" />
                מספר חברים
              </p>
              <p className="text-body-lg font-medium">{groupData.memberCount} חברים</p>
            </div>
          )}

          {/* Join Date */}
          {groupData.joinedAt && (
            <div className="p-4 rounded-lg bg-surface-container">
              <p className="text-label-sm text-on-surface-variant mb-1">תאריך הצטרפות</p>
              <p className="text-body-lg font-medium">
                {format(new Date(groupData.joinedAt), 'd MMMM yyyy', { locale: he })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Information Note */}
      <div className="card bg-primary-container/30 border-2 border-primary/20">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body-md font-medium text-primary mb-1">מידע על הקבוצה</p>
            <p className="text-body-sm text-on-surface-variant">
              הקבוצה מאפשרת ניהול משותף של משפחות ותפקידים שבועיים. לפרטים נוספים ניתן לפנות למנהל
              הקבוצה.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
