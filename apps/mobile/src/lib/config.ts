import Constants from 'expo-constants';

const fromEnv = process.env.EXPO_PUBLIC_API_URL;
const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_URL = fromEnv || fromExtra || 'http://localhost:3003/api/v1';
