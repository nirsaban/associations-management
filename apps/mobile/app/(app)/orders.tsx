import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { listWeeklyOrders, completeWeeklyOrder } from '@/lib/orders.api';
import { isoWeekKey } from '@/lib/week';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const week = isoWeekKey();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['weekly-orders', week],
    queryFn: () => listWeeklyOrders(week),
  });

  const complete = useMutation({
    mutationFn: (id: string) => completeWeeklyOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly-orders'] }),
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: `${t('orders.title')} · ${week}` }} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {!data?.length && (
            <Text className="text-center text-gray-500 py-12">{t('orders.empty')}</Text>
          )}
          {data?.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const isDone = o.status === 'COMPLETED';
            return (
              <View key={o.id} className={`bg-white border rounded-2xl p-4 mb-3 ${isDone ? 'border-green-300' : 'border-gray-200'}`}>
                <View className="flex-row-reverse justify-between mb-2">
                  <Text className="font-bold">{o.weekKey}</Text>
                  <Text className={`text-sm ${isDone ? 'text-green-600' : 'text-gray-500'}`}>{o.status}</Text>
                </View>
                {!!items.length && (
                  <View className="mb-2">
                    <Text className="text-right text-gray-500 text-sm mb-1">{t('orders.items')}</Text>
                    {items.slice(0, 10).map((it: any, idx: number) => (
                      <Text key={idx} className="text-right text-gray-800">
                        • {typeof it === 'string' ? it : (it.name ?? JSON.stringify(it))}
                      </Text>
                    ))}
                  </View>
                )}
                {o.notes && <Text className="text-right text-gray-700 mt-1">{o.notes}</Text>}
                {!isDone && (
                  <Pressable
                    disabled={complete.isPending}
                    onPress={() => complete.mutate(o.id)}
                    className="mt-3 bg-brand rounded-xl py-2 items-center"
                  >
                    <Text className="text-white font-medium">{t('orders.complete')}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
