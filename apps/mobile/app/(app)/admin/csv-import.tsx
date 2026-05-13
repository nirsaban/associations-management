import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { csvToRecords } from '@/lib/csv';
import { createFamily } from '@/lib/admin.api';

export default function CsvImportScreen() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', '*/*'] });
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    const text = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    const { headers, rows } = csvToRecords(text);
    setHeaders(headers); setRows(rows);
    setProgress({ done: 0, total: 0, errors: 0 });
  }

  async function importAll() {
    if (!rows.length) return;
    setBusy(true);
    setProgress({ done: 0, total: rows.length, errors: 0 });
    let errors = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const familyName = r.familyName || r['שם משפחה'] || r.name;
      if (!familyName) { errors++; setProgress({ done: i + 1, total: rows.length, errors }); continue; }
      try {
        await createFamily({
          familyName,
          contactName: r.contactName || r['איש קשר'],
          contactPhone: r.contactPhone || r['טלפון'] || r.phone,
          address: r.address || r['כתובת'],
          notes: r.notes || r['הערות'],
        });
      } catch { errors++; }
      setProgress({ done: i + 1, total: rows.length, errors });
    }
    setBusy(false);
    Alert.alert(t('csv.doneTitle'), t('csv.doneMessage', { ok: rows.length - errors, err: errors }));
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('csv.title') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-right text-gray-700 mb-2">{t('csv.help')}</Text>
        <Text className="text-right text-gray-500 text-xs mb-4">{t('csv.columns')}</Text>

        <Pressable onPress={pick} className="bg-brand rounded-xl py-3 items-center mb-3">
          <Text className="text-white font-semibold">{t('csv.pickFile')}</Text>
        </Pressable>

        {!!rows.length && (
          <>
            <Text className="text-right text-gray-700 mb-2">{t('csv.preview', { n: rows.length })}</Text>
            <View className="bg-white border border-gray-200 rounded-2xl p-3 mb-3">
              <Text className="text-right text-xs text-gray-500" style={{ writingDirection: 'ltr', textAlign: 'left' }}>{headers.join(' | ')}</Text>
              {rows.slice(0, 5).map((r, i) => (
                <Text key={i} className="text-right text-xs mt-1" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                  {headers.map((h) => r[h] ?? '').join(' | ')}
                </Text>
              ))}
              {rows.length > 5 && <Text className="text-gray-500 text-xs mt-2 text-right">…</Text>}
            </View>

            {busy ? (
              <View className="items-center py-4">
                <ActivityIndicator size="large" />
                <Text className="mt-2 text-gray-600">{progress.done}/{progress.total}</Text>
              </View>
            ) : (
              <Pressable onPress={importAll} className="bg-green-600 rounded-xl py-3 items-center">
                <Text className="text-white font-semibold">{t('csv.import', { n: rows.length })}</Text>
              </Pressable>
            )}
            {progress.total > 0 && !busy && (
              <Text className="text-center mt-3 text-gray-600">
                {t('csv.lastResult', { ok: progress.total - progress.errors, err: progress.errors })}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
