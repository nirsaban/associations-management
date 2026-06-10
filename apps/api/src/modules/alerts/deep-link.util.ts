import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * A notification deep-link is a SAME-ORIGIN relative path.
 *
 * The PWA service worker opens `notification.data.url` verbatim. A
 * protocol-relative URL (`//evil.com`) or a non-http scheme (`javascript:`,
 * `data:`) would be an open-redirect / code-execution vector, so an INTERNAL
 * link must start with a single `/` and not `//…`. External links to other
 * websites are validated separately by {@link isValidExternalLink}.
 */
export function isValidDeepLink(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v === '') return false;
  if (v.length > 512) return false;
  // Must be a relative path rooted at "/", but not protocol-relative "//".
  if (!v.startsWith('/') || v.startsWith('//')) return false;
  // Reject control chars / whitespace and any scheme-like content.
  if (/\s/.test(v)) return false;
  if (/[a-z][a-z0-9+.-]*:/i.test(v)) return false; // e.g. "javascript:", "http:"
  if (v.includes('\\')) return false;
  return true;
}

/**
 * A notification link to an EXTERNAL website.
 *
 * Admins may point an alert at a full URL on another site (e.g. a donation
 * page or an article). Only absolute `http(s)` URLs with a real host are
 * accepted — never `javascript:`, `data:`, `file:` or other schemes — and the
 * service worker opens them in a new browser context via
 * `clients.openWindow`. Alert composition is ADMIN-only, so this is a trusted
 * surface; the scheme allow-list still blocks code-execution payloads.
 */
export function isValidExternalLink(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v === '' || v.length > 512) return false;
  if (/\s/.test(v)) return false; // no whitespace / control chars
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return url.hostname.length > 0;
}

/**
 * An alert's `linkUrl` may be either an internal deep-link path or a safe
 * external http(s) URL.
 */
export function isValidAlertLink(value: unknown): value is string {
  return isValidDeepLink(value) || isValidExternalLink(value);
}

/**
 * Normalize a link value: trim, return undefined for empty.
 * Caller should still run isValidAlertLink for rejection.
 */
export function normalizeDeepLink(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const v = value.trim();
  return v === '' ? undefined : v;
}

@ValidatorConstraint({ name: 'isDeepLink', async: false })
export class IsDeepLinkConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    // Optional fields: empty / undefined is allowed (use @IsOptional alongside).
    if (value == null || value === '') return true;
    return isValidAlertLink(value);
  }

  defaultMessage(): string {
    return 'הקישור חייב להיות נתיב פנימי המתחיל ב-/ או כתובת אתר מלאה (https://...)';
  }
}

export function IsDeepLink(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDeepLinkConstraint,
    });
  };
}
