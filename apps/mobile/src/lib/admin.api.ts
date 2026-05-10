import { api, unwrap } from './api';

export interface CreateUserBody { fullName: string; phone: string; email?: string }
export interface CreateFamilyBody {
  familyName: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  groupId?: string;
}
export interface CreateGroupBody { name: string; managerId?: string }

export async function createUser(body: CreateUserBody) {
  const res = await api.post('/admin/users', body);
  return unwrap(res.data);
}

export async function createFamily(body: CreateFamilyBody) {
  const res = await api.post('/admin/families', body);
  return unwrap(res.data);
}

export async function createGroup(body: CreateGroupBody) {
  const res = await api.post('/admin/groups', body);
  return unwrap(res.data);
}

export interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  systemRole: 'ADMIN' | 'USER';
  isActive: boolean;
  groupName?: string | null;
}
export interface AdminGroup { id: string; name: string; managerName?: string | null; memberCount?: number }

export async function listAdminUsers(params?: { search?: string; page?: number; limit?: number }): Promise<AdminUser[]> {
  const res = await api.get('/admin/users', { params: { limit: 100, ...params } });
  const d: any = unwrap(res.data);
  return Array.isArray(d) ? d : (d?.items ?? []);
}
export async function patchAdminUser(id: string, body: Partial<{ fullName: string; email: string; isActive: boolean; systemRole: 'ADMIN' | 'USER' }>) {
  const res = await api.patch(`/admin/users/${id}`, body);
  return unwrap(res.data);
}

export async function listAdminGroups(): Promise<AdminGroup[]> {
  const res = await api.get('/admin/groups', { params: { limit: 100 } });
  const d: any = unwrap(res.data);
  return Array.isArray(d) ? d : (d?.items ?? []);
}
export async function patchAdminGroup(id: string, body: Partial<{ name: string; managerId: string }>) {
  const res = await api.patch(`/admin/groups/${id}`, body);
  return unwrap(res.data);
}

export async function patchAdminFamily(id: string, body: Partial<CreateFamilyBody>) {
  const res = await api.patch(`/admin/families/${id}`, body);
  return unwrap(res.data);
}
