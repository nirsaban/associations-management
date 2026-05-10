import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();
const webStore = {
  getItem: (k: string) => Promise.resolve(globalThis.localStorage?.getItem(k) ?? null),
  setItem: (k: string, v: string) => {
    globalThis.localStorage?.setItem(k, v);
    return Promise.resolve();
  },
  removeItem: (k: string) => {
    globalThis.localStorage?.removeItem(k);
    return Promise.resolve();
  },
};

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webStore.getItem(key);
    try {
      return (await SecureStore.getItemAsync(key)) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return webStore.setItem(key, value);
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') return webStore.removeItem(key);
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

export const StorageKeys = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;
