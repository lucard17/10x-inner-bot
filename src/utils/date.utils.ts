import { format, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Gets the date for yesterday in 'yyyy-MM-dd' format, adjusted for Moscow time.
 * @returns {string} Formatted yesterday's date.
 */
export function getYesterdayDate(): string {
  const timeZone = 'Europe/Moscow';
  const now = new Date();
  const moscowTime = toZonedTime(now, timeZone);
  const yesterday = subDays(moscowTime, 1);
  return format(yesterday, 'yyyy-MM-dd');
}

/**
 * Creates an object with the last 30 days as keys, initialized to 0.
 * @returns {Record<string, number>} Object with date strings as keys.
 */
export function create30DaysObject(): Record<string, number> {
  const daysObj: Record<string, number> = {};
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    daysObj[dateString] = 0;
  }
  
  return daysObj;
}

/**
 * Returns an array of dates for the last X days.
 * @param {number} days - Number of days to include.
 * @returns {string[]} Array of date strings in 'yyyy-MM-dd' format.
 */
export function getXDaysAgoArray(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const formattedDate = date.toISOString().split('T')[0];
    dates.push(formattedDate);
  }

  return dates;
}

/**
 * Sorts object keys (dates) in descending order.
 * @param {Record<string, any>} obj - Object with date strings as keys.
 * @returns {string[]} Sorted array of date keys.
 */
export function sortObjectDateKeys(obj: Record<string, any>): string[] {
  return Object.keys(obj).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
}

/**
 * Sorts object entries by date keys in descending order.
 * @param {Record<string, any>} obj - Object with date strings as keys.
 * @returns {Record<string, any>} Sorted object.
 */
export function sortObjectDateEntries(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
  );
}