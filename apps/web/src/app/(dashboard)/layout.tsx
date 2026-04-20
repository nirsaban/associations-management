'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { api } from '@/lib/api';

const NAVIGATION = {
  SUPER_ADMIN: [{ label: 'פלטפורמה', href: '/platform' }],
  ADMIN: [
    { label: 'בית', href: '/' },
    { label: 'דשבורד ניהול', href: '/admin' },
    { label: 'משתמשים', href: '/admin/users' },
    { label: 'קבוצות', href: '/admin/groups' },
    { label: 'משפחות', href: '/admin/families' },
    { label: 'תשלומים', href: '/payments' },
    { label: 'ייבוא משתמשים', href: '/admin/csv-import' },
    { label: 'ייבוא קבוצות', href: '/admin/groups-import' },
    { label: 'ייבוא משפחות', href: '/admin/families-import' },
  ],
  USER: [
    { label: 'בית', href: '/' },
    { label: 'הקבוצה שלי', href: '/my-group' },
    { label: 'התרומות שלי', href: '/my-donations' },
    { label: 'התראות', href: '/notifications' },
    { label: 'הפרופיל שלי', href: '/profile' },
  ],
  GROUP_MANAGER: [
    { label: 'בית', href: '/' },
    { label: 'דשבורד מנהל', href: '/manager/dashboard' },
    { label: 'הזמנות שבועיות', href: '/manager/weekly-orders' },
    { label: 'משפחות', href: '/manager/families' },
    { label: 'חברי קבוצה', href: '/manager/members' },
    { label: 'הקבוצה שלי', href: '/my-group' },
    { label: 'התראות', href: '/notifications' },
  ],
  WEEKLY_DISTRIBUTOR: [
    { label: 'בית', href: '/' },
    { label: 'חלוקה שבועית', href: '/distributor/current' },
    { label: 'התראות', href: '/notifications' },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { logout } = useAuth();
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    // If already hydrated (e.g. on client-side navigation)
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!isHydrated || hasRedirectedRef.current) {
      return;
    }

    let isMounted = true;

    const checkAndRedirect = async () => {
      if (!isAuthenticated || !user) {
        hasRedirectedRef.current = true;
        router.replace('/login');
        return;
      }

      // SUPER_ADMIN should go to platform area
      if (user.platformRole === 'SUPER_ADMIN') {
        hasRedirectedRef.current = true;
        router.replace('/platform');
        return;
      }

      // ADMIN users must complete setup wizard first
      if (user.systemRole === 'ADMIN' && user.organizationId) {
        try {
          const response = await api.get(`/organization/me`);
          const organization = response.data.data;

          if (!organization.setupCompleted && isMounted) {
            hasRedirectedRef.current = true;
            router.replace('/setup/organization');
            return;
          }
        } catch {
          // If we can't check, proceed
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
  }, [isAuthenticated, user, isHydrated]);

  if (!isHydrated || !isAuthenticated || isCheckingSetup) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body-md text-on-surface-variant">טוען...</p>
        </div>
      </div>
    );
  }

  // Determine navigation based on role
  let navKey: keyof typeof NAVIGATION = 'USER';
  if (user?.systemRole === 'ADMIN') navKey = 'ADMIN';
  // Note: GROUP_MANAGER and WEEKLY_DISTRIBUTOR are contextual roles
  // The homepage context will handle showing manager/distributor dashboards
  // For navigation, we show USER nav by default (they can navigate to manager pages from dashboard cards)
  const navItems = NAVIGATION[navKey] ?? NAVIGATION.USER;

  return (
    <div className="flex h-screen bg-surface" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } fixed end-0 top-0 z-40 h-full w-64 border-s border-outline/30 bg-surface-container-low transition-transform duration-300 overflow-y-auto md:relative md:translate-x-0`}
      >
        <div className="sticky top-0 border-b border-outline/30 bg-surface-container-low px-6 py-6">
          <h1 className="text-headline-sm font-headline">ניהול עמותות</h1>
          <p className="text-label-sm text-on-surface-variant mt-1">{user?.name || user?.phone}</p>
        </div>

        <nav className="px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-md text-body-md transition-colors hover:bg-primary/10 active:bg-primary/20"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 start-0 end-0 border-t border-outline/30 bg-surface-container-low px-4 py-6">
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="border-b border-outline/30 bg-surface-container-low px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between md:justify-start">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-surface-container rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="תפריט"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="md:hidden text-title-sm font-headline">ניהול עמותות</span>
          <div className="md:hidden w-10" />
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={toggleSidebar} />
      )}
    </div>
  );
}
