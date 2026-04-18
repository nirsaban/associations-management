import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/auth.store';

export interface AdminDashboard {
  totalUsers: number;
  totalGroups: number;
  totalFamilies: number;
  pendingPayments: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  paymentStats: {
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
}

export interface ManagerDashboard {
  groupName: string;
  memberCount: number;
  familyCount: number;
  pendingTasks: number;
  thisWeekOrders: number;
  weeklyOverview: {
    day: string;
    familiesServed: number;
    status: 'pending' | 'completed';
  }[];
}

export interface UserDashboard {
  currentPayment: {
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid';
  } | null;
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    createdAt: string;
  }>;
}

export function useDashboard() {
  const { user } = useAuthStore();

  const adminDashboard = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const response = await api.get<{ data: AdminDashboard }>('/admin/dashboard');
      return response.data.data;
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const managerDashboard = useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: async () => {
      const response = await api.get<{ data: ManagerDashboard }>(API_ROUTES.DASHBOARD.MANAGER);
      return response.data.data;
    },
    enabled: !!user && user.systemRole !== 'ADMIN' && user.systemRole !== 'USER',
  });

  const userDashboard = useQuery({
    queryKey: ['dashboard', 'user'],
    queryFn: async () => {
      const response = await api.get<{ data: UserDashboard }>(API_ROUTES.DASHBOARD.USER);
      return response.data.data;
    },
    enabled: user?.systemRole === 'USER',
  });

  return {
    adminDashboard,
    managerDashboard,
    userDashboard,
  };
}
