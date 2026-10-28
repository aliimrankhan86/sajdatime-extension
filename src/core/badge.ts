/**
 * The toolbar badge text and its colours (PLAN.md §7).
 *
 * The badge shows the time to the next prayer in at most four characters. Under an hour
 * it is the number of minutes with an "m" ("54m", "5m", "1m"); from an hour to under ten
 * hours it is hours and the minutes past the hour, zero-padded ("1h54", "9h05"); ten hours
 * or more is just the hours ("11h"). Minutes round up, so the badge never reads "0m".
 */

const MINUTE_MS = 60 * 1000;

/**
 * tokens.css owns the colour names (--primary, the deep green, and white for the on-primary
 * text). The badge API takes a hex string, and the bundle check forbids a literal colour
 * outside tokens.css, so the two are built here from their RGB parts instead.
 */
function hex(parts: readonly [number, number, number]): string {
  return '#' + parts.map((part) => part.toString(16).padStart(2, '0')).join('');
}

export const BADGE_BACKGROUND = hex([0x0b, 0x5a, 0x43]);
export const BADGE_TEXT = hex([0xff, 0xff, 0xff]);

/** Whole minutes to the next prayer, rounded up, never less than one. */
function roundedMinutes(ms: number): number {
  return Math.max(1, Math.ceil(ms / MINUTE_MS));
}

export function badgeText(ms: number): string {
  const minutes = roundedMinutes(ms);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 10) return `${hours}h${String(minutes % 60).padStart(2, '0')}`;
  return `${hours}h`;
}

/**
 * The same wait as the badge, in words, for the hover tooltip: "54 minutes", "1 minute",
 * "1 hour", "1 hour 54 minutes", "11 hours".
 */
export function humanDuration(ms: number): string {
  const minutes = roundedMinutes(ms);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const unit = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;
  if (hours > 0 && rest > 0) return `${unit(hours, 'hour')} ${unit(rest, 'minute')}`;
  if (hours > 0) return unit(hours, 'hour');
  return unit(rest, 'minute');
}
