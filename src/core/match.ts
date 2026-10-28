import { computeDay, dateInZone } from './engine';
import { methodsOfferedTo } from './methods';
import type { Coordinates, Madhab, MethodId, Sect } from './types';
import { t } from '../i18n';

/**
 * PLAN 5.4 Match my mosque: work out today's Fajr for every method offered to the
 * user's tradition, then sort them by how far each is from the time the user read on
 * their mosque's board. The difference is compared in wall-clock minutes in the place's
 * own zone, not as absolute instants, so a daylight-saving change on the same day cannot
 * skew the answer.
 */

export interface MethodMatch {
  method: MethodId;
  fajr: Date;
  /** This method's Fajr minus the mosque's time, in minutes. Negative means earlier. */
  diffMinutes: number;
}

function minutesInZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  let hour = 0;
  let minute = 0;
  for (const part of parts) {
    if (part.type === 'hour') hour = Number(part.value);
    if (part.type === 'minute') minute = Number(part.value);
  }
  return hour * 60 + minute;
}

/**
 * Return every offered method with its Fajr and its minute difference from `targetMinutes`
 * (the mosque's Fajr start, as minutes since midnight in the place's zone), closest first.
 */
export function matchMethods(
  coordinates: Coordinates,
  timeZone: string,
  sect: Sect,
  madhab: Madhab,
  hijriOffsetDays: number,
  targetMinutes: number,
  now: Date,
): MethodMatch[] {
  const today = dateInZone(now, timeZone);
  const matches: MethodMatch[] = [];
  for (const method of methodsOfferedTo(sect)) {
    try {
      const day = computeDay(coordinates, today, {
        method,
        madhab,
        timeZone,
        hijriOffsetDays,
      });
      const fajr = day.times.fajr;
      matches.push({ method, fajr, diffMinutes: minutesInZone(fajr, timeZone) - targetMinutes });
    } catch {
      // A method that cannot produce a time here is skipped rather than shown wrong.
    }
  }
  matches.sort((a, b) => Math.abs(a.diffMinutes) - Math.abs(b.diffMinutes));
  return matches;
}

/** "2 minutes after your mosque", "6 minutes before your mosque", t('match.atMosque'). */
export function matchLabel(diffMinutes: number): string {
  const amount = Math.abs(diffMinutes);
  if (amount === 0) return t('match.atMosque');
  if (amount === 1) return t(diffMinutes > 0 ? 'match.afterOne' : 'match.beforeOne');
  return t(diffMinutes > 0 ? 'match.after' : 'match.before', { count: amount });
}
