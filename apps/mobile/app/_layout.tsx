import '../global.css';
import '@/i18n';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { registerForPushAsync } from '@/push/register';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function AuthGate() {
  const segments = useSegments();
  const router = useRouter();
  const { hydrated, accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!accessToken && !inAuthGroup) router.replace('/(auth)/phone');
    else if (accessToken && inAuthGroup) router.replace('/(app)/');
  }, [hydrated, accessToken, segments]);

  useEffect(() => {
    if (accessToken && user) {
      registerForPushAsync().catch(() => {});
    }
  }, [accessToken, user?.id]);

  if (!hydrated) {
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
