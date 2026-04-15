import { getMonthStart } from "./date.utils";

/**
 * Generate a unique month key in YYYY-MM format
 */
export function generateMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Check if a payment is due for a given month
 * A payment is due if we're past the 15th of the month
 */
export function isPaymentDue(monthKey: string): boolean {
  const now = new Date();

  // Check if monthKey is current or past
  const currentKey = generateMonthKey();
  if (monthKey < currentKey) {
    return true; // Past months are always due
  }

  if (monthKey === currentKey) {
    // Current month: due after 15th
    return now.getDate() >= 15;
  }

  return false; // Future months not due yet
}

/**
 * Check if a payment is overdue (more than 5 days past due date)
 */
export function isPaymentOverdue(monthKey: string, daysThreshold: number = 5): boolean {
  const monthStart = getMonthStart(monthKey);
  const dueDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 15);

  const now = new Date();
  const daysOverdue = Math.floor(
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysOverdue > daysThreshold;
}

/**
 * Get reminder count for a payment based on how overdue it is
 */
export function getReminderCount(monthKey: string): number {
  if (!isPaymentDue(monthKey)) {
    return 0;
  }

  const monthStart = getMonthStart(monthKey);
  const dueDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 15);
  const now = new Date();

  const daysOverdue = Math.floor(
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysOverdue < 0) {
    return 0; // Not due yet
  } else if (daysOverdue < 3) {
    return 1; // First reminder window
  } else if (daysOverdue < 7) {
    return 2; // Second reminder window
  } else {
    return 3; // Third+ reminder window
  }
}

/**
 * Calculate days until payment is due
 */
export function daysUntilDue(monthKey: string): number {
  const monthStart = getMonthStart(monthKey);
  const dueDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 15);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const daysUntil = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, daysUntil);
}

/**
 * Get all months that need payment reminders
 */
export function getMonthsNeedingReminders(
  paidMonths: string[],
  lookbackMonths: number = 3
): string[] {
  const months: string[] = [];
  const now = new Date();

  for (let i = lookbackMonths; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = generateMonthKey(date);

    if (!paidMonths.includes(monthKey) && isPaymentDue(monthKey)) {
      months.push(monthKey);
    }
  }

  return months;
}
