'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Only SUPER_ADMIN can access platform routes
    if (user?.systemRole !== 'SUPER_ADMIN') {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, user]);

  // Show loading while checking auth
  if (!isAuthenticated || user?.systemRole !== 'SUPER_ADMIN') {
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
