import { describe, it, expect } from 'vitest';
import { isoWeekKey } from './week';

describe('isoWeekKey', () => {
  it('formats as YYYY-Www', () => {
    expect(isoWeekKey(new Date('2026-04-15T12:00:00Z'))).toMatch(/^\d{4}-W\d{2}$/);
  });
  it('week 1 falls early in the year', () => {
    expect(isoWeekKey(new Date('2026-01-05T12:00:00Z'))).toBe('2026-W02');
  });
  it('mid-year week is sensible', () => {
    expect(isoWeekKey(new Date('2026-04-15T12:00:00Z'))).toBe('2026-W16');
  });
});
