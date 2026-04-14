'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { AdminDashboard } from './_components/AdminDashboard';
import { UserDashboard } from './_components/UserDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="p-8">טוען...</div>;
  }

  // SUPER_ADMIN should be redirected to /platform-secret/admins (will handle in PHASE 10)
  if (user.systemRole === 'SUPER_ADMIN') {
    return (
      <div className="p-8">
        <p>מנהל פלטפורמה - מפנה לממשק ניהול...</p>
      </div>
    );
  }

  // ADMIN gets admin dashboard
  if (user.systemRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  // USER gets user dashboard
  return <UserDashboard />;
}
