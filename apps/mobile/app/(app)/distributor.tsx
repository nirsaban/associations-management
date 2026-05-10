import { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import {
  getMyWeeklyDistribution,
  setFamilyDelivered,
  DistributionFamily,
} from '@/lib/distributor.api';
import { telHref, whatsappHref, mapsHref } from '@/lib/phone';

const QK = ['weekly-distribution'] as const;

function openUrl(url: string | null) {
  if (!url) return;
  Linking.openURL(url).catch(() => {});
}

function FamilyCard({
  family,
  onToggle,
  pending,
}: {
  family: DistributionFamily;
  onToggle: (next: boolean) => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const tel = telHref(family.contactPhone);
  const wa = whatsappHref(family.contactPhone);
  const maps = mapsHref(family.address);

  return (
    <View
      className={`bg-white border rounded-2xl p-4 mb-3 ${
        family.delivered ? 'border-green-400' : 'border-gray-200'
      }`}
    >
      <View className="flex-row-reverse items-center justify-between mb-1">
        <Text className="text-lg font-bold text-right flex-1">{family.name}</Text>
        {family.delivered && (
          <Text className="text-green-600 font-semibold ml-2">✓ {t('distributor.delivered')}</Text>
        )}
      </View>

      {family.address ? (
        <Text className="text-gray-700 text-right mb-1">{family.address}</Text>
      ) : (
        <Text className="text-gray-400 text-right mb-1">{t('distributor.noAddress')}</Text>
      )}
      {family.contactPhone ? (
        <Text className="text-gray-700 text-right mb-3" style={{ writingDirection: 'ltr' }}>
          {family.contactPhone}
        </Text>
      ) : (
        <Text className="text-gray-400 text-right mb-3">{t('distributor.noPhone')}</Text>
      )}

      <View className="flex-row-reverse gap-2 mb-3">
        <Pressable
          disabled={!tel}
          onPress={() => openUrl(tel)}
          className={`flex-1 rounded-xl py-2 items-center ${tel ? 'bg-blue-100' : 'bg-gray-100'}`}
        >
          <Text className={tel ? 'text-blue-700 font-medium' : 'text-gray-400'}>
            {t('distributor.call')}
          </Text>
        </Pressable>
        <Pressable
          disabled={!wa}
          onPress={() => openUrl(wa)}
          className={`flex-1 rounded-xl py-2 items-center ${wa ? 'bg-green-100' : 'bg-gray-100'}`}
        >
          <Text className={wa ? 'text-green-700 font-medium' : 'text-gray-400'}>
            {t('distributor.whatsapp')}
          </Text>
        </Pressable>
        <Pressable
          disabled={!maps}
          onPress={() => openUrl(maps)}
          className={`flex-1 rounded-xl py-2 items-center ${maps ? 'bg-purple-100' : 'bg-gray-100'}`}
        >
          <Text className={maps ? 'text-purple-700 font-medium' : 'text-gray-400'}>
            {t('distributor.navigate')}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => onToggle(!family.delivered)}
        disabled={pending}
        className={`rounded-xl py-3 items-center ${
          pending ? 'bg-gray-300' : family.delivered ? 'bg-gray-200' : 'bg-brand'
        }`}
      >
        <Text
          className={`font-semibold ${
            family.delivered ? 'text-gray-700' : 'text-white'
          }`}
        >
          {family.delivered ? t('distributor.markUndelivered') : t('distributor.markDelivered')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function DistributorScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: QK,
    queryFn: getMyWeeklyDistribution,
  });

  const toggle = useMutation({
    mutationFn: ({ familyId, delivered }: { familyId: string; delivered: boolean }) =>
      setFamilyDelivered(familyId, delivered),
    onMutate: async ({ familyId, delivered }) => {
      await qc.cancelQueries({ queryKey: QK });
      const prev = qc.getQueryData<typeof data>(QK);
      if (prev) {
        const next = {
          ...prev,
          families: prev.families.map((f) =>
            f.id === familyId
              ? { ...f, delivered, deliveredAt: delivered ? new Date().toISOString() : null }
              : f
          ),
        };
        next.deliveredCount = next.families.filter((f) => f.delivered).length;
        qc.setQueryData(QK, next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev);
      Alert.alert(t('auth.errors.generic'));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });

  const onShare = useCallback(async () => {
    if (!data) return;
    try {
      await Share.share({
        message: t('distributor.shareMessage', { count: data.totalCount }),
      });
    } catch {}
  }, [data, t]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-red-600 text-center mb-4">{t('auth.errors.generic')}</Text>
        <Pressable onPress={() => refetch()} className="bg-brand rounded-xl px-6 py-3">
          <Text className="text-white">{t('common.retry')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!data.isDistributor) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <Stack.Screen options={{ title: t('distributor.title') }} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg text-gray-700 text-center">
            {t('distributor.notAssigned')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const allDone = data.totalCount > 0 && data.deliveredCount === data.totalCount;
  const pct = data.totalCount ? Math.round((data.deliveredCount / data.totalCount) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('distributor.title') }} />
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
          {data.weekStart && (
            <Text className="text-right text-gray-700">
              {t('distributor.weekOf', { date: new Date(data.weekStart).toLocaleDateString('he-IL') })}
            </Text>
          )}
          {data.groupName && (
            <Text className="text-right text-gray-700 mt-1">
              {t('distributor.group', { name: data.groupName })}
            </Text>
          )}
          <Text className="text-right text-lg font-bold mt-3">
            {t('distributor.progress', { done: data.deliveredCount, total: data.totalCount })}
          </Text>
          <View className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <View
              className="h-full bg-brand"
              style={{ width: `${pct}%`, alignSelf: 'flex-end' }}
            />
          </View>
        </View>

        {allDone && (
          <View className="bg-green-100 border border-green-300 rounded-2xl p-4 mb-4">
            <Text className="text-center text-green-800 font-semibold mb-3">
              {t('distributor.allDone')}
            </Text>
            <Pressable onPress={onShare} className="bg-green-600 rounded-xl py-3 items-center">
              <Text className="text-white font-semibold">{t('distributor.share')}</Text>
            </Pressable>
          </View>
        )}

        {data.families.map((f) => (
          <FamilyCard
            key={f.id}
            family={f}
            pending={toggle.isPending && toggle.variables?.familyId === f.id}
            onToggle={(delivered) => toggle.mutate({ familyId: f.id, delivered })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
