'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function SetupLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Only ADMIN users can access setup routes
    if (user?.systemRole !== 'ADMIN') {
      router.replace('/');
      return;
    }
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
