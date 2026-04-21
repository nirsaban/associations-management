// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  ACTIVATION: {
    PUSH_SUBSCRIBE: '/activation/push/subscribe',
    PUSH_UNSUBSCRIBE: '/activation/push/unsubscribe',
    VAPID_PUBLIC_KEY: '/activation/push/vapid-public-key',
    WEBAUTHN_REGISTER_OPTIONS: '/activation/webauthn/register/options',
    WEBAUTHN_REGISTER_VERIFY: '/activation/webauthn/register/verify',
    WEBAUTHN_AUTH_OPTIONS: '/activation/webauthn/authenticate/options',
    WEBAUTHN_AUTH_VERIFY: '/activation/webauthn/authenticate/verify',
    COMPLETE: '/activation/complete',
  },
  ORGANIZATION: {
    ME: '/organization/me',
    SETUP: '/organization/me/setup',
    LOGO: '/organization/me/logo',
  },
  USERS: {
    LIST: '/admin/users',
    GET: (id: string) => `/admin/users/${id}`,
    UPDATE: (id: string) => `/admin/users/${id}`,
    DELETE: (id: string) => `/admin/users/${id}`,
    ME: '/auth/me',
  },
  GROUPS: {
    LIST: '/admin/groups',
    GET: (id: string) => `/admin/groups/${id}`,
    CREATE: '/admin/groups',
    UPDATE: (id: string) => `/admin/groups/${id}`,
    DELETE: (id: string) => `/admin/groups/${id}`,
    MEMBERS: (id: string) => `/admin/groups/${id}/members`,
  },
  FAMILIES: {
    LIST: '/admin/families',
    GET: (id: string) => `/admin/families/${id}`,
    CREATE: '/admin/families',
    UPDATE: (id: string) => `/admin/families/${id}`,
    DELETE: (id: string) => `/admin/families/${id}`,
  },
  DONATIONS: {
    LIST: '/donations',
    GET: (id: string) => `/donations/${id}`,
    CREATE: '/donations',
    UPDATE: (id: string) => `/donations/${id}`,
  },
  WEEKLY: {
    GET_CURRENT: '/weekly/current',
    GET: (id: string) => `/weekly/${id}`,
    UPDATE: (id: string) => `/weekly/${id}`,
    ASSIGN_DISTRIBUTOR: (id: string) => `/weekly/${id}/assign-distributor`,
  },
  PAYMENTS: {
    ME: '/payments/me',
    STATUS: '/payments/me/status',
    HISTORY: '/payments/history',
    UNPAID: (monthKey: string) => `/payments/unpaid/${monthKey}`,
  },
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    MANAGER: '/dashboard/manager',
    USER: '/dashboard/user',
  },
  MANAGER: {
    GROUP: '/manager/group',
    WEEKLY_STATUS: '/manager/group/weekly-status',
    FAMILIES: '/manager/group/families',
    FAMILY_ORDER: (familyId: string) => `/manager/group/families/${familyId}/weekly-order`,
    FAMILY_UPDATE: (familyId: string) => `/manager/group/families/${familyId}`,
    MEMBERS_PAYMENT: '/manager/group/members-and-payment-status',
    DISTRIBUTOR_WORKLOAD: '/manager/group/distributor-workload',
    DISTRIBUTOR_ASSIGN: '/manager/group/weekly-distributor',
    REVENUE: '/manager/group/revenue',
    DONATION_INFO: '/manager/donation-info',
    MY_PAYMENTS: '/manager/my-payments',
  },
  ALERTS: {
    ME: '/me/alerts',
    ADMIN_LIST: '/admin/alerts',
    ADMIN_CREATE: '/admin/alerts',
    ADMIN_DELETE: (id: string) => `/admin/alerts/${id}`,
  },
};

// Role Labels in Hebrew
export const ROLE_LABELS: Record<string, string> = {
  admin: 'מנהל מערכת',
  manager: 'מנהל קבוצה',
  user: 'משתמש רגיל',
  distributor: 'מחלק',
};

// Month Names in Hebrew
export const MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

// Week Day Names in Hebrew
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// Payment Status Labels
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  overdue: 'באיחור',
  cancelled: 'בוטל',
};

// Validation Patterns
export const PATTERNS = {
  ISRAELI_PHONE: /^(?:0(?:2|3|4|8|9)|050|051|052|053|054|055|058|059)\d{7}$/,
  ID_NUMBER: /^\d{9}$/,
};
