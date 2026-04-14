'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { api } from '@/lib/api';

const NAVIGATION = {
  SUPER_ADMIN: [
    { label: 'פלטפורמה', href: '/platform-secret/admins', icon: 'settings' },
  ],
  ADMIN: [
    { label: 'בית', href: '/', icon: 'home' },
    { label: 'משתמשים', href: '/admin/users', icon: 'users' },
    { label: 'קבוצות', href: '/groups', icon: 'users-group' },
    { label: 'משפחות', href: '/families', icon: 'home' },
    { label: 'תשלומים', href: '/payments', icon: 'credit-card' },
    { label: 'CSV Import', href: '/admin/csv-import', icon: 'upload' },
  ],
  USER: [
    { label: 'בית', href: '/', icon: 'home' },
    { label: 'תשלומים', href: '/payments', icon: 'credit-card' },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { logout } = useAuth();
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Role-based routing logic
  useEffect(() => {
    let isMounted = true;

    const checkAndRedirect = async () => {
      if (!isAuthenticated || !user) {
        router.replace('/login');
        return;
      }

      // SUPER_ADMIN should use platform routes, not dashboard
      if (user.systemRole === 'SUPER_ADMIN') {
        router.replace('/platform-secret/admins');
        return;
      }

      // ADMIN users must complete setup wizard first
      if (user.systemRole === 'ADMIN' && user.organizationId) {
        try {
          const response = await api.get(`/associations/me`);
          const association = response.data.data;

          if (!association.setupCompleted && isMounted) {
            router.replace('/setup/association');
            return;
          }
        } catch (error) {
          console.error('Failed to check association setup status:', error);
        }
      }

      if (isMounted) {
        setIsCheckingSetup(false);
      }
    };

    checkAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]); // Removed router from dependencies

  // Show loading while checking
  if (!isAuthenticated || isCheckingSetup) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body-md text-on-surface-variant">טוען...</p>
        </div>
      </div>
    );
  }

  const userRole = user?.systemRole || 'USER';
  const navItems = NAVIGATION[userRole as keyof typeof NAVIGATION] || NAVIGATION.USER;

  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed start-0 top-0 z-40 h-full w-64 border-e border-border bg-surface-container-low transition-transform duration-300 overflow-y-auto md:relative md:translate-x-0`}
      >
        <div className="sticky top-0 border-b border-border bg-surface-container-low px-6 py-6">
          <h1 className="text-headline-sm font-headline">ניהול עמותות</h1>
          <p className="text-label-sm text-on-surface-variant mt-1">
            {user?.name || user?.phone}
          </p>
        </div>

        <nav className="px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-md text-body-md transition-colors hover:bg-primary/10 active:bg-primary/20"
              onClick={() => {
                // Close sidebar on mobile
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 start-0 end-0 border-t border-border bg-surface-container-low px-4 py-6">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-body-md text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-surface-container-low px-6 py-4 flex items-center justify-between md:justify-end">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-surface-container rounded-md transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
