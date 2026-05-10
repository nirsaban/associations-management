import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { getReferralStats } from '@/lib/extra.api';

export default function ReferralsAdmin() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch } = useQuery({ queryKey: ['referral-stats'], queryFn: getReferralStats });
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.referralsAdmin') }} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {data?.map((r) => (
            <View key={r.userId} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
              <View className="flex-row-reverse justify-between">
                <Text className="font-bold text-right flex-1">{r.fullName}</Text>
                <Text className="text-brand font-mono">{r.code}</Text>
              </View>
              <View className="flex-row-reverse justify-between mt-2">
                <Text className="text-gray-700 text-sm">{t('referral.clicks', { count: r.clickCount })}</Text>
                <Text className="text-gray-700 text-sm">{t('referral.payments', { count: r.paymentCount })}</Text>
                <Text className="text-gray-700 text-sm">{t('referral.amount', { amount: r.totalAmount })}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
