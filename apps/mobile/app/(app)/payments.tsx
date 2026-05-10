import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { getPaymentStatus, getMyPayments, getDonationInfo } from '@/lib/payments.api';

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const status = useQuery({ queryKey: ['payment-status'], queryFn: getPaymentStatus });
  const list = useQuery({ queryKey: ['payments-me'], queryFn: () => getMyPayments() });
  const donate = useQuery({ queryKey: ['donation-info'], queryFn: getDonationInfo, retry: false });

  const refreshing = status.isRefetching || list.isRefetching;
  const refresh = () => { status.refetch(); list.refetch(); donate.refetch(); };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('payments.title') }} />
      {status.isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          <View className={`rounded-2xl p-4 mb-4 border ${status.data?.isPaid ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
            <Text className={`text-right text-lg font-bold ${status.data?.isPaid ? 'text-green-700' : 'text-orange-700'}`}>
              {status.data?.isPaid ? t('payments.paidThisMonth') : t('payments.unpaidThisMonth')}
            </Text>
            {status.data?.monthKey && (
              <Text className="text-right text-gray-600 mt-1">{status.data.monthKey}</Text>
            )}
          </View>

          {donate.data?.paymentLink && !status.data?.isPaid && (
            <Pressable
              onPress={() => Linking.openURL(donate.data!.paymentLink)}
              className="bg-brand rounded-2xl py-4 items-center mb-4"
            >
              <Text className="text-white text-lg font-bold">💝 {t('payments.donate')}</Text>
              {donate.data.paymentDescription && (
                <Text className="text-white/90 text-sm mt-1">{donate.data.paymentDescription}</Text>
              )}
            </Pressable>
          )}

          <Text className="text-right text-lg font-bold mb-2">{t('payments.history')}</Text>
          {!list.data?.length && (
            <Text className="text-center text-gray-500 py-8">{t('payments.empty')}</Text>
          )}
          {list.data?.map((p) => (
            <View key={p.id} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
              <View className="flex-row-reverse justify-between">
                <Text className="font-medium">{p.monthKey}</Text>
                <Text className={p.status === 'PAID' ? 'text-green-600' : 'text-gray-500'}>{p.status}</Text>
              </View>
              {p.amount !== undefined && <Text className="text-right text-gray-700 mt-1">₪{p.amount}</Text>}
              {p.paidAt && (
                <Text className="text-right text-gray-500 text-sm">{new Date(p.paidAt).toLocaleDateString('he-IL')}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
