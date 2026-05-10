import { View, Text, ScrollView, ActivityIndicator, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getFamily } from '@/lib/families.api';
import { telHref, whatsappHref, mapsHref } from '@/lib/phone';

export default function FamilyDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['family', id],
    queryFn: () => getFamily(id as string),
    enabled: !!id,
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

  const tel = telHref(data.contactPhone);
  const wa = whatsappHref(data.contactPhone);
  const maps = mapsHref(data.address);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: data.familyName }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-right text-2xl font-bold">{data.familyName}</Text>
          {data.contactName && (
            <View className="mt-2">
              <Text className="text-right text-gray-500 text-sm">{t('families.contact')}</Text>
              <Text className="text-right">{data.contactName}</Text>
            </View>
          )}
          {data.contactPhone && (
            <View className="mt-2">
              <Text className="text-right text-gray-500 text-sm">{t('families.phone')}</Text>
              <Text className="text-right" style={{ writingDirection: 'ltr' }}>{data.contactPhone}</Text>
            </View>
          )}
          {data.address && (
            <View className="mt-2">
              <Text className="text-right text-gray-500 text-sm">{t('families.address')}</Text>
              <Text className="text-right">{data.address}</Text>
            </View>
          )}
          {data.groupName && (
            <View className="mt-2">
              <Text className="text-right text-gray-500 text-sm">{t('families.group')}</Text>
              <Text className="text-right">{data.groupName}</Text>
            </View>
          )}
          {data.notes && (
            <View className="mt-2">
              <Text className="text-right text-gray-500 text-sm">{t('families.notes')}</Text>
              <Text className="text-right">{data.notes}</Text>
            </View>
          )}
        </View>

        {(tel || wa || maps) && (
          <View className="flex-row-reverse gap-2 mt-4">
            {tel && <Pressable onPress={() => Linking.openURL(tel)} className="flex-1 bg-blue-100 rounded-xl py-3 items-center"><Text className="text-blue-700 font-medium">{t('distributor.call')}</Text></Pressable>}
            {wa && <Pressable onPress={() => Linking.openURL(wa)} className="flex-1 bg-green-100 rounded-xl py-3 items-center"><Text className="text-green-700 font-medium">{t('distributor.whatsapp')}</Text></Pressable>}
            {maps && <Pressable onPress={() => Linking.openURL(maps)} className="flex-1 bg-purple-100 rounded-xl py-3 items-center"><Text className="text-purple-700 font-medium">{t('distributor.navigate')}</Text></Pressable>}
          </View>
        )}

        {!!data.orders?.length && (
          <View className="mt-4">
            <Text className="text-right text-lg font-bold mb-2">{t('families.orders')}</Text>
            {data.orders.slice(0, 10).map((o) => (
              <View key={o.id} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2">
                <View className="flex-row-reverse justify-between">
                  <Text className="text-right font-medium">{o.weekKey}</Text>
                  <Text className="text-gray-500 text-sm">{o.status}</Text>
                </View>
                {o.notes && <Text className="text-right text-gray-700 mt-1">{o.notes}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
