export function toE164IL(input?: string | null): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  if (input.startsWith('+')) return input;
  return `+${digits}`;
}

export function telHref(phone?: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
}

export function whatsappHref(phone?: string | null): string | null {
  const e164 = toE164IL(phone);
  if (!e164) return null;
  return `https://wa.me/${e164.replace('+', '')}`;
}

export function mapsHref(address?: string | null): string | null {
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
