import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * A notification deep-link must be a SAME-ORIGIN relative path.
 *
 * The PWA service worker opens `notification.data.url` verbatim. Allowing an
 * absolute URL (`https://…`) or a protocol-relative URL (`//evil.com`) would
 * let an admin (or anyone able to compose an alert) redirect users out of the
 * app — an open-redirect / phishing vector — and breaks PWA scope. So we only
 * accept paths that start with a single `/` and are not `//…`.
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
 * Normalize a deep-link value: trim, return undefined for empty.
 * Caller should still run isValidDeepLink for rejection.
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
    return isValidDeepLink(value);
  }

  defaultMessage(): string {
    return 'הקישור חייב להיות נתיב פנימי המתחיל ב-/ (ללא כתובת אתר חיצונית)';
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
