import { api, unwrap } from './api';

// ---------- Alerts (admin compose) ----------
export type AlertAudience = 'ALL_USERS' | 'GROUP_MANAGERS' | 'UNPAID_THIS_MONTH' | 'CURRENT_DISTRIBUTORS';

export async function createAlert(body: { title: string; body: string; audience?: AlertAudience; expiresAt?: string }) {
  const res = await api.post('/admin/alerts', body);
  return unwrap(res.data);
}

// ---------- Referrals ----------
export interface MyReferral {
  code: string;
  isActive: boolean;
  clickCount: number;
  paymentCount: number;
  totalAmount: number;
  landingSlug: string | null;
}
export interface ReferralStat {
  userId: string;
  fullName: string;
  phone: string;
  code: string;
  isActive: boolean;
  clickCount: number;
  paymentCount: number;
  totalAmount: number;
}

export async function getMyReferral(): Promise<MyReferral> {
  const res = await api.get('/referrals/me');
  return unwrap<MyReferral>(res.data);
}
export async function getReferralStats(): Promise<ReferralStat[]> {
  const res = await api.get('/referrals/admin/stats');
  const d: any = unwrap(res.data);
  return Array.isArray(d) ? d : (d?.items ?? []);
}

// ---------- Organization profile + onboarding ----------
export interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  paymentLink?: string | null;
  paymentDescription?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  whatsappUrl?: string | null;
  websiteUrl?: string | null;
  setupCompleted?: boolean;
}

export async function getOrgProfile(): Promise<OrgProfile> {
  const res = await api.get('/organization/profile');
  return unwrap<OrgProfile>(res.data);
}
export async function patchOrgProfile(body: Partial<OrgProfile>) {
  const res = await api.patch('/organization/profile', body);
  return unwrap<OrgProfile>(res.data);
}

export async function onboardingStep1(body: { name: string; address?: string; description?: string; logoUrl?: string }) {
  const res = await api.patch('/organization/me/onboarding/step-1', body);
  return unwrap(res.data);
}
export async function onboardingStep2(body: { paymentLink: string; paymentDescription?: string }) {
  const res = await api.patch('/organization/me/onboarding/step-2', body);
  return unwrap(res.data);
}
export async function onboardingStep3(body: { contactPhone?: string; contactEmail?: string; facebookUrl?: string; instagramUrl?: string; whatsappUrl?: string; websiteUrl?: string }) {
  const res = await api.patch('/organization/me/onboarding/step-3', body);
  return unwrap(res.data);
}

// ---------- Group members ----------
export interface GroupMember {
  memberId: string;
  joinedAt: string;
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  systemRole: string;
}
export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const res = await api.get(`/admin/groups/${groupId}/members`);
  const d: any = unwrap(res.data);
  return Array.isArray(d) ? d : (d?.items ?? []);
}
export async function assignGroupManager(groupId: string, userId: string) {
  const res = await api.post(`/admin/groups/${groupId}/assign-manager`, { userId });
  return unwrap(res.data);
}
export async function addGroupMember(groupId: string, userId: string) {
  const res = await api.post(`/admin/groups/${groupId}/members`, { userId });
  return unwrap(res.data);
}
export async function removeGroupMember(groupId: string, userId: string) {
  await api.delete(`/admin/groups/${groupId}/members/${userId}`);
}

// ---------- Weekly status ----------
export interface CurrentDistributor {
  groupId: string;
  groupName: string;
  distributorId: string;
  distributorName: string;
  assignedAt: string;
}
export interface IncompleteOrderRow {
  groupId: string;
  groupName: string;
  managerId: string | null;
  managerName: string | null;
  orderStatus?: string;
  completedOrders: number;
  totalOrders: number;
  lastUpdate: string;
}
export interface NoDistributorRow {
  groupId: string;
  groupName: string;
  managerId: string | null;
  managerName: string | null;
  lastActivity: string;
}

export async function getCurrentDistributors(): Promise<CurrentDistributor[]> {
  const res = await api.get('/admin/weekly-status/current-distributors');
  const d: any = unwrap(res.data);
  return Array.isArray(d) ? d : (d?.items ?? []);
}
export async function getIncompleteOrders(): Promise<IncompleteOrderRow[]> {
  const res = await api.get('/admin/weekly-status/incomplete-orders');
  const d: any = unwrap(res.data);
  return Array.isArray(d) ? d : (d?.items ?? []);
}
export async function getNoDistributorGroups(): Promise<NoDistributorRow[]> {
  const res = await api.get('/admin/weekly-status/no-distributor');
  const d: any = unwrap(res.data);
  return Array.isArray(d) ? d : (d?.items ?? []);
}
