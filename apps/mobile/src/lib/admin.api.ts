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
