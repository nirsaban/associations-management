'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function SetupLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    console.log('[Setup Layout] Auth check:', { isAuthenticated, role: user?.systemRole, hasChecked: hasCheckedRef.current });

    if (hasCheckedRef.current) {
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated) {
      console.log('[Setup Layout] Not authenticated, redirecting to login');
      hasCheckedRef.current = true;
      router.replace('/login');
      return;
    }

    // Only ADMIN users can access setup routes
    if (user?.systemRole !== 'ADMIN') {
      console.log('[Setup Layout] Not ADMIN, redirecting to dashboard');
      hasCheckedRef.current = true;
      router.replace('/');
      return;
    }

    console.log('[Setup Layout] ADMIN confirmed, showing setup wizard');
    hasCheckedRef.current = true;
  }, [isAuthenticated, user]);

  // Show loading while checking auth
  if (!isAuthenticated || user?.systemRole !== 'ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-container/20 to-surface">
      {children}
    </div>
  );
}
