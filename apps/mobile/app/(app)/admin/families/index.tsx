import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, Link } from 'expo-router';
import { listFamilies } from '@/lib/families.api';

export default function AdminFamiliesList() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-families'],
    queryFn: () => listFamilies({ limit: 200 }),
  });
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('families.title') }} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {data?.map((f) => (
            <Link key={f.id} href={{ pathname: '/(app)/admin/families/[id]', params: { id: f.id } }} asChild>
              <Pressable className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
                <Text className="font-bold text-right">{f.familyName}</Text>
                {f.address && <Text className="text-right text-gray-700 mt-1">{f.address}</Text>}
                {f.groupName && <Text className="text-right text-gray-500 text-sm mt-1">{f.groupName}</Text>}
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
