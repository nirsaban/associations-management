import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams } from 'expo-router';
import { listWeeklyOrders, patchWeeklyOrder, completeWeeklyOrder } from '@/lib/orders.api';

function normalizeItem(it: any): string {
  if (typeof it === 'string') return it;
  if (it?.name) return it.name;
  return JSON.stringify(it);
}

export default function OrderEditor() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const list = await listWeeklyOrders();
      return list.find((o) => o.id === id) ?? null;
    },
    enabled: !!id,
  });

  const [items, setItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (order) {
      setItems((order.items ?? []).map(normalizeItem));
      setNotes(order.notes ?? '');
    }
  }, [order?.id]);

  const save = useMutation({
    mutationFn: () => patchWeeklyOrder(id as string, { items, notes }),
    onSuccess: () => {
      Alert.alert(t('admin.saved'));
      qc.invalidateQueries({ queryKey: ['weekly-orders'] });
    },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  const complete = useMutation({
    mutationFn: () => completeWeeklyOrder(id as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly-orders'] }),
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">{t('orders.empty')}</Text>
      </SafeAreaView>
    );
  }

  const isDone = order.status === 'COMPLETED';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: order.weekKey }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text className="text-right text-lg font-bold mb-2">{t('orders.items')}</Text>

        {items.map((it, idx) => (
          <View key={idx} className="bg-white border border-gray-200 rounded-xl p-3 mb-2 flex-row-reverse items-center justify-between">
            <Text className="flex-1 text-right">{it}</Text>
            <Pressable onPress={() => setItems(items.filter((_, i) => i !== idx))} className="ml-3">
              <Text className="text-red-500 text-lg">×</Text>
            </Pressable>
          </View>
        ))}

        <View className="flex-row-reverse mb-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('orders.itemPlaceholder')}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-3 bg-white text-right"
            onSubmitEditing={() => { if (draft.trim()) { setItems([...items, draft.trim()]); setDraft(''); } }}
          />
          <Pressable
            onPress={() => { if (draft.trim()) { setItems([...items, draft.trim()]); setDraft(''); } }}
            className="bg-brand rounded-xl px-4 ml-2 items-center justify-center"
          >
            <Text className="text-white font-medium">+</Text>
          </Pressable>
        </View>

        <Text className="text-right text-lg font-bold mt-2 mb-2">{t('orders.notes')}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right min-h-[80px]"
        />

        <Pressable
          onPress={() => save.mutate()}
          disabled={save.isPending}
          className={`mt-4 rounded-xl py-3 items-center ${save.isPending ? 'bg-gray-400' : 'bg-brand'}`}
        >
          {save.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('orders.save')}</Text>}
        </Pressable>

        {!isDone && (
          <Pressable
            onPress={() => complete.mutate()}
            disabled={complete.isPending}
            className="mt-3 rounded-xl py-3 items-center bg-green-600"
          >
            <Text className="text-white font-semibold">{t('orders.complete')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
