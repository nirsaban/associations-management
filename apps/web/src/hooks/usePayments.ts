import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';

export interface Payment {
  id: string;
  userId: string;
  groupId: string;
  amount: number;
  month: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistory extends Payment {
  userName: string;
  groupName: string;
}

export function usePayments() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get<{ data: Payment[] }>(
        API_ROUTES.PAYMENTS.LIST
      );
      return response.data.data;
    },
  });

  const get = (id: string) =>
    useQuery({
      queryKey: ['payment', id],
      queryFn: async () => {
        const response = await api.get<{ data: Payment }>(
          API_ROUTES.PAYMENTS.GET(id)
        );
        return response.data.data;
      },
      enabled: !!id,
    });

  const history = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: async () => {
      const response = await api.get<{ data: PaymentHistory[] }>(
        API_ROUTES.PAYMENTS.HISTORY
      );
      return response.data.data;
    },
  });

  const pay = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ data: Payment }>(
        API_ROUTES.PAYMENTS.PAY(id),
        {}
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'history'] });
    },
  });

  return {
    list,
    get,
    history,
    pay,
  };
}
