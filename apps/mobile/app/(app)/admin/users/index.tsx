import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, Link } from 'expo-router';
import { useState } from 'react';
import { listAdminUsers } from '@/lib/admin.api';

export default function AdminUsersList() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => listAdminUsers({ search: search || undefined }),
  });
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.users') }} />
      <View className="p-3 bg-white border-b border-gray-200">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('admin.fields.fullName')}
          className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-right"
        />
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {data?.map((u) => (
            <Link key={u.id} href={{ pathname: '/(app)/admin/users/[id]', params: { id: u.id } }} asChild>
              <Pressable className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
                <View className="flex-row-reverse justify-between">
                  <Text className="font-bold text-right flex-1">{u.fullName}</Text>
                  <Text className="text-xs text-gray-500">{u.systemRole}</Text>
                </View>
                <Text className="text-right text-gray-700" style={{ writingDirection: 'ltr' }}>{u.phone}</Text>
                {u.groupName && <Text className="text-right text-gray-500 text-sm">{u.groupName}</Text>}
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
