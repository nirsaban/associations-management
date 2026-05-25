'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { User, Phone, Mail, Building2, Users, AlertCircle, Briefcase, Edit2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { COMMUNITY_PROFESSIONS_ENABLED } from '@/lib/feature-flags';

interface ProfessionItem {
  id: string;
  nameHe: string;
  category: { id: string; nameHe: string };
}

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
  // Community fields (present when COMMUNITY_PROFESSIONS_ENABLED)
  primaryProfession?: ProfessionItem;
  secondaryProfessions?: ProfessionItem[];
  otherProfession?: string;
  shortBio?: string;
  showInCommunitySearch?: boolean;
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
          <span>שגיאה בטעינת הפרופיל</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl">
      {/* Header with edit button */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1 sm:mb-2">הפרופיל שלי</h1>
          <p className="text-body-md text-on-surface-variant">פרטים אישיים והגדרות חשבון</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/profile/business"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-primary text-label-md font-medium hover:bg-primary/5 transition-colors shrink-0"
          >
            <Briefcase className="h-4 w-4" />
            העסק שלי
          </Link>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Edit2 className="h-4 w-4" />
            ערוך פרופיל
          </Link>
        </div>
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

      {/* Community fields — only shown when feature flag is on */}
      {COMMUNITY_PROFESSIONS_ENABLED && (
        <div className="card-elevated">
          <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-tertiary" />
            קהילה ומקצוע
          </h2>

          <div className="space-y-4">
            {/* Short bio */}
            {profile?.shortBio && (
              <div className="p-4 rounded-lg bg-surface-container">
                <p className="text-label-sm text-on-surface-variant mb-1">ביוגרפיה</p>
                <p className="text-body-md">{profile.shortBio}</p>
              </div>
            )}

            {/* Primary profession */}
            {profile?.primaryProfession && (
              <div className="p-4 rounded-lg bg-surface-container">
                <p className="text-label-sm text-on-surface-variant mb-2">מקצוע ראשי</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-label-md font-medium">
                  {profile.primaryProfession.nameHe}
                  <span className="ms-1.5 text-primary/60 text-label-sm">
                    · {profile.primaryProfession.category.nameHe}
                  </span>
                </span>
              </div>
            )}

            {/* Secondary professions */}
            {profile?.secondaryProfessions && profile.secondaryProfessions.length > 0 && (
              <div className="p-4 rounded-lg bg-surface-container">
                <p className="text-label-sm text-on-surface-variant mb-2">מקצועות נוספים</p>
                <div className="flex flex-wrap gap-2">
                  {profile.secondaryProfessions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-label-sm"
                    >
                      {p.nameHe}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Other profession */}
            {profile?.otherProfession && (
              <div className="p-4 rounded-lg bg-surface-container">
                <p className="text-label-sm text-on-surface-variant mb-1">מקצוע אחר</p>
                <p className="text-body-md italic">{profile.otherProfession}</p>
              </div>
            )}

            {/* Community search visibility */}
            <div className="p-4 rounded-lg bg-surface-container">
              <p className="text-label-sm text-on-surface-variant mb-1">מופיע בחיפוש קהילה</p>
              <p className="text-body-md font-medium">
                {profile?.showInCommunitySearch === false ? 'לא' : 'כן'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
