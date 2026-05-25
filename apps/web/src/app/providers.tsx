'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AuthCookieSync } from '@/components/auth-cookie-sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ServiceWorkerRegistration />
          <AuthCookieSync />
          {children}
          <ThemeToggle />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
