import { api, unwrap } from './api';

export interface WorkloadMember {
  userId: string;
  fullName: string;
  timesAsDistributor: number;
  lastAsDistributor?: string | null;
}

export interface DistributorWorkload {
  members: WorkloadMember[];
  highest: { userId: string; fullName: string; timesAsDistributor: number } | null;
  lowest: { userId: string; fullName: string; timesAsDistributor: number } | null;
}

export interface WeeklyStatus {
  weekStart: string;
  distributor: { assigned: boolean; userId?: string; fullName?: string; phone?: string };
  lastThreeDistributors: { userId: string; fullName: string; weekStart: string }[];
}

export async function getDistributorWorkload(): Promise<DistributorWorkload> {
  const res = await api.get('/manager/group/distributor-workload');
  return unwrap<DistributorWorkload>(res.data);
}

export async function getWeeklyStatus(weekKey?: string): Promise<WeeklyStatus> {
  const res = await api.get('/manager/group/weekly-status', {
    params: weekKey ? { weekKey } : undefined,
  });
  return unwrap<WeeklyStatus>(res.data);
}

export async function assignWeeklyDistributor(userId: string, weekKey?: string): Promise<void> {
  await api.post('/manager/group/weekly-distributor', { userId, weekKey });
}
