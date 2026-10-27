import { Coordinates as AdhanCoordinates, PrayerTimes, PolarCircleResolution } from 'adhan';
import { parametersFor } from './methods';
import { isRamadan } from './hijri';
import {
  PRAYERS,
  SLOTS,
  type CalculationPrefs,
  type Coordinates,
  type DayTimes,
  type NextPrayer,
  type Prayer,
  type PrayerSlot,
} from './types';

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

/** YYYY-MM-DD, with a real calendar check rather than a regex that accepts 31 February. */
export function parseISODate(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new EngineError(`Not a date: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new EngineError(`Not a real date: ${value}`);
  }
  return { year, month, day };
}

export function addDaysISO(value: string, days: number): string {
  const { year, month, day } = parseISODate(value);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

/**
 * The civil date in a time zone. `en-CA` is not guaranteed to be ISO in every ICU build,
 * so the parts are joined by hand.
 */
export function dateInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = get('year');
  const month = get('month');
  const day = get('day');
  if (!year || !month || !day) throw new EngineError(`Could not read the date in ${timeZone}`);
  return `${year}-${month}-${day}`;
}

function adhanDate(date: { year: number; month: number; day: number }): Date {
  // The library reads the local year, month and day; any Date with those components
  // works. Noon avoids a daylight-saving edge at midnight.
  return new Date(date.year, date.month - 1, date.day, 12, 0, 0, 0);
}

function valid(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * The six times for one civil date at one place.
 *
 * The date is the place's date, not the computer's. adhan-js only reads the year, month
 * and day from the Date it is given, so a local noon on that date is enough even when the
 * computer and the place are in different time zones.
 */
export function computeDay(
  coordinates: Coordinates,
  date: string,
  prefs: CalculationPrefs,
): DayTimes {
  const parsed = parseISODate(date);
  if (
    !Number.isFinite(coordinates.latitude) ||
    coordinates.latitude < -90 ||
    coordinates.latitude > 90 ||
    !Number.isFinite(coordinates.longitude) ||
    coordinates.longitude < -180 ||
    coordinates.longitude > 180
  ) {
    throw new EngineError('Coordinates are outside the world');
  }

  const params = parametersFor(prefs.method, prefs.madhab, coordinates);

  const offset = prefs.hijriOffsetDays ?? 0;
  if (prefs.method === 'umm-al-qura' && isRamadan(date, offset)) {
    // The phone adds half an hour to Isha for the whole of Ramadan. It is a method
    // adjustment, not a user adjustment, so it is applied before any manual minutes.
    params.adjustments.isha += 30;
  }

  for (const slot of SLOTS) {
    const minutes = prefs.adjustments?.[slot] ?? 0;
    if (minutes !== 0) {
      if (!Number.isInteger(minutes) || minutes < -30 || minutes > 30) {
        throw new EngineError(`Adjustment for ${slot} is outside -30 to +30`);
      }
      params.adjustments[slot] += minutes;
    }
  }

  const adhanCoordinates = new AdhanCoordinates(coordinates.latitude, coordinates.longitude);
  const prayerTimes = new PrayerTimes(adhanCoordinates, adhanDate(parsed), params);

  const times = {} as Record<PrayerSlot, Date>;
  for (const slot of SLOTS) {
    const value = prayerTimes[slot];
    if (!valid(value)) {
      throw new EngineError(`No ${slot} time for ${date} at this place`);
    }
    times[slot] = value;
  }

  // The resolved day hides whether the sun rose or set. A second, deliberately
  // unresolved run answers that without changing the times above.
  const probeParams = parametersFor(prefs.method, prefs.madhab, coordinates);
  probeParams.polarCircleResolution = PolarCircleResolution.Unresolved;
  let isPolar = false;
  try {
    const probe = new PrayerTimes(adhanCoordinates, adhanDate(parsed), probeParams);
    isPolar = !valid(probe.sunrise) || !valid(probe.sunset);
  } catch {
    isPolar = true;
  }

  return { date, times, isPolar };
}

/**
 * The next prayer after `now`, looking one day either side so a prayer that spilled past
 * midnight is never skipped. Sunrise is a marker, never an answer.
 */
export function nextPrayer(
  coordinates: Coordinates,
  prefs: CalculationPrefs,
  now: Date = new Date(),
): NextPrayer {
  const today = dateInZone(now, prefs.timeZone);
  const candidates: { slot: Prayer; at: Date }[] = [];

  for (const shift of [-1, 0, 1]) {
    const day = computeDay(coordinates, addDaysISO(today, shift), prefs);
    for (const slot of PRAYERS) {
      const at = day.times[slot];
      if (at.getTime() > now.getTime()) candidates.push({ slot, at });
    }
  }

  candidates.sort((a, b) => a.at.getTime() - b.at.getTime());
  const first = candidates[0];
  if (!first) throw new EngineError('No next prayer found');
  return {
    slot: first.slot,
    at: first.at,
    isTomorrow: dateInZone(first.at, prefs.timeZone) !== today,
  };
}

/**
 * The prayer whose window `now` is inside, or null between sunrise and Dhuhr. Isha runs
 * until the next Fajr, so yesterday is included and the marker survives midnight.
 */
export function currentPrayer(
  coordinates: Coordinates,
  prefs: CalculationPrefs,
  now: Date = new Date(),
): Prayer | null {
  const today = dateInZone(now, prefs.timeZone);
  const yesterday = addDaysISO(today, -1);
  const ordered = [yesterday, today].flatMap((date) => {
    const day = computeDay(coordinates, date, prefs);
    return SLOTS.map((slot) => ({ slot, at: day.times[slot] }));
  });

  const passed = ordered.filter((entry) => entry.at.getTime() <= now.getTime());
  const last = passed[passed.length - 1];
  if (!last || last.slot === 'sunrise') return null;
  return last.slot;
}

export { PRAYERS, SLOTS };
export type { CalculationPrefs, Coordinates, DayTimes, NextPrayer, Prayer, PrayerSlot };
