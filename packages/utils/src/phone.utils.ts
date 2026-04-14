/**
 * Normalize a phone number to E.164 format for Israeli numbers
 * Handles leading 0, country code +972, etc.
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");

  // Remove leading 0 if present
  if (normalized.startsWith("0")) {
    normalized = normalized.substring(1);
  }

  // Remove leading 972 (Israeli country code without +)
  if (normalized.startsWith("972")) {
    normalized = normalized.substring(3);
  }

  // Ensure it's a 9-digit Israeli number
  if (normalized.length !== 9) {
    return phone; // Return original if unable to parse
  }

  return `+972${normalized}`;
}

/**
 * Validate if a phone number is a valid Israeli phone number
 */
export function validateIsraeliPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Check if it starts with 0 (local) and is 10 digits
  if (digits.startsWith("0") && digits.length === 10) {
    return true;
  }

  // Check if it's 9 digits (without leading 0)
  if (digits.length === 9 && !digits.startsWith("0")) {
    return true;
  }

  // Check if it starts with 972 and is 12 digits
  if (digits.startsWith("972") && digits.length === 12) {
    return true;
  }

  // Check if it starts with +972
  if (phone.startsWith("+972")) {
    const rest = phone.substring(4).replace(/\D/g, "");
    return rest.length === 9;
  }

  return false;
}

/**
 * Format a phone number for display (e.g., "054-1234567" or "+972-54-1234567")
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);

  // Remove + prefix for local display
  let digits = normalized.replace(/\D/g, "");

  // Israeli phone format: XXX-XXXX-XXX (with country code prefix shown)
  if (digits.startsWith("972")) {
    // Format as +972-XX-XXXX-XXX
    const areaCode = digits.substring(3, 5);
    const firstPart = digits.substring(5, 9);
    const lastPart = digits.substring(9);
    return `+972-${areaCode}-${firstPart}-${lastPart}`;
  }

  // Fall back to simple formatting
  return phone;
}

/**
 * Extract just the phone number digits (for comparison)
 */
export function extractPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
