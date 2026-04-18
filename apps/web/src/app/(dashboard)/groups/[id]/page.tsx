'use client';

import React from 'react';
import { useGroups } from '@/hooks/useGroups';
import { AlertCircle, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

interface GroupDetailPageProps {
  params: {
    id: string;
  };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { get } = useGroups();
  const { data: group, isLoading, error } = get(params.id);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <div className="card h-20 animate-pulse bg-surface-container" />
          <div className="card h-40 animate-pulse bg-surface-container" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הקבוצה</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/groups" className="flex items-center gap-2 text-primary hover:underline mb-6">
        <ArrowRight className="h-4 w-4" />
        חזרה לקבוצות
      </Link>

      {/* Group Header */}
      <div className="card-elevated mb-8">
        <h1 className="text-headline-md font-headline mb-2">{group.name}</h1>
        {group.description && (
          <p className="text-body-md text-on-surface-variant mb-6">{group.description}</p>
        )}

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">סה"כ חברים</p>
            <p className="text-headline-sm font-bold text-primary">{group.memberCount}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">משפחות</p>
            <p className="text-headline-sm font-bold text-secondary">
              {group.members?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">מנהלים</p>
            <p className="text-headline-sm font-bold text-tertiary">
              {group.managerIds?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Members Section */}
      {group.members && group.members.length > 0 && (
        <div>
          <h2 className="text-headline-md font-headline mb-4">חברי הקבוצה</h2>
          <div className="space-y-3">
            {group.members.map((member) => (
              <div key={member.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-title-md font-medium">{member.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{member.phone}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-label-sm font-medium">
                    {member.role === 'manager'
                      ? 'מנהל'
                      : member.role === 'distributor'
                        ? 'מחלק'
                        : 'חבר'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
