import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { getCurrentDistributors, getIncompleteOrders, getNoDistributorGroups } from '@/lib/extra.api';

type Tab = 'current' | 'incomplete' | 'noDistributor';

export default function WeeklyStatusScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('current');

  const cur = useQuery({ queryKey: ['ws-current'], queryFn: getCurrentDistributors, enabled: tab === 'current' });
  const inc = useQuery({ queryKey: ['ws-incomplete'], queryFn: getIncompleteOrders, enabled: tab === 'incomplete' });
  const nod = useQuery({ queryKey: ['ws-no-dist'], queryFn: getNoDistributorGroups, enabled: tab === 'noDistributor' });

  const active = tab === 'current' ? cur : tab === 'incomplete' ? inc : nod;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'current', label: t('admin.currentDistributors') },
    { key: 'incomplete', label: t('admin.incompleteOrders') },
    { key: 'noDistributor', label: t('admin.noDistributor') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.weeklyStatus') }} />
      <View className="flex-row-reverse gap-2 p-3 bg-white border-b border-gray-200">
        {tabs.map((tb) => (
          <Pressable key={tb.key} onPress={() => setTab(tb.key)} className={`flex-1 rounded-xl py-2 items-center border ${tab === tb.key ? 'bg-brand border-brand' : 'bg-white border-gray-300'}`}>
            <Text className={tab === tb.key ? 'text-white text-xs font-medium' : 'text-gray-700 text-xs'}>{tb.label}</Text>
          </Pressable>
        ))}
      </View>
      {active.isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={active.refetch} />}>
          {tab === 'current' && cur.data?.map((r) => (
            <View key={r.groupId + r.distributorId} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
              <Text className="font-bold text-right">{r.groupName}</Text>
              <Text className="text-right text-gray-700">{r.distributorName}</Text>
            </View>
          ))}
          {tab === 'incomplete' && inc.data?.map((r) => (
            <View key={r.groupId} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
              <Text className="font-bold text-right">{r.groupName}</Text>
              <Text className="text-right text-gray-700">{r.completedOrders}/{r.totalOrders}</Text>
              {r.managerName && <Text className="text-right text-gray-500 text-sm">{t('admin.manager')}: {r.managerName}</Text>}
            </View>
          ))}
          {tab === 'noDistributor' && nod.data?.map((r) => (
            <View key={r.groupId} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
              <Text className="font-bold text-right">{r.groupName}</Text>
              {r.managerName && <Text className="text-right text-gray-500 text-sm">{t('admin.manager')}: {r.managerName}</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
