import { api, unwrap } from './api';

export interface AlertItem {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  expiresAt: string | null;
  audience: string;
  recipientCount: number;
  deliveredCount: number;
  publishedBy: { id: string; fullName: string };
}

export async function getMyAlerts(limit = 30): Promise<AlertItem[]> {
  const res = await api.get('/me/alerts', { params: { limit } });
  return unwrap<AlertItem[]>(res.data);
}
