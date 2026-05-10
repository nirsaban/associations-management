import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { startLogin } from '@/lib/auth.api';

const PHONE_RE = /^(0\d{8,9}|\+972\d{8,9})$/;

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const normalized = phone.trim();
    if (!PHONE_RE.test(normalized)) {
      Alert.alert(t('auth.errors.invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const res = await startLogin(normalized);
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: normalized,
          sessionId: res.sessionId ?? '',
          orgs: JSON.stringify(res.organizations ?? []),
          requiresOrg: res.requiresOrgSelection ? '1' : '0',
        },
      });
    } catch (e: any) {
      Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12">
        <Text className="text-3xl font-bold text-right mb-2">{t('auth.phoneTitle')}</Text>
        <Text className="text-base text-gray-600 text-right mb-8">{t('auth.phoneSubtitle')}</Text>

        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder={t('auth.phonePlaceholder')}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          className="border border-gray-300 rounded-2xl px-4 py-4 text-lg text-right"
          style={{ writingDirection: 'ltr' }}
        />

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          className={`mt-6 rounded-2xl py-4 items-center ${loading ? 'bg-gray-400' : 'bg-brand'}`}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white text-lg font-semibold">{t('auth.sendCode')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
