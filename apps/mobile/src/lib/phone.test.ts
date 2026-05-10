import { describe, it, expect } from 'vitest';
import { toE164IL, telHref, whatsappHref, mapsHref } from './phone';

describe('toE164IL', () => {
  it('converts 0XXXXXXXXX → +972XXXXXXXXX', () => {
    expect(toE164IL('0501234567')).toBe('+972501234567');
  });
  it('passes through +972', () => {
    expect(toE164IL('+972501234567')).toBe('+972501234567');
  });
  it('converts 972XXXXXXXXX → +972...', () => {
    expect(toE164IL('972501234567')).toBe('+972501234567');
  });
  it('strips dashes', () => {
    expect(toE164IL('050-123-4567')).toBe('+972501234567');
  });
  it('returns null for empty/null', () => {
    expect(toE164IL('')).toBeNull();
    expect(toE164IL(null)).toBeNull();
  });
});

describe('href helpers', () => {
  it('telHref produces tel: URI', () => {
    expect(telHref('050-1234567')).toBe('tel:0501234567');
  });
  it('whatsappHref produces wa.me URL without +', () => {
    expect(whatsappHref('0501234567')).toBe('https://wa.me/972501234567');
  });
  it('mapsHref encodes address', () => {
    expect(mapsHref('רחוב הרצל 1, תל אביב')).toContain('https://www.google.com/maps/search/?api=1&query=');
  });
  it('returns null for missing input', () => {
    expect(telHref(null)).toBeNull();
    expect(whatsappHref(undefined)).toBeNull();
    expect(mapsHref('')).toBeNull();
  });
});
