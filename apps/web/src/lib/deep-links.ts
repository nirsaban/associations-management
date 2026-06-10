/**
 * Catalog of in-app deep-link destinations for push notifications.
 *
 * When an admin composes an alert they pick one of these (or enter a custom
 * relative path). The chosen path is stored on the Alert and put into the push
 * payload's `data.url`; the service worker opens it on notification click.
 *
 * IMPORTANT: only same-origin RELATIVE paths are allowed. An absolute or
 * protocol-relative URL would let a notification redirect users out of the app
 * (open-redirect / phishing) and breaks PWA scope. Keep this in sync with the
 * backend validator in apps/api/src/modules/alerts/deep-link.util.ts.
 */

export interface DeepLinkOption {
  /** Relative path, e.g. "/community/tehillim" */
  value: string;
  /** Hebrew label shown to the admin */
  label: string;
  /** Optional grouping for the picker */
  group: string;
}

export const DEEP_LINK_OPTIONS: DeepLinkOption[] = [
  // General
  { value: '/', label: 'דף הבית', group: 'כללי' },
  { value: '/notifications', label: 'התראות', group: 'כללי' },
  { value: '/payments', label: 'תשלומים', group: 'כללי' },
  { value: '/profile', label: 'פרופיל אישי', group: 'כללי' },

  // Weekly operations
  { value: '/weekly', label: 'חלוקה שבועית', group: 'פעילות שבועית' },
  { value: '/manager/weekly-orders', label: 'הזמנות שבועיות (מנהל קבוצה)', group: 'פעילות שבועית' },
  { value: '/manager/weekly-distributor', label: 'מחלק שבועי (מנהל קבוצה)', group: 'פעילות שבועית' },

  // User
  { value: '/user/dashboard', label: 'לוח משתמש', group: 'משתמש' },
  { value: '/my-donations', label: 'התרומות שלי', group: 'משתמש' },
  { value: '/my-group', label: 'הקבוצה שלי', group: 'משתמש' },

  // Community
  { value: '/community/tehillim', label: 'תהילים יומי', group: 'קהילה' },
  { value: '/community/zmanim', label: 'זמני היום', group: 'קהילה' },
  { value: '/community/people', label: 'אנשי הקהילה', group: 'קהילה' },
  { value: '/community/pass-it-on', label: 'תנו הלאה', group: 'קהילה' },

  // Admin
  { value: '/admin', label: 'לוח ניהול (אדמין)', group: 'ניהול' },
  { value: '/admin/orders', label: 'הזמנות (אדמין)', group: 'ניהול' },
  { value: '/admin/unpaid', label: 'טרם שילמו (אדמין)', group: 'ניהול' },
];

/**
 * A notification deep-link must be a same-origin relative path.
 * Mirror of the backend `isValidDeepLink`.
 */
export function isValidDeepLink(value: string): boolean {
  const v = value.trim();
  if (v === '') return false;
  if (v.length > 512) return false;
  if (!v.startsWith('/') || v.startsWith('//')) return false;
  if (/\s/.test(v)) return false;
  if (/[a-z][a-z0-9+.-]*:/i.test(v)) return false; // scheme like "http:" / "javascript:"
  if (v.includes('\\')) return false;
  return true;
}

/**
 * A full external website link (another site). Only http(s) with a real host.
 * Mirror of the backend `isValidExternalLink`.
 */
export function isValidExternalLink(value: string): boolean {
  const v = value.trim();
  if (v === '' || v.length > 512) return false;
  if (/\s/.test(v)) return false;
  try {
    const url = new URL(v);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
  } catch {
    return false;
  }
}

/** True when the value looks like an external http(s) URL (not an internal path). */
export function isExternalLink(value?: string | null): boolean {
  return !!value && /^https?:\/\//i.test(value.trim());
}

/** An alert link may be an internal path OR a safe external URL. */
export function isValidAlertLink(value: string): boolean {
  return isValidDeepLink(value) || isValidExternalLink(value);
}

/** Human label for a stored linkUrl (falls back to the host / raw path). */
export function deepLinkLabel(value?: string | null): string {
  if (!value) return 'דף הבית';
  const match = DEEP_LINK_OPTIONS.find((o) => o.value === value);
  if (match) return match.label;
  if (isExternalLink(value)) {
    try {
      return new URL(value).hostname;
    } catch {
      return value;
    }
  }
  return value;
}
