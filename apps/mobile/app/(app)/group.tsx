import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { getMyGroupView } from '@/lib/group.api';
import { telHref, whatsappHref, mapsHref } from '@/lib/phone';

export default function GroupScreen() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: ['group-view'],
    queryFn: getMyGroupView,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-red-600">{t('auth.errors.generic')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: data.group.name || t('group.title') }} />
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
          <Text className="text-right text-gray-500 text-sm mb-1">{t('group.currentDistributor')}</Text>
          {data.currentDistributor ? (
            <View>
              <Text className="text-right text-lg font-bold">{data.currentDistributor.fullName}</Text>
              {data.currentDistributor.phone && (
                <Pressable
                  onPress={() => Linking.openURL(telHref(data.currentDistributor!.phone) || '')}
                  className="mt-2 bg-blue-100 rounded-xl py-2 items-center"
                >
                  <Text className="text-blue-700">{data.currentDistributor.phone}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Text className="text-right text-gray-500">{t('group.noDistributor')}</Text>
          )}
        </View>

        <Text className="text-right text-lg font-bold mb-2">{t('group.members')}</Text>
        {data.members.map((m) => (
          <View key={m.userId} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2 flex-row-reverse items-center justify-between">
            <Text className="text-right font-medium">{m.fullName}</Text>
            {m.paidThisMonth !== undefined && (
              <Text className={`text-xs ${m.paidThisMonth ? 'text-green-600' : 'text-orange-500'}`}>
                {m.paidThisMonth ? t('group.paid') : t('group.unpaid')}
              </Text>
            )}
          </View>
        ))}

        <Text className="text-right text-lg font-bold mt-4 mb-2">{t('group.families')}</Text>
        {data.families.map((f) => {
          const tel = telHref(f.contactPhone);
          const wa = whatsappHref(f.contactPhone);
          const maps = mapsHref(f.address);
          return (
            <View key={f.id} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
              <Text className="text-right font-bold">{f.name}</Text>
              {f.address && <Text className="text-right text-gray-700 mt-1">{f.address}</Text>}
              {f.contactPhone && <Text className="text-right text-gray-700" style={{ writingDirection: 'ltr' }}>{f.contactPhone}</Text>}
              {(tel || wa || maps) && (
                <View className="flex-row-reverse gap-2 mt-2">
                  {tel && <Pressable onPress={() => Linking.openURL(tel)} className="flex-1 bg-blue-100 rounded-lg py-2 items-center"><Text className="text-blue-700 text-sm">{t('distributor.call')}</Text></Pressable>}
                  {wa && <Pressable onPress={() => Linking.openURL(wa)} className="flex-1 bg-green-100 rounded-lg py-2 items-center"><Text className="text-green-700 text-sm">{t('distributor.whatsapp')}</Text></Pressable>}
                  {maps && <Pressable onPress={() => Linking.openURL(maps)} className="flex-1 bg-purple-100 rounded-lg py-2 items-center"><Text className="text-purple-700 text-sm">{t('distributor.navigate')}</Text></Pressable>}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
