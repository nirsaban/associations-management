/**
 * Get current month key in YYYY-MM format
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get the start date of the week (Sunday)
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Format a date in Hebrew format (e.g., "14 באפריל 2026")
 */
export function formatHebrewDate(date: Date): string {
  const hebrewMonths = [
    "בינואר",
    "בפברואר",
    "במרץ",
    "באפריל",
    "במאי",
    "ביוני",
    "ביולי",
    "באוגוסט",
    "בספטמבר",
    "באוקטובר",
    "בנובמבר",
    "בדצמבר",
  ];

  const day = date.getDate();
  const month = hebrewMonths[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Check if a given month key is the current month
 */
export function isCurrentMonth(monthKey: string): boolean {
  return monthKey === getCurrentMonthKey();
}

/**
 * Parse a month key string and return a Date object for the first day of that month
 */
export function getMonthStart(monthKey: string): Date {
  const [year, month] = monthKey.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1);
}

/**
 * Get the next month key in YYYY-MM format
 */
export function getNextMonthKey(monthKey?: string): string {
  const date = monthKey ? getMonthStart(monthKey) : new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get the previous month key in YYYY-MM format
 */
export function getPreviousMonthKey(monthKey?: string): string {
  const date = monthKey ? getMonthStart(monthKey) : new Date();
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const year = prevMonth.getFullYear();
  const month = String(prevMonth.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
