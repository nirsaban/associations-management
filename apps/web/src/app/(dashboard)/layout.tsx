'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Menu, LogOut, Home, Users, CreditCard, Upload, Bell, Truck, ShoppingCart, Heart, UserCircle, Building2, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { api } from '@/lib/api';

// Full navigation items per role
const NAVIGATION = {
  SUPER_ADMIN: [{ label: 'פלטפורמה', href: '/platform', icon: Home }],
  ADMIN: [
    { label: 'דשבורד ניהול', href: '/admin', icon: CreditCard },
    { label: 'משתמשים', href: '/admin/users', icon: Users },
    { label: 'קבוצות', href: '/admin/groups', icon: Users },
    { label: 'משפחות', href: '/admin/families', icon: Home },
    { label: 'הזמנות', href: '/admin/orders', icon: ShoppingCart },
    { label: 'תשלומים', href: '/payments', icon: CreditCard },
    { label: 'ייבוא משתמשים', href: '/admin/csv-import', icon: Upload },
    { label: 'ייבוא קבוצות', href: '/admin/groups-import', icon: Upload },
    { label: 'ייבוא משפחות', href: '/admin/families-import', icon: Upload },
    { label: 'התראות', href: '/admin/alerts', icon: Bell },
    { label: 'פרופיל עמותה', href: '/admin/organization/profile', icon: Building2 },
    { label: 'דף נחיתה', href: '/admin/landing', icon: Globe },
  ],
  USER: [
    { label: 'דף הבית', href: '/user/dashboard', icon: Home },
    { label: 'הקבוצה שלי', href: '/user/my-group', icon: Users },
    { label: 'המשפחות שלי', href: '/user/families', icon: Heart },
    { label: 'התרומות שלי', href: '/user/my-donations', icon: CreditCard },
    { label: 'התראות', href: '/notifications', icon: Bell },
    { label: 'פרופיל', href: '/profile', icon: UserCircle },
  ],
  GROUP_MANAGER: [
    { label: 'דף הבית', href: '/manager/dashboard', icon: Home },
    { label: 'הקבוצה שלי', href: '/manager/my-group', icon: Users },
    { label: 'המשפחות שלי', href: '/manager/families', icon: Heart },
    { label: 'התרומות שלי', href: '/manager/my-donations', icon: CreditCard },
    { label: 'הזמנות שבועיות', href: '/manager/weekly-orders', icon: ShoppingCart },
    { label: 'מחלק שבועי', href: '/manager/weekly-distributor', icon: Truck },
    { label: 'התראות', href: '/notifications', icon: Bell },
  ],
  WEEKLY_DISTRIBUTOR: [
    { label: 'בית', href: '/', icon: Home },
    { label: 'חלוקה שבועית', href: '/distributor/current', icon: Truck },
    { label: 'התראות', href: '/notifications', icon: Bell },
  ],
};

