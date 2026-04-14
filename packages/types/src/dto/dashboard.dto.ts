export interface AdminDashboardDto {
  totalUsers: number;
  totalGroups: number;
  totalFamilies: number;
  activeUsersThisMonth: number;
  ordersThisMonth: number;
  paymentsThisMonth: number;
  pendingPayments: number;
  totalRevenue: number;
  systemAlerts: SystemAlertDto[];
}

export interface SystemAlertDto {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  createdAt: Date;
}

export interface ManagerDashboardDto {
  groupId: string;
  groupName: string;
  totalMembers: number;
  totalFamilies: number;
  ordersThisMonth: number;
  paymentsThisMonth: number;
  pendingPayments: number;
  familiesWithOverduedPayments: FamilyPaymentStatusDto[];
}

export interface UserDashboardDto {
  userId: string;
  userName: string;
  groupId?: string;
  recentOrders: RecentOrderDto[];
  currentPaymentStatus: CurrentPaymentStatusDto;
  upcomingReminders: UpcomingReminderDto[];
}

export interface DistributorDashboardDto {
  pendingOrders: PendingOrderDto[];
  completedOrdersThisWeek: number;
  activeDistributionRoutes: number;
}

export interface FamilyPaymentStatusDto {
  familyId: string;
  familyName: string;
  overdueMonths: string[];
  totalAmountDue: number;
  lastPaymentDate?: Date;
}

export interface RecentOrderDto {
  id: string;
  monthKey: string;
  status: string;
  itemCount: number;
  createdAt: Date;
}

export interface CurrentPaymentStatusDto {
  monthKey: string;
  isPaid: boolean;
  amount?: number;
  dueDate?: Date;
  remindersSent: number;
}

export interface UpcomingReminderDto {
  id: string;
  type: string;
  channel: string;
  scheduledFor: Date;
}

export interface PendingOrderDto {
  id: string;
  familyName: string;
  monthKey: string;
  itemCount: number;
  createdAt: Date;
}
