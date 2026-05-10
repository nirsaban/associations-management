import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams } from 'expo-router';
import { listAdminUsers, patchAdminUser } from '@/lib/admin.api';

export default function AdminUserEdit() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => (await listAdminUsers()).find((u) => u.id === id) ?? null,
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (data) {
      setFullName(data.fullName);
      setEmail(data.email ?? '');
      setIsActive(data.isActive);
      setIsAdmin(data.systemRole === 'ADMIN');
    }
  }, [data?.id]);

  const save = useMutation({
    mutationFn: () => patchAdminUser(id as string, {
      fullName,
      email: email || undefined,
      isActive,
      systemRole: isAdmin ? 'ADMIN' : 'USER',
    }),
    onSuccess: () => {
      Alert.alert(t('admin.saved'));
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        {isLoading ? <ActivityIndicator size="large" /> : <Text className="text-gray-500">—</Text>}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.edit') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.fullName')}</Text>
        <TextInput value={fullName} onChangeText={setFullName} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.email')}</Text>
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" className="border border-gray-300 rounded-xl px-3 py-3 bg-white mb-3" style={{ writingDirection: 'ltr', textAlign: 'left' }} />
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.phone')}</Text>
        <Text className="text-right text-gray-500 mb-3" style={{ writingDirection: 'ltr' }}>{data.phone}</Text>

        <View className="flex-row-reverse items-center justify-between bg-white border border-gray-200 rounded-xl p-3 mb-2">
          <Text>{t('admin.active')}</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>
        <View className="flex-row-reverse items-center justify-between bg-white border border-gray-200 rounded-xl p-3 mb-4">
          <Text>{t('home.role.ADMIN')}</Text>
          <Switch value={isAdmin} onValueChange={setIsAdmin} />
        </View>

        <Pressable onPress={() => save.mutate()} disabled={save.isPending} className={`rounded-xl py-3 items-center ${save.isPending ? 'bg-gray-400' : 'bg-brand'}`}>
          {save.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
