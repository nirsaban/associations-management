'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    console.log('[Platform Layout] Auth check:', { isAuthenticated, role: user?.platformRole, hasChecked: hasCheckedRef.current });

    if (hasCheckedRef.current) {
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated) {
      console.log('[Platform Layout] Not authenticated, redirecting to login');
      hasCheckedRef.current = true;
      router.replace('/login');
      return;
    }

    // Only SUPER_ADMIN can access platform routes
    if (user?.platformRole !== 'SUPER_ADMIN') {
      console.log('[Platform Layout] Not SUPER_ADMIN, this should not happen!');
      hasCheckedRef.current = true;
      // Don't redirect to avoid loops - just show error
      return;
    }

    console.log('[Platform Layout] SUPER_ADMIN confirmed, showing platform UI');
    hasCheckedRef.current = true;
  }, [isAuthenticated, user]);

  // Show loading while checking auth
  if (!isAuthenticated || user?.platformRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {children}
    </div>
  );
}
