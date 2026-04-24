'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { ToastProvider } from '@/components/ui/Toast';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/platform', label: 'סקירה כללית' },
  { href: '/platform/organizations', label: 'עמותות' },
  { href: '/platform/admin', label: 'ניהול נתונים' },
];

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const hasCheckedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    if (!isHydrated || hasCheckedRef.current) return;

    if (!isAuthenticated) {
      hasCheckedRef.current = true;
      router.replace('/login?redirect=/platform');
      return;
    }

    if (user?.platformRole !== 'SUPER_ADMIN') {
      hasCheckedRef.current = true;
      router.replace('/');
      return;
    }

    hasCheckedRef.current = true;
  }, [isAuthenticated, user, isHydrated, router]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isHydrated || !isAuthenticated || user?.platformRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Strict';
    }
    router.replace('/login');
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface" dir="rtl">
        {/* Top nav */}
        <header className="sticky top-0 z-30 bg-primary text-on-primary shadow-ambient-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="sm:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-on-primary/10"
                aria-label="תפריט"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <h1 className="text-title-sm sm:text-title-md font-headline">ניהול פלטפורמה</h1>
              <nav className="hidden sm:flex items-center gap-1">
                {NAV_LINKS.map((link) => {
                  const isActive =
                    link.href === '/platform'
                      ? pathname === '/platform'
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 rounded-md text-label-md transition-colors ${
                        isActive
                          ? 'bg-on-primary/20 text-on-primary'
                          : 'text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="text-label-sm sm:text-label-md text-on-primary/70 hover:text-on-primary transition-colors"
            >
              התנתקות
            </button>
          </div>

          {/* Mobile nav dropdown */}
          {mobileNavOpen && (
            <nav className="sm:hidden border-t border-on-primary/20 px-4 py-2 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === '/platform'
                    ? pathname === '/platform'
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-3 py-2.5 rounded-md text-body-md transition-colors ${
                      isActive
                        ? 'bg-on-primary/20 text-on-primary'
                        : 'text-on-primary/70 hover:text-on-primary hover:bg-on-primary/10'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
