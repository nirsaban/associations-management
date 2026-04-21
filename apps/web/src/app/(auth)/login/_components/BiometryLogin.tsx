'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isWebAuthnSupported, authenticateWebAuthn } from '@/lib/webauthn';
import { useAuthStore, User } from '@/store/auth.store';

interface BiometryLoginProps {
  onFallbackToOtp: () => void;
}

export function BiometryLogin({ onFallbackToOtp: _onFallbackToOtp }: BiometryLoginProps) {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [supported, setSupported] = useState(false);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const isSupported = await isWebAuthnSupported();
      setSupported(isSupported);

      // Check if there's a saved phone for biometry login
      const phone = localStorage.getItem('amutot_biometry_phone');
      if (phone) setSavedPhone(phone);
    }
    check();
  }, []);

  // Don't render anything if biometry is not available or no saved phone
  if (!supported || !savedPhone) {
    return null;
  }

  const handleBiometryLogin = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await authenticateWebAuthn(savedPhone);

      // Set auth state
      setUser(result.user as unknown as User);
      setTokens(result.accessToken, result.refreshToken);

      // Set cookie for middleware
      const secure = window.location.protocol === 'https:';
      document.cookie = `auth_token=${result.accessToken}; path=/; max-age=3600; SameSite=Strict${secure ? '; Secure' : ''}`;

      // Check activation status + group manager flag
      let meData: Record<string, unknown> | null = null;
      try {
        const { default: api } = await import('@/lib/api');
        const meRes = await api.get('/auth/me');
        meData = meRes.data.data;
        if (!meData?.activationCompleted) {
          router.replace('/activation');
          return;
        }
        // Persist group info into auth store
        if (meData) {
          const current = useAuthStore.getState().user;
          if (current) {
            useAuthStore.getState().setUser({
              ...current,
              isGroupManager: !!meData.isGroupManager,
              managedGroupId: (meData.managedGroupId as string) ?? null,
              groupMembershipGroupId: (meData.groupMembershipGroupId as string) ?? null,
            });
          }
        }
      } catch {
        // Proceed to normal flow on error
      }

      // Navigate based on role
      const user = result.user as Record<string, unknown>;
      if (user.platformRole === 'SUPER_ADMIN') {
        router.replace('/platform');
      } else if (meData?.isGroupManager) {
        router.replace('/manager/dashboard');
      } else {
        router.replace('/user/dashboard');
      }
    } catch {
      setError('זיהוי ביומטרי נכשל');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleBiometryLogin}
        disabled={isAuthenticating}
        className="btn-primary w-full py-3 text-title-md flex items-center justify-center gap-2"
      >
        {isAuthenticating ? (
          <span>מזהה...</span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
            <span>זיהוי עם Face ID / Touch ID</span>
          </>
        )}
      </button>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container text-center">
          {error}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-4 text-body-sm text-on-surface-variant">או</span>
        </div>
      </div>
    </div>
  );
}
