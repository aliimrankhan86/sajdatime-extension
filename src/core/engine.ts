import {
  CalculationParameters,
  Coordinates as AdhanCoordinates,
  HighLatitudeRule,
  Madhab as AdhanMadhab,
  PrayerTimes,
  PolarCircleResolution,
} from 'adhan';
import { isShiaMethod, parametersFor } from './methods';
import { isRamadan } from './hijri';
import {
  PRAYERS,
  SLOTS,
  type CalculationPrefs,
  type Coordinates,
  type DayTimes,
  type MethodId,
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

const DAY_MS = 24 * 60 * 60 * 1000;
const DHUHR_MIDPOINT_TOLERANCE_MS = 30 * 60 * 1000;

/**
 * A day is usable only when its six instants run forwards and the solar noon is near the
 * midpoint of sunrise and sunset. adhan-js can return finite but impossible values above
 * the polar circle: at Tromso on 21 December 2026 it puts Asr before Dhuhr, and at
 * Longyearbyen it puts Asr after Maghrib. The phone rejects such a day and projects it
 * from a latitude where the sun still rises and sets, so this extension does the same.
 */
function isUsable(times: PrayerTimes): boolean {
  const values = SLOTS.map((slot) => times[slot]);
  if (values.some((value) => !valid(value))) return false;

  const milliseconds = values.map((value) => value.getTime());
  for (let index = 1; index < milliseconds.length; index += 1) {
    const previous = milliseconds[index - 1];
    const current = milliseconds[index];
    if (previous === undefined || current === undefined || current <= previous) return false;
  }

  const dhuhr = times.dhuhr.getTime();
  if (milliseconds.some((value) => Math.abs(value - dhuhr) > DAY_MS)) return false;

  const midpoint = (times.sunrise.getTime() + times.maghrib.getTime()) / 2;
  return Math.abs(dhuhr - midpoint) <= DHUHR_MIDPOINT_TOLERANCE_MS;
}

/**
 * The Shia Maghrib is the evening twilight at 4 degrees (Jafari) or 4.5 degrees
 * (Tehran). adhan's own `maghribAngle` would also change what `isUsable` sees, so the
 * main calculation stays at sunset and this angle is read from a separate run. The
 * result must be computed at the same latitude as the day, including the borrowed polar
 * latitude, or the two halves would describe different places.
 *
 * The true angle wins whenever the sun reaches it before Isha. When it never does, or
 * it would land on or after Isha, fall back to the Twilight Angle cap at sunset plus a
 * portion of the night. The phone still caps in both cases; this is a deliberate
 * difference recorded in D-002 until the phone follows.
 */
function shiaMaghrib(
  coordinates: AdhanCoordinates,
  date: Date,
  method: MethodId,
  sunset: Date,
  isha: Date,
): Date | null {
  const angle = method === 'jafari' ? 4 : method === 'tehran' ? 4.5 : null;
  if (angle === null) return null;

  const minute = (value: Date) => Math.floor(value.getTime() / 60000);

  try {
    // A long Isha interval keeps adhan's own maghrib guard out of the way, so this
    // probe returns the true angle even when the Twilight Angle cap would be earlier.
    const trueParams = new CalculationParameters('Other', 0, 0, 24 * 60);
    trueParams.maghribAngle = angle;
    const trueProbe = new PrayerTimes(coordinates, date, trueParams);
    // The true angle is only usable while it sits in a strictly earlier minute than
    // Isha. Near solar midnight in summer it can reach or pass the method's Isha, and
    // the order clamp would then pull Isha onto Maghrib and show the same minute twice.
    if (
      valid(trueProbe.maghrib) &&
      trueProbe.maghrib.getTime() > sunset.getTime() &&
      minute(trueProbe.maghrib) < minute(isha)
    ) {
      return trueProbe.maghrib;
    }

    const capParams = new CalculationParameters('Other', 0, angle);
    capParams.madhab = AdhanMadhab.Shafi;
    capParams.highLatitudeRule = HighLatitudeRule.TwilightAngle;
    const capProbe = new PrayerTimes(coordinates, date, capParams);
    return valid(capProbe.isha) ? capProbe.isha : null;
  } catch {
    return null;
  }
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

  const params = parametersFor(prefs.method, prefs.madhab);
  const adhanCoordinates = new AdhanCoordinates(coordinates.latitude, coordinates.longitude);
  const dateAtLocalNoon = adhanDate(parsed);

  // A resolve that may invent times where the sun never rises. A second, unresolved run
  // below tells us whether the sun actually rose and set, and whether all six times are
  // real rather than a nearest-day approximation.
  let local: PrayerTimes | null = null;
  try {
    local = new PrayerTimes(adhanCoordinates, dateAtLocalNoon, params);
  } catch {
    local = null;
  }

  const probeParams = parametersFor(prefs.method, prefs.madhab);
  probeParams.polarCircleResolution = PolarCircleResolution.Unresolved;
  let hasRealDay = true;
  try {
    const probe = new PrayerTimes(adhanCoordinates, dateAtLocalNoon, probeParams);
    hasRealDay = SLOTS.every((slot) => valid(probe[slot]));
  } catch {
    hasRealDay = false;
  }

  // The phone uses the Islamic Fiqh Council's 45 degrees for every method except
  // Moonsighting Committee, which publishes 60. The hemisphere and longitude are kept so
  // solar noon stays where the user is; only the latitude is borrowed.
  const referenceLatitude = prefs.method === 'moonsighting' ? 60 : 45;
  const projectedLatitude = coordinates.latitude < 0 ? -referenceLatitude : referenceLatitude;

  const mustProject = local === null || !hasRealDay || !isUsable(local);
  const baseCoordinates =
    local !== null && !mustProject
      ? adhanCoordinates
      : new AdhanCoordinates(projectedLatitude, coordinates.longitude);
  const base =
    local !== null && !mustProject
      ? local
      : new PrayerTimes(baseCoordinates, dateAtLocalNoon, params);

  const baseTimes = {} as Record<PrayerSlot, Date>;
  for (const slot of SLOTS) {
    const value = base[slot];
    if (!valid(value)) {
      throw new EngineError(`No ${slot} time for ${date} at this place`);
    }
    baseTimes[slot] = value;
  }

  if (isShiaMethod(prefs.method)) {
    const maghrib = shiaMaghrib(
      baseCoordinates,
      dateAtLocalNoon,
      prefs.method,
      baseTimes.maghrib,
      baseTimes.isha,
    );
    if (maghrib) baseTimes.maghrib = maghrib;
  }

  const offset = prefs.hijriOffsetDays ?? 0;
  if (prefs.method === 'umm-al-qura' && isRamadan(date, offset)) {
    // The phone adds half an hour to Isha for the whole of Ramadan. It is a method
    // adjustment, applied before any manual minutes, and after the day is otherwise fixed.
    baseTimes.isha = new Date(baseTimes.isha.getTime() + 30 * 60 * 1000);
  }

  // Manual corrections run last, then the six are held in order. The bound alone does not
  // make that safe: at 59.9 degrees Dhuhr and Asr can be twenty-six minutes apart, so
  // Dhuhr +30 and Asr -30 would cross them. The phone clamps each slot to its neighbour;
  // that costs nothing where the correction is legal and keeps a backwards day impossible.
  const times = {} as Record<PrayerSlot, Date>;
  let floor = Number.NEGATIVE_INFINITY;
  for (const slot of SLOTS) {
    const minutes = prefs.adjustments?.[slot] ?? 0;
    if (minutes !== 0 && (!Number.isInteger(minutes) || minutes < -30 || minutes > 30)) {
      throw new EngineError(`Adjustment for ${slot} is outside -30 to +30`);
    }
    const moved = baseTimes[slot].getTime() + minutes * 60 * 1000;
    // adhan rounds to the nearest minute but leaves the milliseconds of the call in the
    // Date. The phone truncates, which keeps alarms on the minute and the countdown steady.
    const at = new Date(Math.floor(Math.max(moved, floor) / 60000) * 60000);
    times[slot] = at;
    floor = at.getTime();
  }

  return { date, times, isPolar: mustProject };
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
