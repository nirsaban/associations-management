import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Stack, useRouter } from 'expo-router';
import { onboardingStep1, onboardingStep2, onboardingStep3 } from '@/lib/extra.api';

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  // Step 2
  const [paymentLink, setPaymentLink] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  // Step 3
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  async function next() {
    setBusy(true);
    try {
      if (step === 1) { await onboardingStep1({ name, address: address || undefined, description: description || undefined }); setStep(2); }
      else if (step === 2) { await onboardingStep2({ paymentLink, paymentDescription: paymentDescription || undefined }); setStep(3); }
      else { await onboardingStep3({ contactPhone: contactPhone || undefined, contactEmail: contactEmail || undefined, websiteUrl: websiteUrl || undefined }); Alert.alert(t('onboarding.completed')); router.replace('/(app)/'); }
    } catch (e: any) { Alert.alert(e?.response?.data?.message ?? t('auth.errors.generic')); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('onboarding.title') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row-reverse gap-2 mb-4">
          {[1, 2, 3].map((n) => (
            <View key={n} className={`flex-1 h-2 rounded-full ${step >= n ? 'bg-brand' : 'bg-gray-300'}`} />
          ))}
        </View>
        <Text className="text-right text-2xl font-bold mb-4">{t(`onboarding.step${step}` as any)}</Text>

        {step === 1 && (
          <>
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.fullName')}</Text>
            <TextInput value={name} onChangeText={setName} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.address')}</Text>
            <TextInput value={address} onChangeText={setAddress} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.description')}</Text>
            <TextInput value={description} onChangeText={setDescription} multiline className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right min-h-[80px] mb-3" />
          </>
        )}
        {step === 2 && (
          <>
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.paymentLink')}</Text>
            <TextInput value={paymentLink} onChangeText={setPaymentLink} keyboardType="url" className="border border-gray-300 rounded-xl px-3 py-3 bg-white mb-3" style={{ writingDirection: 'ltr', textAlign: 'left' }} />
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.paymentDescription')}</Text>
            <TextInput value={paymentDescription} onChangeText={setPaymentDescription} className="border border-gray-300 rounded-xl px-3 py-3 bg-white text-right mb-3" />
          </>
        )}
        {step === 3 && (
          <>
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.phone')}</Text>
            <TextInput value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" className="border border-gray-300 rounded-xl px-3 py-3 bg-white mb-3" style={{ writingDirection: 'ltr', textAlign: 'left' }} />
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.email')}</Text>
            <TextInput value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" className="border border-gray-300 rounded-xl px-3 py-3 bg-white mb-3" style={{ writingDirection: 'ltr', textAlign: 'left' }} />
            <Text className="text-right text-gray-700 mb-1">{t('admin.fields.website')}</Text>
            <TextInput value={websiteUrl} onChangeText={setWebsiteUrl} keyboardType="url" className="border border-gray-300 rounded-xl px-3 py-3 bg-white mb-3" style={{ writingDirection: 'ltr', textAlign: 'left' }} />
          </>
        )}

        <View className="flex-row-reverse gap-2 mt-2">
          {step > 1 && (
            <Pressable onPress={() => setStep((s) => (s - 1) as any)} disabled={busy} className="flex-1 rounded-xl py-3 items-center bg-gray-300">
              <Text className="font-semibold">{t('onboarding.back')}</Text>
            </Pressable>
          )}
          <Pressable onPress={next} disabled={busy} className={`flex-1 rounded-xl py-3 items-center ${busy ? 'bg-gray-400' : 'bg-brand'}`}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{step === 3 ? t('onboarding.finish') : t('onboarding.next')}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
