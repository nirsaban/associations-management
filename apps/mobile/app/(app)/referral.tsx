import { View, Text, Pressable, ScrollView, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { getMyReferral } from '@/lib/extra.api';

export default function ReferralScreen() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['my-referral'], queryFn: getMyReferral });

  async function onShare() {
    if (!data?.landingSlug) return;
    const url = `https://amutot.app/${data.landingSlug}?ref=${data.code}`;
    try { await Share.share({ message: t('referral.shareMessage', { url }) }); } catch {}
  }

  if (isLoading) {
    return <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center"><ActivityIndicator size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('referral.title') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-2xl p-6 border border-gray-200 items-center">
          <Text className="text-gray-500 mb-1">{t('referral.yourCode')}</Text>
          <Text className="text-4xl font-bold tracking-wider text-brand">{data?.code}</Text>
        </View>

        <View className="flex-row-reverse gap-2 mt-4">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 items-center">
            <Text className="text-2xl font-bold">{data?.clickCount ?? 0}</Text>
            <Text className="text-gray-500 text-sm">{t('referral.clicks', { count: data?.clickCount ?? 0 })}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 items-center">
            <Text className="text-2xl font-bold">{data?.paymentCount ?? 0}</Text>
            <Text className="text-gray-500 text-sm">{t('referral.payments', { count: data?.paymentCount ?? 0 })}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 items-center">
            <Text className="text-2xl font-bold">{t('referral.amount', { amount: data?.totalAmount ?? 0 })}</Text>
          </View>
        </View>

        {data?.landingSlug ? (
          <Pressable onPress={onShare} className="mt-6 bg-brand rounded-xl py-4 items-center">
            <Text className="text-white text-lg font-semibold">{t('referral.share')}</Text>
          </Pressable>
        ) : (
          <Text className="text-gray-500 text-center mt-6">{t('referral.noLanding')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
