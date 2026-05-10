import { create } from 'zustand';
import { secureStorage, StorageKeys } from '@/lib/storage';

export type PlatformRole = 'SUPER_ADMIN';
export type SystemRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  platformRole?: PlatformRole | null;
  systemRole: SystemRole;
  organizationId: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (t: { accessToken: string; refreshToken: string; user: AuthUser }) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  hydrated: false,
  hydrate: async () => {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      secureStorage.getItem(StorageKeys.accessToken),
      secureStorage.getItem(StorageKeys.refreshToken),
      secureStorage.getItem(StorageKeys.user),
    ]);
    set({
      accessToken,
      refreshToken,
      user: userJson ? (JSON.parse(userJson) as AuthUser) : null,
      hydrated: true,
    });
  },
  setSession: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      secureStorage.setItem(StorageKeys.accessToken, accessToken),
      secureStorage.setItem(StorageKeys.refreshToken, refreshToken),
      secureStorage.setItem(StorageKeys.user, JSON.stringify(user)),
    ]);
    set({ accessToken, refreshToken, user });
  },
  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      secureStorage.setItem(StorageKeys.accessToken, accessToken),
      secureStorage.setItem(StorageKeys.refreshToken, refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },
  logout: async () => {
    await Promise.all([
      secureStorage.removeItem(StorageKeys.accessToken),
      secureStorage.removeItem(StorageKeys.refreshToken),
      secureStorage.removeItem(StorageKeys.user),
    ]);
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
