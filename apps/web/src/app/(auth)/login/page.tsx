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

  // Redirect only if user arrives at /login already authenticated (e.g. bookmark).
  // Do NOT redirect when isAuthenticated flips during OTP verification —
  // OtpVerification handles post-login routing to the correct destination.
  const wasAuthOnMount = React.useRef(isAuthenticated);

  React.useEffect(() => {
    if (wasAuthOnMount.current) {
      router.replace('/');
    }
  }, []); // only on mount

  if (wasAuthOnMount.current) {
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
          <h1 className="text-headline-lg font-headline mb-2">ניהול עמותות</h1>
          <p className="text-body-md text-on-surface-variant">ברוכים הבאים למערכת ניהול העמותות</p>
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
          © {new Date().getFullYear()} ניהול עמותות. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  );
}
