import { useCallback } from 'react';
import { useAuthStore, User } from '@/store/auth.store';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';

type Organization = {
  id: string;
  name: string;
  userRole: string;
};

interface LoginResponse {
  data: {
    message: string;
    otpSent: boolean;
    sessionId: string;
    requiresOrgSelection: boolean;
    organizations?: Organization[];
  };
}

interface VerifyOtpResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setTokens,
    setLoading,
    logout,
    isSuperAdmin,
    isAdmin,
    isUser,
  } = useAuthStore();

  const login = useCallback(
    async (
      phone: string,
    ): Promise<{
      sessionId: string;
      requiresOrgSelection: boolean;
      organizations?: Organization[];
    }> => {
      setLoading(true);
      try {
        const response = await api.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, {
          phone,
        });
        return {
          sessionId: response.data.data.sessionId,
          requiresOrgSelection: response.data.data.requiresOrgSelection,
          organizations: response.data.data.organizations,
        };
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  const verifyOtp = useCallback(
    async (
      phone: string,
      otp: string,
      sessionId: string,
      organizationId?: string | null,
    ): Promise<void> => {
      setLoading(true);
      try {
        const response = await api.post<VerifyOtpResponse>(API_ROUTES.AUTH.VERIFY_OTP, {
          phone,
          otp,
          sessionId,
          organizationId: organizationId || undefined,
        });

        const { user: userData, accessToken, refreshToken } = response.data.data;

        setUser(userData);
        setTokens(accessToken, refreshToken);

        // Set a cookie so the middleware can read the token for server-side routing.
        // SameSite=Strict prevents CSRF; Secure is set in production via HTTPS.
        // Max-Age matches the JWT access token TTL (1 hour = 3600 seconds).
        const secure = window.location.protocol === 'https:';
        document.cookie = `auth_token=${accessToken}; path=/; max-age=3600; SameSite=Strict${secure ? '; Secure' : ''}`;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser, setTokens],
  );

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await api.post(API_ROUTES.AUTH.LOGOUT);
    } finally {
      logout();
      // Clear the auth_token cookie used by middleware
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Strict';
      window.location.href = '/login';
    }
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    verifyOtp,
    logout: handleLogout,
    isSuperAdmin,
    isAdmin,
    isUser,
  };
}
