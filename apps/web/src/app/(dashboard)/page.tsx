'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { AdminDashboard } from './_components/AdminDashboard';
import { UserDashboard } from './_components/UserDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // SUPER_ADMIN must be redirected to platform area
    if (user.platformRole === 'SUPER_ADMIN') {
      router.replace('/platform-secret/admins');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body-md text-on-surface-variant">טוען...</p>
        </div>
      </div>
    );
  }

  if (user.platformRole === 'SUPER_ADMIN') {
    return (
      <div className="p-8">
        <p className="text-body-md text-on-surface-variant">מנהל פלטפורמה - מפנה לממשק ניהול...</p>
      </div>
    );
  }

  // ADMIN gets admin dashboard
  if (user.systemRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  // All others (USER, GROUP_MANAGER, WEEKLY_DISTRIBUTOR) get user dashboard
  // The user dashboard reads homepage context which includes manager/distributor data
  return <UserDashboard />;
}
