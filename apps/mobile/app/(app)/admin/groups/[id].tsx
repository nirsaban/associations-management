import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams } from 'expo-router';
import { listAdminGroups, patchAdminGroup, listAdminUsers } from '@/lib/admin.api';
import {
  listGroupMembers, assignGroupManager, addGroupMember, removeGroupMember,
} from '@/lib/extra.api';

export default function AdminGroupEdit() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id as string;
  const qc = useQueryClient();

  const group = useQuery({
    queryKey: ['admin-group', groupId],
    queryFn: async () => (await listAdminGroups()).find((g) => g.id === groupId) ?? null,
  });
  const members = useQuery({ queryKey: ['admin-group-members', groupId], queryFn: () => listGroupMembers(groupId) });
  const users = useQuery({ queryKey: ['admin-users-all'], queryFn: () => listAdminUsers() });

  const [name, setName] = useState('');
  const [pickerOpen, setPickerOpen] = useState<'manager' | 'member' | null>(null);

  useEffect(() => { if (group.data) setName(group.data.name); }, [group.data?.id]);

  const renameSave = useMutation({
    mutationFn: () => patchAdminGroup(groupId, { name }),
    onSuccess: () => { Alert.alert(t('admin.saved')); qc.invalidateQueries({ queryKey: ['admin-groups'] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });
  const setManager = useMutation({
    mutationFn: (userId: string) => assignGroupManager(groupId, userId),
    onSuccess: () => { setPickerOpen(null); qc.invalidateQueries({ queryKey: ['admin-groups'] }); qc.invalidateQueries({ queryKey: ['admin-group-members', groupId] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });
  const addMember = useMutation({
    mutationFn: (userId: string) => addGroupMember(groupId, userId),
    onSuccess: () => { setPickerOpen(null); qc.invalidateQueries({ queryKey: ['admin-group-members', groupId] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeGroupMember(groupId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-group-members', groupId] }),
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  if (group.isLoading || !group.data) {
    return <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">{group.isLoading ? <ActivityIndicator size="large" /> : <Text>—</Text>}</SafeAreaView>;
  }

  const memberIds = new Set((members.data ?? []).map((m) => m.id));
  const candidates = (users.data ?? []).filter((u) => pickerOpen === 'member' ? !memberIds.has(u.id) : true);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.edit') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.groupName')}</Text>
        <TextInput value={name} onChangeText={setName} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
        <Pressable onPress={() => renameSave.mutate()} disabled={renameSave.isPending} className={`rounded-xl py-3 items-center mb-6 ${renameSave.isPending ? 'bg-gray-400' : 'bg-brand'}`}>
          {renameSave.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
        </Pressable>

        <View className="flex-row-reverse justify-between items-center mb-2">
          <Text className="text-right text-lg font-bold">{t('admin.manager')}</Text>
          <Pressable onPress={() => setPickerOpen('manager')} className="bg-blue-100 rounded-lg px-3 py-1">
            <Text className="text-blue-700 text-sm">{t('admin.edit')}</Text>
          </Pressable>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-3 mb-6">
          <Text className="text-right">{group.data.managerName ?? '—'}</Text>
        </View>

        <View className="flex-row-reverse justify-between items-center mb-2">
          <Text className="text-right text-lg font-bold">{t('admin.members')}</Text>
          <Pressable onPress={() => setPickerOpen('member')} className="bg-green-100 rounded-lg px-3 py-1">
            <Text className="text-green-700 text-sm">{t('admin.addMember')}</Text>
          </Pressable>
        </View>
        {members.isLoading && <ActivityIndicator />}
        {members.data?.map((m) => (
          <View key={m.id} className="bg-white border border-gray-200 rounded-2xl p-3 mb-2 flex-row-reverse items-center justify-between">
            <View className="flex-1">
              <Text className="text-right font-medium">{m.fullName}</Text>
              <Text className="text-right text-gray-500 text-sm" style={{ writingDirection: 'ltr' }}>{m.phone}</Text>
            </View>
            <Pressable onPress={() => remove.mutate(m.id)} className="bg-red-100 rounded-lg px-3 py-1">
              <Text className="text-red-600 text-sm">{t('admin.remove')}</Text>
            </Pressable>
          </View>
        ))}

        {pickerOpen && (
          <View className="bg-white border border-brand rounded-2xl p-3 mt-4">
            <View className="flex-row-reverse justify-between mb-2">
              <Text className="font-bold">{pickerOpen === 'manager' ? t('admin.manager') : t('admin.addMember')}</Text>
              <Pressable onPress={() => setPickerOpen(null)}><Text className="text-gray-500">×</Text></Pressable>
            </View>
            {candidates.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => (pickerOpen === 'manager' ? setManager.mutate(u.id) : addMember.mutate(u.id))}
                className="py-3 border-b border-gray-100"
              >
                <Text className="text-right">{u.fullName}</Text>
                <Text className="text-right text-gray-500 text-sm" style={{ writingDirection: 'ltr' }}>{u.phone}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
