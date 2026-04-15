// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  ORGANIZATION: {
    ME: '/organization/me',
    SETUP: '/organization/me/setup',
    LOGO: '/organization/me/logo',
  },
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    ME: '/users/me',
  },
  GROUPS: {
    LIST: '/groups',
    GET: (id: string) => `/groups/${id}`,
    CREATE: '/groups',
    UPDATE: (id: string) => `/groups/${id}`,
    DELETE: (id: string) => `/groups/${id}`,
    MEMBERS: (id: string) => `/groups/${id}/members`,
  },
  FAMILIES: {
    LIST: '/families',
    GET: (id: string) => `/families/${id}`,
    CREATE: '/families',
    UPDATE: (id: string) => `/families/${id}`,
    DELETE: (id: string) => `/families/${id}`,
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
    LIST: '/payments',
    GET: (id: string) => `/payments/${id}`,
    PAY: (id: string) => `/payments/${id}/pay`,
    HISTORY: '/payments/history',
  },
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    MANAGER: '/dashboard/manager',
    USER: '/dashboard/user',
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
export const DAY_NAMES = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
  'שבת',
];

// Payment Status Labels
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  overdue: '逾期',
  cancelled: 'בוטל',
};

// Validation Patterns
export const PATTERNS = {
  ISRAELI_PHONE: /^(?:0(?:2|3|4|8|9)|050|051|052|053|054|055|058|059)\d{7}$/,
  ID_NUMBER: /^\d{9}$/,
};
