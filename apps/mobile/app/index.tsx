import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
  const { hydrated, accessToken } = useAuthStore();
  if (!hydrated) return null;
  return <Redirect href={accessToken ? '/(app)/' : '/(auth)/phone'} />;
}
