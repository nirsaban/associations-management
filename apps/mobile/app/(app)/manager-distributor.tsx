import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import {
  getDistributorWorkload,
  getWeeklyStatus,
  assignWeeklyDistributor,
} from '@/lib/manager.api';
import { isoWeekKey } from '@/lib/week';

export default function ManagerDistributorScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const weekKey = isoWeekKey();

  const status = useQuery({ queryKey: ['weekly-status', weekKey], queryFn: () => getWeeklyStatus(weekKey) });
  const workload = useQuery({ queryKey: ['workload'], queryFn: getDistributorWorkload });

  const assign = useMutation({
    mutationFn: ({ userId }: { userId: string }) => assignWeeklyDistributor(userId, weekKey),
    onSuccess: () => {
      Alert.alert(t('manager.assignSuccess'));
      qc.invalidateQueries({ queryKey: ['weekly-status'] });
      qc.invalidateQueries({ queryKey: ['workload'] });
    },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  const onPick = (userId: string, name: string) => {
    Alert.alert(t('manager.weeklyTitle'), t('manager.confirmAssign', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('manager.assign'), onPress: () => assign.mutate({ userId }) },
    ]);
  };

  const isLoading = status.isLoading || workload.isLoading;
  const refreshing = status.isRefetching || workload.isRefetching;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('manager.weeklyTitle') }} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { status.refetch(); workload.refetch(); }} />}
        >
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-right text-gray-500 text-sm mb-1">{t('manager.currentAssignment')}</Text>
            {status.data?.distributor.assigned ? (
              <Text className="text-right text-lg font-bold">
                {t('manager.assigned', { name: status.data.distributor.fullName })}
              </Text>
            ) : (
              <Text className="text-right text-orange-600">{t('manager.notAssigned')}</Text>
            )}
          </View>

          {status.data?.lastThreeDistributors?.length ? (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
              <Text className="text-right text-gray-500 text-sm mb-2">{t('manager.lastWeeks')}</Text>
              {status.data.lastThreeDistributors.map((d) => (
                <View key={d.userId + d.weekStart} className="flex-row-reverse justify-between py-1">
                  <Text className="text-right">{d.fullName}</Text>
                  <Text className="text-gray-500 text-sm">{new Date(d.weekStart).toLocaleDateString('he-IL')}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text className="text-right text-lg font-bold mb-2">{t('manager.selectMember')}</Text>
          {workload.data?.members.map((m) => {
            const isLowest = workload.data?.lowest?.userId === m.userId;
            return (
              <Pressable
                key={m.userId}
                onPress={() => onPick(m.userId, m.fullName)}
                disabled={assign.isPending}
                className={`bg-white border rounded-2xl p-3 mb-2 flex-row-reverse items-center justify-between ${isLowest ? 'border-green-400' : 'border-gray-200'}`}
              >
                <Text className="text-right font-medium flex-1">{m.fullName}</Text>
                <Text className="text-gray-500 text-sm">
                  {t('manager.timesLabel', { count: m.timesAsDistributor })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
