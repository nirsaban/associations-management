import { api, unwrap } from './api';

export interface DistributionFamily {
  id: string;
  name: string;
  contactPhone: string | null;
  address: string | null;
  delivered: boolean;
  deliveredAt: string | null;
  weeklyOrderContent?: string | null;
}

export interface WeeklyDistributionResponse {
  isDistributor: boolean;
  assignmentId?: string;
  weekStart?: string;
  groupName?: string;
  families: DistributionFamily[];
  totalCount: number;
  deliveredCount: number;
}

export async function getMyWeeklyDistribution(): Promise<WeeklyDistributionResponse> {
  const res = await api.get('/me/weekly-distribution');
  return unwrap<WeeklyDistributionResponse>(res.data);
}

export async function setFamilyDelivered(
  familyId: string,
  delivered: boolean
): Promise<{ id: string; familyId: string; delivered: boolean; deliveredAt: string | null }> {
  const res = await api.put(`/me/weekly-distribution/families/${familyId}`, { delivered });
  return unwrap(res.data);
}
