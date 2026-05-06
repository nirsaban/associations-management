/**
 * Parses an ISO week key (e.g. "2026-W19") and returns the Monday of that week.
 * Uses ISO 8601: week starts on Monday, week 1 contains the first Thursday.
 */
function mondayOfISOWeek(year: number, week: number): Date {
  // Jan 4 is always in week 1 of its year (ISO 8601)
  const jan4 = new Date(year, 0, 4);
  // Day of week: 0=Sun..6=Sat → shift so Mon=0..Sun=6
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  // Monday of week 1
  const monday1 = new Date(jan4);
  monday1.setDate(jan4.getDate() - dayOfWeek);
  // Monday of the requested week
  const monday = new Date(monday1);
  monday.setDate(monday1.getDate() + (week - 1) * 7);
  return monday;
}

/**
 * Formats an ISO week key (e.g. "2026-W19") as a Hebrew-locale date range string.
 * Example output: "4-10/5/2026"
 */
export function formatWeekRange(weekKey: string): string {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekKey;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  const monday = mondayOfISOWeek(year, week);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const endMonth = sunday.getMonth() + 1;
  const endYear = sunday.getFullYear();

  // If the week spans two months, show both: "30/4-6/5/2026"
  if (monday.getMonth() !== sunday.getMonth()) {
    const startMonth = monday.getMonth() + 1;
    return `${startDay}/${startMonth}-${endDay}/${endMonth}/${endYear}`;
  }

  // Same month: "4-10/5/2026"
  return `${startDay}-${endDay}/${endMonth}/${endYear}`;
}
