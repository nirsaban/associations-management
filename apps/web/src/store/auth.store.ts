import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlatformRole = 'SUPER_ADMIN';
export type SystemRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  platformRole?: PlatformRole; // Only set for SUPER_ADMIN
  systemRole: SystemRole;
  organizationId: string | null; // Null for SUPER_ADMIN
  isGroupManager?: boolean; // true if user has GroupMembership.role=MANAGER
  managedGroupId?: string | null;
  groupMembershipGroupId?: string | null; // group the user belongs to (any role)
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

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

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
    },
  ),
);

// Sync auth state across browser tabs via storage events.
// When another tab logs in/out, this tab picks up the change and reloads
// to prevent stale UI from a different user's session.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'auth-store') return;

    const currentUser = useAuthStore.getState().user;
    let newUser: User | null = null;

    try {
      const parsed = JSON.parse(event.newValue ?? '{}');
      newUser = parsed?.state?.user ?? null;
    } catch {
      // Corrupted storage — treat as logout
    }

    const currentId = currentUser?.id ?? null;
    const newId = newUser?.id ?? null;

    // Different user or logged out from another tab — reload to sync
    if (currentId !== newId) {
      window.location.reload();
    }
  });
}
