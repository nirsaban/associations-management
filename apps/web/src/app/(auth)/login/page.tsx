'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PhoneForm } from './_components/PhoneForm';
import { OrganizationSelection } from './_components/OrganizationSelection';
import { OtpVerification } from './_components/OtpVerification';
import { BiometryLogin } from './_components/BiometryLogin';

type Organization = {
  id: string;
  name: string;
  userRole: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'org-selection' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  // Avoid SSR/hydration mismatch: render the loader on first paint, then on
  // the client read the real auth state. After mount we capture whether the
  // user was *already* authenticated (e.g. PWA standalone where localStorage
  // survives between Safari and the home-screen app). If yes — redirect
  // home. If they sign in here via OTP, isAuthenticated will flip but
  // hadInitialAuth stays false, so OtpVerification handles routing.
  const [mounted, setMounted] = React.useState(false);
  const [hadInitialAuth, setHadInitialAuth] = React.useState(false);
  const decisionLockedRef = React.useRef(false);

  React.useEffect(() => {
    if (decisionLockedRef.current) return;
    decisionLockedRef.current = true;

    const decodeExp = (token: string): number => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return 0;
        const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
        return (JSON.parse(json).exp as number) || 0;
      } catch {
        return 0;
      }
    };

    const writeCookie = (token: string): boolean => {
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `auth_token=${token}; path=/; max-age=3600; SameSite=Lax${secure}`;
      return document.cookie.split(';').some((c) => c.trim().startsWith('auth_token='));
    };

    const wipeAndShowForm = () => {
      try { sessionStorage.removeItem('login-loop-started-at'); } catch {}
      const { logout } = useAuthStore.getState();
      logout();
      const secureClear = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax${secureClear}`;
      document.cookie = `auth_token=; path=/; max-age=0; SameSite=Strict${secureClear}`;
      setHadInitialAuth(false);
      setMounted(true);
    };

    const state = useAuthStore.getState();
    if (!state.isAuthenticated || !state.accessToken) {
      try { sessionStorage.removeItem('login-loop-started-at'); } catch {}
      setHadInitialAuth(false);
      setMounted(true);
      return;
    }

    // 5-second loop watchdog — set BEFORE any redirect so consecutive
    // arrivals at /login from a bouncing middleware see an accumulating
    // elapsed time, and we break out after 5s instead of spinning.
    const now = Date.now();
    let startedAt = now;
    try {
      const stored = sessionStorage.getItem('login-loop-started-at');
      if (stored) {
        startedAt = Number(stored) || now;
      } else {
        sessionStorage.setItem('login-loop-started-at', String(now));
      }
    } catch {
      // sessionStorage unavailable — fall through, no loop protection
    }
    if (now - startedAt > 5000) {
      wipeAndShowForm();
      return;
    }

    // Decide whether the access token is still valid. The middleware rejects
    // expired JWTs, so writing an expired token to the cookie would put us
    // straight back at /login. If expired, refresh first.
    const expSec = decodeExp(state.accessToken);
    const isExpired = expSec > 0 && expSec * 1000 < Date.now() + 30_000; // 30s skew

    const proceedWithToken = (token: string) => {
      if (!writeCookie(token)) {
        // Browser silently rejected the cookie write — unrecoverable.
        wipeAndShowForm();
        return;
      }
      setHadInitialAuth(true);
      setMounted(true);
      router.replace('/');
    };

    if (!isExpired) {
      proceedWithToken(state.accessToken);
      return;
    }

    // Access token is expired. Try to refresh it BEFORE redirecting, so
    // the cookie we write actually passes middleware verification.
    if (!state.refreshToken) {
      wipeAndShowForm();
      return;
    }

    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
        const res = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: state.refreshToken }),
        });
        if (!res.ok) throw new Error('refresh failed');
        const json = await res.json();
        const newAccess = json?.data?.accessToken;
        const newRefresh = json?.data?.refreshToken;
        if (!newAccess) throw new Error('no access token in refresh response');
        useAuthStore.getState().setTokens(newAccess, newRefresh ?? state.refreshToken);
        proceedWithToken(newAccess);
      } catch {
        wipeAndShowForm();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || (hadInitialAuth && isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handlePhoneSuccess = (
    phoneNumber: string,
    session: string,
    requiresOrgSelection: boolean,
    orgs?: Organization[],
  ) => {
    // Clear any stale auth state from a previous session before proceeding
    // This prevents multi-tab conflicts where old tokens persist
    const { logout } = useAuthStore.getState();
    logout();
    if (typeof document !== 'undefined') {
      const secureClear = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax${secureClear}`;
      document.cookie = `auth_token=; path=/; max-age=0; SameSite=Strict${secureClear}`;
    }

    setPhone(phoneNumber);
    setSessionId(session);

    if (requiresOrgSelection && orgs && orgs.length > 1) {
      setOrganizations(orgs);
      setStep('org-selection');
    } else {
      setSelectedOrganizationId(orgs?.[0]?.id || null);
      setStep('otp');
    }
  };

  const handleOrganizationSelect = (orgId: string) => {
    setSelectedOrganizationId(orgId);
    setStep('otp');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-container/20 to-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="mb-12 text-center">
          <img src="/logo.jpeg" alt="נחלת דוד" className="h-20 w-20 rounded-full mx-auto mb-3 object-cover shadow-md" />
          <h1 className="text-headline-lg font-headline mb-2">נחלת דוד</h1>
          <p className="text-body-md text-on-surface-variant">מוסדות תורה וחסד לעילוי נשמת הרה״ג דוד עשור זצ״ל</p>
        </div>

        {/* Card */}
        <div className="card-elevated">
          {step === 'phone' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-title-lg font-medium mb-2">כניסה למערכת</h2>
                <p className="text-body-sm text-on-surface-variant">
                  הקלד את מספר הטלפון שלך כדי להתחיל
                </p>
              </div>
              <BiometryLogin onFallbackToOtp={() => { /* already on phone step */ }} />
              <PhoneForm onSuccess={handlePhoneSuccess} />
            </div>
          )}

          {step === 'org-selection' && (
            <div className="space-y-8">
              <OrganizationSelection
                phone={phone}
                organizations={organizations}
                onSelect={handleOrganizationSelect}
                onBack={() => setStep('phone')}
              />
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-title-lg font-medium mb-2">אימות OTP</h2>
              </div>
              <OtpVerification
                phone={phone}
                sessionId={sessionId}
                organizationId={selectedOrganizationId}
                onBack={() => {
                  if (organizations.length > 1) {
                    setStep('org-selection');
                  } else {
                    setStep('phone');
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-body-sm text-on-surface-variant mt-8">
          © {new Date().getFullYear()} נחלת דוד. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  );
}
