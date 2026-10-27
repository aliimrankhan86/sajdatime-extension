export interface ClockFormat {
  hour12: boolean;
  format(date: Date): string;
}

/**
 * The browser's own 12 or 24 hour style for its language. A stored language will take
 * over when the language screen lands. In 24 hour style the hour keeps its leading zero,
 * so the column of times lines up. Shared by the Times screen and the prayer alert title.
 */
export function clockFormatter(timeZone: string, locale: string): ClockFormat {
  const hourCycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  const hour12 = hourCycle === 'h11' || hourCycle === 'h12';
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12,
  });
  return { hour12, format: (date) => formatter.format(date) };
}

export function formatClockTime(date: Date, timeZone: string, locale: string): string {
  return clockFormatter(timeZone, locale).format(date);
}
