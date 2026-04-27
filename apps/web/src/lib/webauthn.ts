import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import api from './api';

export async function isWebAuthnSupported(): Promise<boolean> {
  try {
    if (!browserSupportsWebAuthn()) return false;
    // iOS always has Face ID / Touch ID
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
    // Android devices with biometrics
    if (/Android/i.test(navigator.userAgent)) return true;
    const available = await platformAuthenticatorIsAvailable();
    return available;
  } catch {
    return browserSupportsWebAuthn();
  }
}

export async function registerWebAuthn(deviceName?: string): Promise<boolean> {
  // Step 1: Get registration options from server
  const optionsRes = await api.post('/activation/webauthn/register/options');
  const options = optionsRes.data.data;

  // Step 2: Trigger browser biometric prompt
  const attestation = await startRegistration({ optionsJSON: options });

  // Step 3: Verify with server
  const verifyRes = await api.post('/activation/webauthn/register/verify', {
    attestation,
    deviceName,
  });

  return verifyRes.data.data.verified;
}

export async function authenticateWebAuthn(phone: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
}> {
  // Step 1: Get authentication options
  const optionsRes = await api.post('/activation/webauthn/authenticate/options', { phone });
  const options = optionsRes.data.data;

  // Step 2: Trigger browser biometric prompt
  const assertion = await startAuthentication({ optionsJSON: options });

  // Step 3: Verify with server and get tokens
  const verifyRes = await api.post('/activation/webauthn/authenticate/verify', {
    phone,
    assertion,
  });

  return verifyRes.data.data;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'Unknown Device';
}
