import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticate,
} from '@/lib/biometric';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [available, setAvailable] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await isBiometricAvailable();
      setAvailable(a);
      if (a) setEnabled(await isBiometricEnabled());
    })();
  }, []);

  async function toggle(next: boolean) {
    if (next) {
      const ok = await authenticate(t('profile.biometric'));
      if (!ok) return;
    }
    await setBiometricEnabled(next);
    setEnabled(next);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('profile.title') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-right text-gray-500 text-sm">{t('profile.name')}</Text>
          <Text className="text-right text-lg">{user?.name}</Text>
          <Text className="text-right text-gray-500 text-sm mt-3">{t('profile.phone')}</Text>
          <Text className="text-right text-lg" style={{ writingDirection: 'ltr' }}>{user?.phone}</Text>
          {user?.email && (
            <>
              <Text className="text-right text-gray-500 text-sm mt-3">{t('profile.email')}</Text>
              <Text className="text-right text-lg" style={{ writingDirection: 'ltr' }}>{user.email}</Text>
            </>
          )}
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-200 mt-4 flex-row-reverse items-center justify-between">
          <Text className="text-right flex-1 text-base">{t('profile.biometric')}</Text>
          {available === false ? (
            <Text className="text-gray-400 text-sm">{t('profile.biometricUnavailable')}</Text>
          ) : (
            <Switch value={enabled} onValueChange={toggle} disabled={available === null} />
          )}
        </View>

        <Pressable
          onPress={() => {
            Alert.alert(t('auth.logout'), '', [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('auth.logout'), style: 'destructive', onPress: logout },
            ]);
          }}
          className="mt-8 rounded-2xl py-4 items-center bg-red-500"
        >
          <Text className="text-white text-lg font-semibold">{t('auth.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
