'use client';

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function SetupLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const hasCheckedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || hasCheckedRef.current) {
      return;
    }

    if (!isAuthenticated) {
      hasCheckedRef.current = true;
      router.replace('/login');
      return;
    }

    if (user?.systemRole !== 'ADMIN') {
      hasCheckedRef.current = true;
      router.replace('/');
      return;
    }

    hasCheckedRef.current = true;
  }, [isAuthenticated, user, isHydrated]);

  if (!isHydrated || !isAuthenticated || user?.systemRole !== 'ADMIN') {
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
