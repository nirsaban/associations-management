import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';

function roleLabelKey(u: ReturnType<typeof useAuthStore.getState>['user']): string {
  if (!u) return 'home.role.USER';
  if (u.platformRole === 'SUPER_ADMIN') return 'home.role.SUPER_ADMIN';
  if (u.systemRole === 'ADMIN') return 'home.role.ADMIN';
  return 'home.role.USER';
}

export default function Home() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-right">
          {t('home.welcome', { name: user?.name ?? '' })}
        </Text>
        <Text className="text-base text-gray-600 text-right mt-1">
          {t(roleLabelKey(user))}
        </Text>

        <View className="mt-6 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-right text-gray-500 text-sm">Organization ID</Text>
          <Text className="text-right">{user?.organizationId}</Text>
          <Text className="text-right text-gray-500 text-sm mt-3">Phone</Text>
          <Text className="text-right">{user?.phone}</Text>
        </View>

        <Pressable
          onPress={logout}
          className="mt-8 rounded-2xl py-4 items-center bg-red-500"
        >
          <Text className="text-white text-lg font-semibold">{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
