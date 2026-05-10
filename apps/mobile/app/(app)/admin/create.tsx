import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { createUser, createFamily, createGroup } from '@/lib/admin.api';

type Tab = 'user' | 'family' | 'group';

function Field(props: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; ltr?: boolean }) {
  return (
    <View className="mb-3">
      <Text className="text-right text-gray-700 mb-1">{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right"
        style={props.ltr ? { writingDirection: 'ltr', textAlign: 'left' } : undefined}
      />
    </View>
  );
}

function UserForm() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!fullName.trim() || !phone.trim()) return;
    setBusy(true);
    try {
      await createUser({ fullName, phone, email: email || undefined });
      Alert.alert(t('admin.saved'));
      setFullName(''); setPhone(''); setEmail('');
    } catch (e: any) {
      Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic'));
    } finally { setBusy(false); }
  }

  return (
    <View>
      <Field label={t('admin.fields.fullName')} value={fullName} onChangeText={setFullName} />
      <Field label={t('admin.fields.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" ltr />
      <Field label={t('admin.fields.email')} value={email} onChangeText={setEmail} keyboardType="email-address" ltr />
      <Pressable onPress={submit} disabled={busy} className={`rounded-xl py-3 items-center ${busy ? 'bg-gray-400' : 'bg-brand'}`}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
      </Pressable>
    </View>
  );
}

function FamilyForm() {
  const { t } = useTranslation();
  const [familyName, setFamilyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!familyName.trim()) return;
    setBusy(true);
    try {
      await createFamily({ familyName, contactName: contactName || undefined, contactPhone: contactPhone || undefined, address: address || undefined, notes: notes || undefined });
      Alert.alert(t('admin.saved'));
      setFamilyName(''); setContactName(''); setContactPhone(''); setAddress(''); setNotes('');
    } catch (e: any) {
      Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic'));
    } finally { setBusy(false); }
  }

  return (
    <View>
      <Field label={t('admin.fields.familyName')} value={familyName} onChangeText={setFamilyName} />
      <Field label={t('admin.fields.contactName')} value={contactName} onChangeText={setContactName} />
      <Field label={t('admin.fields.phone')} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" ltr />
      <Field label={t('admin.fields.address')} value={address} onChangeText={setAddress} />
      <Field label={t('admin.fields.notes')} value={notes} onChangeText={setNotes} />
      <Pressable onPress={submit} disabled={busy} className={`rounded-xl py-3 items-center ${busy ? 'bg-gray-400' : 'bg-brand'}`}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
      </Pressable>
    </View>
  );
}

function GroupForm() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createGroup({ name });
      Alert.alert(t('admin.saved'));
      setName('');
    } catch (e: any) {
      Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic'));
    } finally { setBusy(false); }
  }

  return (
    <View>
      <Field label={t('admin.fields.groupName')} value={name} onChangeText={setName} />
      <Pressable onPress={submit} disabled={busy} className={`rounded-xl py-3 items-center ${busy ? 'bg-gray-400' : 'bg-brand'}`}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('admin.save')}</Text>}
      </Pressable>
    </View>
  );
}

export default function AdminScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('user');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'user', label: t('admin.createUser') },
    { key: 'family', label: t('admin.createFamily') },
    { key: 'group', label: t('admin.createGroup') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.title') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row-reverse gap-2 mb-4">
          {tabs.map((tb) => (
            <Pressable
              key={tb.key}
              onPress={() => setTab(tb.key)}
              className={`flex-1 rounded-xl py-2 items-center border ${tab === tb.key ? 'bg-brand border-brand' : 'bg-white border-gray-300'}`}
            >
              <Text className={tab === tb.key ? 'text-white font-medium' : 'text-gray-700'}>{tb.label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-200">
          {tab === 'user' && <UserForm />}
          {tab === 'family' && <FamilyForm />}
          {tab === 'group' && <GroupForm />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
