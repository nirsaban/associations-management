import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { getMyAlerts } from '@/lib/alerts.api';

export default function AlertsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getMyAlerts(50),
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('alerts.title') }} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {!data?.length && (
            <View className="items-center justify-center py-16">
              <Text className="text-gray-500">{t('alerts.empty')}</Text>
            </View>
          )}
          {data?.map((a) => (
            <View key={a.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-200">
              <Text className="text-right text-lg font-bold">{a.title}</Text>
              <Text className="text-right text-gray-700 mt-1">{a.body}</Text>
              <View className="flex-row-reverse justify-between mt-3">
                <Text className="text-xs text-gray-500">
                  {t('alerts.publishedBy', { name: a.publishedBy?.fullName ?? '' })}
                </Text>
                <Text className="text-xs text-gray-500">
                  {new Date(a.publishedAt).toLocaleDateString('he-IL')}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
