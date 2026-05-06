/**
 * Converts an Israeli phone number to E.164 format for use in wa.me links.
 * Returns null for empty / undefined input.
 *
 * Supported input formats:
 *   05X-XXXXXXX  →  +9725XXXXXXXX
 *   0XXXXXXXXX   →  +972XXXXXXXXX
 *   +972XXXXXXXX →  +972XXXXXXXX  (passthrough)
 *   972XXXXXXXX  →  +972XXXXXXXX
 */
export function formatPhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) return null;

  if (digits.startsWith('972')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+972${digits.slice(1)}`;
  }

  return `+972${digits}`;
}
