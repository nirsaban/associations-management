import { api, unwrap } from './api';
import type { AuthUser } from '@/store/auth.store';

export interface OrgChoice {
  id: string;
  name: string;
  slug: string;
}

export interface StartLoginResponse {
  sessionId?: string;
  otpSent: boolean;
  organizations?: OrgChoice[];
  requiresOrgSelection?: boolean;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export async function startLogin(phone: string): Promise<StartLoginResponse> {
  const res = await api.post('/auth/start-login', { phone });
  return unwrap<StartLoginResponse>(res.data);
}

export async function verifyOtp(args: {
  phone: string;
  otp: string;
  sessionId?: string;
  organizationId?: string;
}): Promise<VerifyOtpResponse> {
  const res = await api.post('/auth/verify-otp', args);
  return unwrap<VerifyOtpResponse>(res.data);
}

export interface MeResponse {
  id: string;
  phone: string;
  fullName: string;
  organizationId: string;
  isGroupManager?: boolean;
  managedGroupId?: string | null;
  groupMembershipGroupId?: string | null;
  setupCompleted?: boolean;
}

export async function getMe(): Promise<MeResponse> {
  const res = await api.get('/auth/me');
  return unwrap<MeResponse>(res.data);
}
