import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getFamily } from '@/lib/families.api';
import { patchAdminFamily, listAdminGroups } from '@/lib/admin.api';

export default function AdminFamilyEdit() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-family', id], queryFn: () => getFamily(id as string), enabled: !!id });

  const [familyName, setFamilyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const groups = useQuery({ queryKey: ['admin-groups'], queryFn: listAdminGroups });

  useEffect(() => {
    if (data) {
      setFamilyName(data.familyName);
      setContactName(data.contactName ?? '');
      setContactPhone(data.contactPhone ?? '');
      setAddress(data.address ?? '');
      setNotes(data.notes ?? '');
      setGroupId(data.groupId ?? undefined);
    }
  }, [data?.id]);

  const save = useMutation({
    mutationFn: () => patchAdminFamily(id as string, { familyName, contactName, contactPhone, address, notes, groupId }),
    onSuccess: () => { Alert.alert(t('admin.saved')); qc.invalidateQueries({ queryKey: ['admin-families'] }); qc.invalidateQueries({ queryKey: ['admin-family', id] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  if (isLoading || !data) {
    return <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">{isLoading ? <ActivityIndicator size="large" /> : <Text>—</Text>}</SafeAreaView>;
  }
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.edit') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.familyName')}</Text>
        <TextInput value={familyName} onChangeText={setFamilyName} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.contactName')}</Text>
        <TextInput value={contactName} onChangeText={setContactName} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.phone')}</Text>
        <TextInput value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" className="border border-gray-300 rounded-xl px-3 py-3 bg-white mb-3" style={{ writingDirection: 'ltr', textAlign: 'left' }} />
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.address')}</Text>
        <TextInput value={address} onChangeText={setAddress} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
        <Text className="text-right text-gray-700 mb-1">{t('families.group')}</Text>
        <Pressable onPress={() => setPickerOpen((o) => !o)} className="border border-gray-300 rounded-xl px-3 py-3 bg-white mb-3">
          <Text className="text-right">{groups.data?.find((g) => g.id === groupId)?.name ?? '—'}</Text>
        </Pressable>
        {pickerOpen && (
          <View className="bg-white border border-brand rounded-2xl p-2 mb-3 max-h-60">
            <ScrollView>
              <Pressable onPress={() => { setGroupId(undefined); setPickerOpen(false); }} className="px-3 py-3">
                <Text className="text-right text-gray-500">—</Text>
              </Pressable>
              {groups.data?.map((g) => (
                <Pressable key={g.id} onPress={() => { setGroupId(g.id); setPickerOpen(false); }} className={`px-3 py-3 ${groupId === g.id ? 'bg-blue-50' : ''}`}>
                  <Text className="text-right">{g.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        <Text className="text-right text-gray-700 mb-1">{t('admin.fields.notes')}</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-4 min-h-[80px]" />
        <Pressable onPress={() => save.mutate()} disabled={save.isPending} className={`rounded-xl py-3 items-center ${save.isPending ? 'bg-gray-400' : 'bg-brand'}`}>
          {save.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
