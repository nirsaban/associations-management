import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { useAuthStore } from '@/store/auth.store';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    await logout();
    return null;
  }
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const data = res.data?.data ?? res.data;
    const accessToken: string = data.accessToken;
    const newRefresh: string = data.refreshToken ?? refreshToken;
    await setTokens(accessToken, newRefresh);
    return accessToken;
  } catch {
    await logout();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? doRefresh();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
        return api.request(original);
      }
    }
    return Promise.reject(error);
  }
);

export function unwrap<T>(data: any): T {
  return (data?.data ?? data) as T;
}
