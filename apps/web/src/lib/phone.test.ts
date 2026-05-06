import { describe, it, expect } from 'vitest';
import { formatPhoneForWhatsApp } from './phone';

describe('formatPhoneForWhatsApp', () => {
  it('ממיר מספר ישראלי עם מקף לפורמט E.164', () => {
    expect(formatPhoneForWhatsApp('054-1234567')).toBe('+972541234567');
  });

  it('מחזיר מספר E.164 שכבר תקין ללא שינוי', () => {
    expect(formatPhoneForWhatsApp('+972541234567')).toBe('+972541234567');
  });

  it('מוסיף + למספר המתחיל ב-972', () => {
    expect(formatPhoneForWhatsApp('972541234567')).toBe('+972541234567');
  });

  it('ממיר מספר ישראלי ללא מקפים לפורמט E.164', () => {
    expect(formatPhoneForWhatsApp('0541234567')).toBe('+972541234567');
  });

  it('מחזיר null עבור מחרוזת ריקה', () => {
    expect(formatPhoneForWhatsApp('')).toBeNull();
  });

  it('מחזיר null עבור undefined', () => {
    expect(formatPhoneForWhatsApp(undefined)).toBeNull();
  });

  it('מחזיר null עבור null', () => {
    expect(formatPhoneForWhatsApp(null)).toBeNull();
  });
});
