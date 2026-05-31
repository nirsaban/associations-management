import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlatformRole = 'SUPER_ADMIN';
export type SystemRole = 'ADMIN' | 'USER';

export interface ManagedGroup {
  id: string;
  name: string;
}

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
  managedGroups?: ManagedGroup[]; // All groups this user manages, ordered oldest-first
  groupMembershipGroupId?: string | null; // group the user belongs to (any role)
  createdAt: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Active managed group for multi-group managers
  activeManagedGroupId: string | null;
  setActiveManagedGroupId: (id: string | null) => void;

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
      activeManagedGroupId: null,

      setUser: (user) => {
        const current = get();
        let newActiveManagedGroupId = current.activeManagedGroupId;

        if (!user) {
          // Logged out — reset active group
          newActiveManagedGroupId = null;
        } else {
          const groups = user.managedGroups ?? [];
          const defaultId = user.managedGroupId ?? null;

          // If the stored active id is no longer in the new groups list, reset
          if (
            newActiveManagedGroupId !== null &&
            groups.length > 0 &&
            !groups.some((g) => g.id === newActiveManagedGroupId)
          ) {
            newActiveManagedGroupId = null;
          }

          // If no active group selected yet, default to managedGroupId (first group)
          if (newActiveManagedGroupId === null) {
            newActiveManagedGroupId = defaultId;
          }

          // If no groups at all, keep null
          if (groups.length === 0) {
            newActiveManagedGroupId = defaultId;
          }
        }

        // Detect user change (different id) — reset active group
        const prevUserId = current.user?.id ?? null;
        const nextUserId = user?.id ?? null;
        if (prevUserId !== null && nextUserId !== null && prevUserId !== nextUserId) {
          newActiveManagedGroupId = user?.managedGroupId ?? null;
        }

        set({ user, isAuthenticated: !!user, activeManagedGroupId: newActiveManagedGroupId });
      },

      setActiveManagedGroupId: (id) => set({ activeManagedGroupId: id }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          activeManagedGroupId: null,
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
        activeManagedGroupId: state.activeManagedGroupId,
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
