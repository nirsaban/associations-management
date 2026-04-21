'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Root "/" page — pure redirect hub. Sends each role to its dedicated dashboard.
// DECISION: /dashboard is kept as an alias that redirects, so bookmarks don't break.

interface MeData {
  isGroupManager?: boolean;
  activationCompleted?: boolean;
}

export default function RootRedirectPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const redirectedRef = useRef(false);

  // Fetch /auth/me to resolve group manager status
  const { data: meData } = useQuery({
    queryKey: ['auth-me-role', user?.id],
    queryFn: async () => {
      const res = await api.get<{ data: MeData }>('/auth/me');
      return res.data.data;
    },
    enabled: !!user && user.platformRole !== 'SUPER_ADMIN',
  });

  useEffect(() => {
    if (!user || redirectedRef.current) return;

    // 1. SUPER_ADMIN → /platform
    if (user.platformRole === 'SUPER_ADMIN') {
      redirectedRef.current = true;
      router.replace('/platform');
      return;
    }

    // Wait for meData to resolve for non-admin users
    if (meData === undefined && user.systemRole !== 'ADMIN') return;

    // 2. Group Manager → /manager/dashboard
    if (meData?.isGroupManager || user.isGroupManager) {
      redirectedRef.current = true;
      router.replace('/manager/dashboard');
      return;
    }

    // 3. ADMIN → /admin
    if (user.systemRole === 'ADMIN') {
      redirectedRef.current = true;
      router.replace('/admin');
      return;
    }

    // 4. Regular user → /user/dashboard
    redirectedRef.current = true;
    router.replace('/user/dashboard');
  }, [user, meData, router]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-body-md text-on-surface-variant">טוען...</p>
      </div>
    </div>
  );
}
