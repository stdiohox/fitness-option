const DAY_MS = 86_400_000;

/** Days are integers (days since the Unix epoch) so the simulated clock is plain arithmetic. */
export type Day = number;

export function dayFromDate(date: Date): Day {
  return Math.floor(date.getTime() / DAY_MS);
}

export function dateFromDay(day: Day): Date {
  return new Date(day * DAY_MS);
}

export function weekdayOf(day: Day): number {
  return dateFromDay(day).getUTCDay();
}

export function monthKeyOf(day: Day): string {
  return dateFromDay(day).toISOString().slice(0, 7);
}

export function formatDay(day: Day, options: Intl.DateTimeFormatOptions = {}): string {
  return dateFromDay(day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    ...options,
  });
}

export function formatMonth(monthKey: string): string {
  return new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "short",
    timeZone: "UTC",
  });
}

export function daysAgoLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
