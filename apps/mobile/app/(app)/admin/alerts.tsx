import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { createAlert, AlertAudience } from '@/lib/extra.api';
import { listTemplates, saveTemplate, deleteTemplate, AlertTemplate } from '@/lib/alert-templates';

const AUDIENCES: AlertAudience[] = ['ALL_USERS', 'GROUP_MANAGERS', 'UNPAID_THIS_MONTH', 'CURRENT_DISTRIBUTORS'];

export default function AlertComposer() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AlertAudience>('ALL_USERS');
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [tplName, setTplName] = useState('');

  const reload = async () => setTemplates(await listTemplates());
  useEffect(() => { reload(); }, []);

  const send = useMutation({
    mutationFn: () => createAlert({ title, body, audience }),
    onSuccess: () => { Alert.alert(t('admin.alertSent')); setTitle(''); setBody(''); },
    onError: (e: any) => Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')),
  });

  async function onSaveTpl() {
    const name = tplName.trim() || title.trim();
    if (!name || !title.trim() || !body.trim()) return;
    await saveTemplate({ name, title, body, audience });
    setTplName('');
    await reload();
  }

  function applyTpl(tpl: AlertTemplate) {
    setTitle(tpl.title); setBody(tpl.body);
    if (tpl.audience) setAudience(tpl.audience);
  }

  async function onDeleteTpl(id: string) {
    await deleteTemplate(id);
    await reload();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.alerts') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {!!templates.length && (
          <View className="bg-white rounded-2xl border border-gray-200 p-3 mb-4">
            <Text className="text-right text-gray-500 text-sm mb-2">{t('admin.templates')}</Text>
            {templates.map((tpl) => (
              <View key={tpl.id} className="flex-row-reverse items-center justify-between py-2 border-b border-gray-100">
                <Pressable onPress={() => applyTpl(tpl)} className="flex-1">
                  <Text className="text-right font-medium">{tpl.name}</Text>
                  <Text className="text-right text-gray-500 text-xs">{tpl.title}</Text>
                </Pressable>
                <Pressable onPress={() => onDeleteTpl(tpl.id)} className="bg-red-100 rounded-lg px-2 py-1 ml-2">
                  <Text className="text-red-600 text-xs">{t('admin.remove')}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Text className="text-right text-gray-700 mb-1">{t('admin.alertTitle')}</Text>
        <TextInput value={title} onChangeText={setTitle} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
        <Text className="text-right text-gray-700 mb-1">{t('admin.alertBody')}</Text>
        <TextInput value={body} onChangeText={setBody} multiline className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right min-h-[100px] mb-3" />
        <Text className="text-right text-gray-700 mb-1">{t('admin.alertAudience')}</Text>
        <View className="bg-white border border-gray-200 rounded-2xl p-2 mb-4">
          {AUDIENCES.map((a) => (
            <Pressable key={a} onPress={() => setAudience(a)} className={`px-3 py-3 rounded-xl ${audience === a ? 'bg-brand' : ''}`}>
              <Text className={`text-right ${audience === a ? 'text-white font-medium' : 'text-gray-800'}`}>{t(`admin.audience.${a}`)}</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row-reverse mb-3">
          <TextInput value={tplName} onChangeText={setTplName} placeholder={t('admin.templateName')} className="flex-1 border border-gray-300 rounded-xl px-3 py-3 bg-white text-right" />
          <Pressable onPress={onSaveTpl} className="bg-gray-200 rounded-xl px-4 ml-2 items-center justify-center">
            <Text className="font-medium">{t('admin.saveTemplate')}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => send.mutate()} disabled={send.isPending || !title.trim() || !body.trim()} className={`rounded-xl py-3 items-center ${send.isPending ? 'bg-gray-400' : 'bg-brand'}`}>
          {send.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.alerts')}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
