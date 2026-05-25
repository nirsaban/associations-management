'use client';

import React, { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { COMMUNITY_PROFESSIONS_ENABLED } from '@/lib/feature-flags';

interface Tab {
  label: string;
  href: string;
}

const TABS: Tab[] = [
  { label: 'אנשים', href: '/community/people' },
  { label: 'העברה הלאה', href: '/community/pass-it-on' },
  { label: 'תהילים', href: '/community/tehillim' },
  { label: 'זמני היום', href: '/community/zmanim' },
];

export default function CommunityLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Server-side guard is not available in a client component layout,
  // so we do a client-side redirect when the feature flag is off.
  useEffect(() => {
    if (!COMMUNITY_PROFESSIONS_ENABLED) {
      router.replace('/');
    }
  }, [router]);

  if (!COMMUNITY_PROFESSIONS_ENABLED) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-0" dir="rtl">
      {/* Tab bar */}
      <div className="border-b border-outline/30 bg-surface-container-low px-4 sm:px-6">
        <nav className="flex gap-0" aria-label="ניווט קהילה">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-4 py-3 text-body-md font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
