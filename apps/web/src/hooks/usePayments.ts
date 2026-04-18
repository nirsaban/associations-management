import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  monthKey: string;
  paymentDate?: string;
  source?: string;
  status: string;
  createdAt: string;
}

export interface PaymentStatus {
  isPaid: boolean;
  monthKey: string;
  paidAt?: string;
}

export function usePayments(page: number = 1, limit: number = 10) {
  const myPayments = useQuery({
    queryKey: ['payments', 'me', page, limit],
    queryFn: async () => {
      const response = await api.get<{
        data: Payment[];
        meta: { total: number; page: number; limit: number };
      }>(`${API_ROUTES.PAYMENTS.ME}?page=${page}&limit=${limit}`);
      return response.data;
    },
  });

  const currentStatus = useQuery({
    queryKey: ['payments', 'status'],
    queryFn: async () => {
      const response = await api.get<{ data: PaymentStatus }>(API_ROUTES.PAYMENTS.STATUS);
      return response.data.data;
    },
  });

  const history = useQuery({
    queryKey: ['payments', 'history', page, limit],
    queryFn: async () => {
      const response = await api.get<{
        data: Payment[];
        meta: { total: number; page: number; limit: number };
      }>(`${API_ROUTES.PAYMENTS.HISTORY}?page=${page}&limit=${limit}`);
      return response.data;
    },
  });

  return {
    myPayments,
    currentStatus,
    history,
  };
}
