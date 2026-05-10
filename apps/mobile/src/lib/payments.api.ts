import { api, unwrap } from './api';

export interface PaymentStatus {
  isPaid: boolean;
  monthKey: string;
  paidAt?: string;
}

export interface DonationInfo {
  paymentLink: string;
  paymentDescription?: string;
  organizationName: string;
  organizationLogoUrl?: string;
}

export interface PaymentItem {
  id: string;
  monthKey: string;
  amount?: number;
  status: string;
  paidAt?: string;
  createdAt: string;
}

export async function getPaymentStatus(): Promise<PaymentStatus> {
  const res = await api.get('/payments/me/status');
  return unwrap<PaymentStatus>(res.data);
}

export async function getMyPayments(page = 1, limit = 20): Promise<PaymentItem[]> {
  const res = await api.get('/payments/me', { params: { page, limit } });
  const data: any = unwrap(res.data);
  return Array.isArray(data) ? data : (data?.items ?? []);
}

export async function getDonationInfo(): Promise<DonationInfo> {
  const res = await api.get('/manager/donation-info');
  return unwrap<DonationInfo>(res.data);
}
