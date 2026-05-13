import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getOrgProfile, patchOrgProfile, uploadOrgLogo, deleteOrgLogo, OrgProfile } from '@/lib/extra.api';

const FIELDS: Array<{ key: keyof OrgProfile; labelKey: string; multiline?: boolean; ltr?: boolean }> = [
  { key: 'name', labelKey: 'admin.fields.fullName' },
  { key: 'address', labelKey: 'admin.fields.address' },
  { key: 'description', labelKey: 'admin.fields.description', multiline: true },
  { key: 'paymentLink', labelKey: 'admin.fields.paymentLink', ltr: true },
  { key: 'paymentDescription', labelKey: 'admin.fields.paymentDescription' },
  { key: 'logoUrl', labelKey: 'admin.fields.logoUrl', ltr: true },
  { key: 'primaryColor', labelKey: 'admin.fields.primaryColor', ltr: true },
  { key: 'contactPhone', labelKey: 'admin.fields.phone', ltr: true },
  { key: 'contactEmail', labelKey: 'admin.fields.email', ltr: true },
  { key: 'facebookUrl', labelKey: 'admin.fields.facebook', ltr: true },
  { key: 'instagramUrl', labelKey: 'admin.fields.instagram', ltr: true },
  { key: 'whatsappUrl', labelKey: 'admin.fields.whatsapp', ltr: true },
  { key: 'websiteUrl', labelKey: 'admin.fields.website', ltr: true },
];

export default function OrgProfileScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['org-profile'], queryFn: getOrgProfile });
  const [form, setForm] = useState<Partial<OrgProfile>>({});

  useEffect(() => { if (data) setForm(data); }, [data?.id]);

  const save = useMutation({
    mutationFn: () => patchOrgProfile(form),
    onSuccess: () => { Alert.alert(t('admin.saved')); qc.invalidateQueries({ queryKey: ['org-profile'] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  const upload = useMutation({
    mutationFn: (uri: string) => uploadOrgLogo(uri),
    onSuccess: (next) => { setForm((s) => ({ ...s, logoUrl: next.logoUrl })); qc.invalidateQueries({ queryKey: ['org-profile'] }); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });
  const removeLogo = useMutation({
    mutationFn: () => deleteOrgLogo(),
    onSuccess: () => { setForm((s) => ({ ...s, logoUrl: undefined })); qc.invalidateQueries({ queryKey: ['org-profile'] }); },
  });

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) upload.mutate(res.assets[0].uri);
  }

  if (isLoading) {
    return <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center"><ActivityIndicator size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.orgProfile') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-4 items-center">
          {form.logoUrl ? (
            <Image source={{ uri: form.logoUrl }} style={{ width: 96, height: 96, borderRadius: 12 }} />
          ) : (
            <View className="w-24 h-24 rounded-xl bg-gray-200 items-center justify-center">
              <Text className="text-gray-400">לוגו</Text>
            </View>
          )}
          <View className="flex-row-reverse gap-2 mt-3">
            <Pressable onPress={pickLogo} disabled={upload.isPending} className={`rounded-xl px-4 py-2 ${upload.isPending ? 'bg-gray-300' : 'bg-brand'}`}>
              <Text className="text-white text-sm">{upload.isPending ? '…' : t('admin.pickLogo')}</Text>
            </Pressable>
            {form.logoUrl && (
              <Pressable onPress={() => removeLogo.mutate()} className="rounded-xl px-4 py-2 bg-red-100">
                <Text className="text-red-700 text-sm">{t('admin.remove')}</Text>
              </Pressable>
            )}
          </View>
        </View>
        {FIELDS.map((f) => (
          <View key={String(f.key)} className="mb-3">
            <Text className="text-right text-gray-700 mb-1">{t(f.labelKey)}</Text>
            <TextInput
              value={String(form[f.key] ?? '')}
              onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
              multiline={f.multiline}
              className={`border border-gray-300 rounded-xl px-3 py-3 bg-white ${f.multiline ? 'min-h-[80px]' : ''} text-right`}
              style={f.ltr ? { writingDirection: 'ltr', textAlign: 'left' } : undefined}
            />
          </View>
        ))}
        <Pressable onPress={() => save.mutate()} disabled={save.isPending} className={`rounded-xl py-3 items-center mt-2 ${save.isPending ? 'bg-gray-400' : 'bg-brand'}`}>
          {save.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
