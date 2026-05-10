import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

function roleLabelKey(u: ReturnType<typeof useAuthStore.getState>['user']): string {
  if (!u) return 'home.role.USER';
  if (u.platformRole === 'SUPER_ADMIN') return 'home.role.SUPER_ADMIN';
  if (u.systemRole === 'ADMIN') return 'home.role.ADMIN';
  return 'home.role.USER';
}

function Tile({ href, label }: { href: any; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable className="bg-white border border-gray-200 rounded-2xl py-5 px-4 mb-3 active:bg-gray-50">
        <Text className="text-right text-lg font-semibold">{label}</Text>
      </Pressable>
    </Link>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isAdmin = user?.systemRole === 'ADMIN' || user?.platformRole === 'SUPER_ADMIN';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-right">
          {t('home.welcome', { name: user?.name ?? '' })}
        </Text>
        <Text className="text-base text-gray-600 text-right mt-1 mb-6">
          {t(roleLabelKey(user))}
        </Text>

        <Tile href="/(app)/distributor" label={t('distributor.title')} />
        <Tile href="/(app)/group" label={t('group.title')} />
        <Tile href="/(app)/alerts" label={t('alerts.title')} />
        <Tile href="/(app)/manager-distributor" label={t('manager.weeklyTitle')} />
        {isAdmin && <Tile href="/(app)/families" label={t('families.title')} />}

        <Pressable
          onPress={logout}
          className="mt-6 rounded-2xl py-4 items-center bg-red-500"
        >
          <Text className="text-white text-lg font-semibold">{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
