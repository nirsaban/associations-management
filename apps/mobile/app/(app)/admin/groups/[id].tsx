import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams } from 'expo-router';
import { listAdminGroups, patchAdminGroup } from '@/lib/admin.api';

export default function AdminGroupEdit() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-group', id],
    queryFn: async () => (await listAdminGroups()).find((g) => g.id === id) ?? null,
  });
  const [name, setName] = useState('');
  useEffect(() => { if (data) setName(data.name); }, [data?.id]);

  const save = useMutation({
    mutationFn: () => patchAdminGroup(id as string, { name }),
    onSuccess: () => { Alert.alert(t('admin.saved')); qc.invalidateQueries({ queryKey: ['admin-groups'] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  if (isLoading || !data) {
    return <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">{isLoading ? <ActivityIndicator size="large" /> : <Text>—</Text>}</SafeAreaView>;
  }
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.edit') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.groupName')}</Text>
        <TextInput value={name} onChangeText={setName} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-4" />
        <Pressable onPress={() => save.mutate()} disabled={save.isPending} className={`rounded-xl py-3 items-center ${save.isPending ? 'bg-gray-400' : 'bg-brand'}`}>
          {save.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
