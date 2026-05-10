import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, Link } from 'expo-router';
import { listAdminGroups } from '@/lib/admin.api';

export default function AdminGroupsList() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-groups'], queryFn: listAdminGroups,
  });
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.groupsList') }} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {data?.map((g) => (
            <Link key={g.id} href={{ pathname: '/(app)/admin/groups/[id]', params: { id: g.id } }} asChild>
              <Pressable className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
                <Text className="font-bold text-right">{g.name}</Text>
                {g.managerName && <Text className="text-right text-gray-700 mt-1">{g.managerName}</Text>}
                {g.memberCount !== undefined && <Text className="text-right text-gray-500 text-sm">{g.memberCount}</Text>}
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
