import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlatformRole = 'SUPER_ADMIN';
export type SystemRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  platformRole?: PlatformRole;  // Only set for SUPER_ADMIN
  systemRole: SystemRole;
  organizationId: string | null;  // Null for SUPER_ADMIN
  createdAt: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // Role helpers
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isUser: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      isSuperAdmin: () => get().user?.platformRole === 'SUPER_ADMIN',
      isAdmin: () => get().user?.systemRole === 'ADMIN',
      isUser: () => get().user?.systemRole === 'USER',
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
