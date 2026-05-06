/**
 * Shared week key utilities.
 * Week key format: "YYYY-WNN" (e.g. "2026-W19").
 *
 * NOTE: This is NOT ISO 8601 strict week numbering. It uses the same
 * simple formula that was already in use across the codebase (calendar
 * week based on Jan 1 day-of-week). Do not change the formula without
 * migrating all existing weekKey data in the database.
 */

/**
 * Returns the current week key in "YYYY-WNN" format.
 */
export function getCurrentWeekKey(): string {
  return dateToWeekKey(new Date());
}

/**
 * Returns the current month key in "YYYY-MM" format.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Converts an arbitrary Date to a "YYYY-WNN" week key.
 */
export function dateToWeekKey(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
  );
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Returns the week key N weeks ago from today.
 */
export function weekKeyNWeeksAgo(n: number): string {
  const past = new Date(Date.now() - n * 7 * 86400000);
  return dateToWeekKey(past);
}

/**
 * Parses a "YYYY-WNN" week key and returns the ISO date string (YYYY-MM-DD)
 * for the Monday of that week. Returns the input unchanged if format is unknown.
 */
export function weekKeyToMondayIso(weekKey: string): string {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    return weekKey;
  }
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay();
  const daysToFirstMonday = jan1Day === 0 ? 1 : jan1Day === 1 ? 0 : 8 - jan1Day;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
  const monday = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000);
  return monday.toISOString().split('T')[0];
}
