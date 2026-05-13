import '../global.css';
import '@/i18n';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { registerForPushAsync } from '@/push/register';
import { useNotificationRouter } from '@/push/listeners';
import { isBiometricEnabled, authenticate } from '@/lib/biometric';
import { getMe } from '@/lib/auth.api';
import i18n from '@/i18n';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function AuthGate() {
  const segments = useSegments();
  const router = useRouter();
  const { hydrated, accessToken, user, logout } = useAuthStore();
  const [biometricLocked, setBiometricLocked] = useState(false);
  useNotificationRouter();

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    let cancelled = false;
    (async () => {
      const enabled = await isBiometricEnabled();
      if (!enabled || cancelled) return;
      setBiometricLocked(true);
      const ok = await authenticate(i18n.t('profile.biometric'));
      if (cancelled) return;
      if (ok) setBiometricLocked(false);
      else await logout();
    })();
    return () => { cancelled = true; };
  }, [hydrated, accessToken]);

  useEffect(() => {
    if (!hydrated || biometricLocked) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!accessToken && !inAuthGroup) router.replace('/(auth)/phone');
    else if (accessToken && inAuthGroup) router.replace('/(app)/');
  }, [hydrated, accessToken, segments, biometricLocked]);

  useEffect(() => {
    if (accessToken && user) {
      registerForPushAsync().catch(() => {});
      const isAdmin = user.systemRole === 'ADMIN' || user.platformRole === 'SUPER_ADMIN';
      if (isAdmin) {
        getMe()
          .then((me) => {
            if (me.setupCompleted === false) router.replace('/(app)/onboarding');
          })
          .catch(() => {});
      }
    }
  }, [accessToken, user?.id]);

  if (!hydrated || biometricLocked) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={qc}>
          <StatusBar style="auto" />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
