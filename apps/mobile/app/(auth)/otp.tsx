import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { verifyOtp, startLogin, OrgChoice } from '@/lib/auth.api';
import { useAuthStore } from '@/store/auth.store';

export default function OtpScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ phone: string; sessionId?: string; orgs?: string; requiresOrg?: string }>();
  const phone = params.phone as string;
  const orgs: OrgChoice[] = useMemo(() => {
    try { return params.orgs ? JSON.parse(params.orgs as string) : []; } catch { return []; }
  }, [params.orgs]);
  const needsOrg = params.requiresOrg === '1' && orgs.length > 1;

  const setSession = useAuthStore((s) => s.setSession);
  const [otp, setOtp] = useState('');
  const [orgId, setOrgId] = useState<string | undefined>(needsOrg ? undefined : orgs[0]?.id);
  const [sessionId, setSessionId] = useState<string | undefined>(params.sessionId as string);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onVerify() {
    if (!/^\d{6}$/.test(otp)) { Alert.alert(t('auth.errors.invalidOtp')); return; }
    if (needsOrg && !orgId) { Alert.alert(t('auth.selectOrg')); return; }
    setLoading(true);
    try {
      const res = await verifyOtp({ phone, otp, sessionId, organizationId: orgId });
      await setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
    } catch (e: any) {
      Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setResending(true);
    try {
      const res = await startLogin(phone);
      setSessionId(res.sessionId);
    } catch (e: any) {
      Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-12">
        <Text className="text-3xl font-bold text-right mb-2">{t('auth.otpTitle')}</Text>
        <Text className="text-base text-gray-600 text-right mb-8">{t('auth.otpSubtitle')}</Text>

        <TextInput
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
          placeholder={t('auth.otpPlaceholder')}
          keyboardType="number-pad"
          maxLength={6}
          className="border border-gray-300 rounded-2xl px-4 py-4 text-2xl text-center tracking-widest"
        />

        {needsOrg && (
          <View className="mt-6">
            <Text className="text-right text-base mb-2">{t('auth.selectOrg')}</Text>
            {orgs.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => setOrgId(o.id)}
                className={`border rounded-2xl px-4 py-3 mb-2 ${orgId === o.id ? 'border-brand bg-blue-50' : 'border-gray-300'}`}
              >
                <Text className="text-right text-base">{o.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={onVerify}
          disabled={loading}
          className={`mt-6 rounded-2xl py-4 items-center ${loading ? 'bg-gray-400' : 'bg-brand'}`}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white text-lg font-semibold">{t('auth.verify')}</Text>
          )}
        </Pressable>

        <Pressable onPress={onResend} disabled={resending} className="mt-4 py-3 items-center">
          <Text className="text-brand text-base">
            {resending ? t('common.loading') : t('auth.resend')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
