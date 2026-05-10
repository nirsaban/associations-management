import { api, unwrap } from './api';
import { useAuthStore } from '@/store/auth.store';

export interface FamilyOrder {
  id: string;
  weekKey: string;
  shoppingListJson?: any;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export interface Family {
  id: string;
  organizationId: string;
  familyName: string;
  groupId?: string | null;
  groupName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
  orders?: FamilyOrder[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFamilies {
  items: Family[];
  total?: number;
  page?: number;
  limit?: number;
}

function isAdmin() {
  const u = useAuthStore.getState().user;
  return u?.systemRole === 'ADMIN' || u?.platformRole === 'SUPER_ADMIN';
}

export async function listFamilies(params?: { page?: number; limit?: number; groupId?: string }): Promise<Family[]> {
  const path = isAdmin() ? '/admin/families' : '/manager/group/families';
  const res = await api.get(path, { params });
  const data: any = unwrap(res.data);
  if (Array.isArray(data)) return data as Family[];
  return (data?.items ?? data?.data ?? []) as Family[];
}

export async function getFamily(id: string): Promise<Family> {
  const res = await api.get(`/admin/families/${id}`);
  return unwrap<Family>(res.data);
}
