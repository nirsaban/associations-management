import { api, unwrap } from './api';

export interface WeeklyOrder {
  id: string;
  organizationId: string;
  groupId: string;
  familyId: string;
  weekKey: string;
  items: any[];
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listWeeklyOrders(week?: string): Promise<WeeklyOrder[]> {
  const res = await api.get('/weekly-orders', { params: { week, limit: 100 } });
  const data: any = unwrap(res.data);
  return Array.isArray(data) ? data : (data?.items ?? []);
}

export async function getFamilyWeeklyOrder(familyId: string, weekKey: string): Promise<WeeklyOrder | null> {
  try {
    const res = await api.get(`/manager/group/families/${familyId}/weekly-order`, { params: { weekKey } });
    return unwrap<WeeklyOrder>(res.data);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function upsertFamilyWeeklyOrder(
  familyId: string,
  weekKey: string,
  items: any[],
  notes?: string,
): Promise<WeeklyOrder> {
  const res = await api.put(`/manager/group/families/${familyId}/weekly-order`, { weekKey, items, notes });
  return unwrap<WeeklyOrder>(res.data);
}

export async function completeWeeklyOrder(id: string): Promise<WeeklyOrder> {
  const res = await api.post(`/weekly-orders/${id}/complete`);
  return unwrap<WeeklyOrder>(res.data);
}
