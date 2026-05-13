import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Stack, Link } from 'expo-router';

function Tile({ href, label }: { href: any; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable className="bg-white border border-gray-200 rounded-2xl py-5 px-4 mb-3 active:bg-gray-50">
        <Text className="text-right text-lg font-semibold">{label}</Text>
      </Pressable>
    </Link>
  );
}

export default function AdminIndex() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: t('admin.title') }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Tile href="/(app)/admin/users" label={t('admin.users')} />
        <Tile href="/(app)/admin/groups" label={t('admin.groupsList')} />
        <Tile href="/(app)/admin/families" label={t('families.title')} />
        <Tile href="/(app)/admin/create" label={t('admin.createNew')} />
        <Tile href="/(app)/admin/alerts" label={t('admin.alerts')} />
        <Tile href="/(app)/admin/weekly-status" label={t('admin.weeklyStatus')} />
        <Tile href="/(app)/admin/referrals" label={t('admin.referralsAdmin')} />
        <Tile href="/(app)/admin/org-profile" label={t('admin.orgProfile')} />
        <Tile href="/(app)/admin/csv-import" label={t('csv.title')} />
      </ScrollView>
    </SafeAreaView>
  );
}