// Bottom nav shows max 5 priority items on mobile
const BOTTOM_NAV = {
  ADMIN: [
    { label: 'דשבורד', href: '/admin', icon: CreditCard },
    { label: 'משתמשים', href: '/admin/users', icon: Users },
    { label: 'קבוצות', href: '/admin/groups', icon: Users },
    { label: 'משפחות', href: '/admin/families', icon: Home },
    { label: 'עוד', href: '__more__', icon: Menu },
  ],
  USER: [
    { label: 'בית', href: '/user/dashboard', icon: Home },
    { label: 'קבוצה', href: '/user/my-group', icon: Users },
    { label: 'משפחות', href: '/user/families', icon: Heart },
    { label: 'תרומות', href: '/user/my-donations', icon: CreditCard },
    { label: 'עוד', href: '__more__', icon: Menu },
  ],
  GROUP_MANAGER: [
    { label: 'בית', href: '/manager/dashboard', icon: Home },
    { label: 'קבוצה', href: '/manager/my-group', icon: Users },
    { label: 'משפחות', href: '/manager/families', icon: Heart },
    { label: 'תרומות', href: '/manager/my-donations', icon: CreditCard },
    { label: 'עוד', href: '__more__', icon: Menu },
  ],
  WEEKLY_DISTRIBUTOR: [
    { label: 'בית', href: '/', icon: Home },
    { label: 'חלוקה', href: '/distributor/current', icon: Truck },
    { label: 'התראות', href: '/notifications', icon: Bell },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasRedirectedRef = useRef(false);
  const checkIdRef = useRef(0);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Fetch org profile for chrome (logo, name, colors)
  const { data: orgProfile } = useQuery({
    queryKey: ['org-public-profile'],
    queryFn: async () => {
      const res = await api.get('/organization/profile');
      return res.data.data;
    },
    enabled: isAuthenticated && !!user?.organizationId && user?.systemRole !== undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Close more menu on route change
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

  // Close more menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!isHydrated || hasRedirectedRef.current) {
      return;
    }

    // Use a monotonic counter so only the latest invocation writes state.
    const myId = ++checkIdRef.current;

    const checkAndRedirect = async () => {
      const currentState = useAuthStore.getState();
      const currentUser = currentState.user;
      const currentIsAuth = currentState.isAuthenticated;

      if (!currentIsAuth || !currentUser) {
        hasRedirectedRef.current = true;
        router.replace('/login');
        return;
      }

      if (currentUser.platformRole === 'SUPER_ADMIN') {
        hasRedirectedRef.current = true;
        router.replace('/platform');
        return;
      }

      if (currentUser.systemRole === 'ADMIN' && currentUser.organizationId) {
        try {
          const response = await api.get(`/organization/me`);
          const organization = response.data.data;

          if (!organization.setupCompleted && myId === checkIdRef.current) {
            hasRedirectedRef.current = true;
            router.replace('/setup/organization');
            return;
          }
        } catch {
          // If we can't check, proceed
        }
      }

      // Guard: prevent users from accessing routes above their role
      if (myId === checkIdRef.current) {
        const currentPath = window.location.pathname;
        const role = currentUser.systemRole;
        const isGroupManager = currentUser.isGroupManager;

        if (currentPath.startsWith('/admin') && role !== 'ADMIN') {
          hasRedirectedRef.current = true;
          router.replace(isGroupManager ? '/manager/dashboard' : '/user/dashboard');
          return;
        }
        if (currentPath.startsWith('/manager') && role !== 'ADMIN' && !isGroupManager) {
          hasRedirectedRef.current = true;
          router.replace('/user/dashboard');
          return;
        }
        if (currentPath.startsWith('/platform') && currentUser.platformRole !== 'SUPER_ADMIN') {
          hasRedirectedRef.current = true;
          router.replace(role === 'ADMIN' ? '/admin' : '/user/dashboard');
          return;
        }

        setIsCheckingSetup(false);
      }
    };

    checkAndRedirect();
  }, [isAuthenticated, isHydrated, router, pathname]);

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
  else if (user?.isGroupManager) navKey = 'GROUP_MANAGER';
  const navItems = NAVIGATION[navKey] ?? NAVIGATION.USER;
  const bottomNavItems = BOTTOM_NAV[navKey as keyof typeof BOTTOM_NAV] ?? BOTTOM_NAV.USER;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-surface" dir="rtl">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-s border-outline/30 bg-surface-container-low">
        <div className="border-b border-outline/30 px-6 py-5">
          <div className="flex items-center gap-3">
            {orgProfile?.logoUrl && (
              <img src={orgProfile.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-headline-sm font-headline truncate">{orgProfile?.name || 'ניהול עמותות'}</h1>
              <p className="text-label-sm text-on-surface-variant mt-0.5 truncate">{user?.name || user?.phone}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-body-md transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-outline/30 px-3 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-body-md text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header — mobile */}
        <header className="md:hidden border-b border-outline/30 bg-surface-container-low px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {orgProfile?.logoUrl && (
              <img src={orgProfile.logoUrl} alt="" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
            )}
            <h1 className="text-title-sm font-headline truncate">{orgProfile?.name || 'ניהול עמותות'}</h1>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-md text-error hover:bg-error/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="התנתק"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-low border-t border-outline/30 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            if (item.href === '__more__') {
              return (
                <button
                  key="more"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[64px] rounded-md transition-colors ${
                    moreMenuOpen ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[64px] rounded-md transition-colors ${
                  active ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                <div className={`p-1 rounded-full transition-colors ${active ? 'bg-primary/10' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* "More" menu — slides up from bottom nav on mobile */}
      {moreMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/50"
            onClick={() => setMoreMenuOpen(false)}
          />
          <div className="md:hidden fixed bottom-16 inset-x-0 z-40 bg-surface-container-lowest rounded-t-2xl shadow-lg border-t border-outline/30 max-h-[60vh] overflow-y-auto safe-area-bottom">
            <div className="p-2">
              <div className="w-10 h-1 bg-outline/30 rounded-full mx-auto mb-3" />
              <nav className="space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-body-md transition-colors ${
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
