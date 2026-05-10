import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, Link } from 'expo-router';
import { listFamilies } from '@/lib/families.api';

export default function FamiliesListScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['families'],
    queryFn: () => listFamilies({ limit: 100 }),
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('families.title') }} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {!data?.length && (
            <View className="items-center justify-center py-16">
              <Text className="text-gray-500">{t('families.empty')}</Text>
            </View>
          )}
          {data?.map((f) => (
            <Link key={f.id} href={{ pathname: '/(app)/families/[id]', params: { id: f.id } }} asChild>
              <Pressable className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
                <Text className="text-right font-bold">{f.familyName}</Text>
                {f.address && <Text className="text-right text-gray-700 mt-1">{f.address}</Text>}
                {f.groupName && <Text className="text-right text-gray-500 text-sm mt-1">{t('families.group')}: {f.groupName}</Text>}
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
