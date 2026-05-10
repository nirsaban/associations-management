import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from './storage';

const KEY = 'biometric.enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const has = await LocalAuthentication.hasHardwareAsync();
  if (!has) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await secureStorage.getItem(KEY)) === '1';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await secureStorage.setItem(KEY, enabled ? '1' : '0');
}

export async function authenticate(reason: string): Promise<boolean> {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: '',
    disableDeviceFallback: false,
  });
  return res.success;
}
