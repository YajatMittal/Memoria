import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** The user's local calendar day as YYYY-MM-DD. */
export const localDay = (date: Date = new Date()) => format(date, 'yyyy-MM-dd');

/** "Monday, November 23" */
export const longDay = (day: string | Date) => format(typeof day === 'string' ? parseISO(day) : day, 'EEEE, MMMM d');

/** "3:45 PM" in the user's timezone. */
export const clockTime = (timestamp: string) => format(new Date(timestamp), 'h:mm a');

/** "5 minutes ago" */
export const timeAgo = (timestamp: string) => formatDistanceToNow(new Date(timestamp), { addSuffix: true });

export function greeting(date: Date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
