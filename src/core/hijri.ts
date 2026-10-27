import { addDaysISO, parseISODate } from './engine';
import type { Eid, HijriDay, RamadanInfo } from './types';

const HIJRI_FORMAT = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const RAMADAN = 9;
const SHAWWAL = 10;
const DHUL_HIJJAH = 12;

const NOTICE_LEAD_DAYS = 3;
const NOTICE_LAST_DAY_NUMBER = 2;
const EXPORT_LEAD_DAYS = 30;

function dateAtNoon(value: string): Date {
  const { year, month, day } = parseISODate(value);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/**
 * The Umm al-Qura day for a Gregorian date, after the user's shift.
 *
 * `Intl` is the browser's own calendar table, so this needs no data file and no network.
 * The year 1300 to 1600 range is the same one the phone uses; outside it the browser may
 * still answer, so callers that need the phone's limit can check the year.
 */
export function hijriFor(date: string, offsetDays = 0): HijriDay | null {
  try {
    const shifted = addDaysISO(date, offsetDays);
    const parts = HIJRI_FORMAT.formatToParts(dateAtNoon(shifted));
    const get = (type: string) => parts.find((part) => part.type === type)?.value;
    const year = Number(get('year'));
    const month = Number(get('month'));
    const day = Number(get('day'));
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }
    return { year, month, day };
  } catch {
    return null;
  }
}

export function isRamadan(date: string, offsetDays = 0): boolean {
  return hijriFor(date, offsetDays)?.month === RAMADAN;
}

export function eidOn(date: string, offsetDays = 0): { eid: Eid; hijriYear: number } | null {
  const day = hijriFor(date, offsetDays);
  if (!day) return null;
  if (day.month === SHAWWAL && day.day === 1) return { eid: 'fitr', hijriYear: day.year };
  if (day.month === DHUL_HIJJAH && day.day === 10) return { eid: 'adha', hijriYear: day.year };
  return null;
}

/** Finds the Gregorian date on which this user's calendar reads a given Hijri day. */
function findHijriDay(
  today: string,
  hijriYear: number,
  month: number,
  day: number,
  offsetDays: number,
): string | null {
  for (let shift = -400; shift <= 400; shift++) {
    const candidate = addDaysISO(today, shift);
    const hijri = hijriFor(candidate, offsetDays);
    if (hijri?.year === hijriYear && hijri.month === month && hijri.day === day) {
      return candidate;
    }
  }
  return null;
}

/**
 * The current Ramadan, or the next one. Null only if the calendar cannot answer, which
 * is the same outside 1300 to 1600 AH.
 */
export function ramadanInfo(today: string, offsetDays = 0): RamadanInfo | null {
  const current = hijriFor(today, offsetDays);
  if (!current) return null;

  const hijriYear = current.month <= RAMADAN ? current.year : current.year + 1;
  const firstDay = findHijriDay(today, hijriYear, RAMADAN, 1, offsetDays);
  if (!firstDay) return null;

  let length = 0;
  for (let i = 0; i < 30; i++) {
    const day = hijriFor(addDaysISO(firstDay, i), offsetDays);
    if (day?.month !== RAMADAN) break;
    length = i + 1;
  }
  if (length !== 29 && length !== 30) return null;

  const lastDay = addDaysISO(firstDay, length - 1);
  const dayNumber = current.month === RAMADAN ? current.day : null;

  return { hijriYear, firstDay, lastDay, length, dayNumber };
}

export function daysUntilStart(info: RamadanInfo, today: string): number {
  let days = 0;
  let cursor = today;
  if (cursor === info.firstDay) return 0;
  const direction = cursor < info.firstDay ? 1 : -1;
  while (cursor !== info.firstDay) {
    cursor = addDaysISO(cursor, direction);
    days += direction;
    if (Math.abs(days) > 400) break;
  }
  return days;
}

export function isLastDay(info: RamadanInfo): boolean {
  return info.dayNumber !== null && info.dayNumber === info.length;
}

export function contains(info: RamadanInfo, date: string): boolean {
  return date >= info.firstDay && date <= info.lastDay;
}

/**
 * The quiet notice: three days before, then on the first and second day of Ramadan.
 * Matches the phone's window so both products say the same thing on the same day.
 */
export function showsNotice(info: RamadanInfo, today: string): boolean {
  const days = daysUntilStart(info, today);
  return days >= -(NOTICE_LAST_DAY_NUMBER - 1) && days <= NOTICE_LEAD_DAYS;
}

export function showsSettings(info: RamadanInfo, today: string): boolean {
  const days = daysUntilStart(info, today);
  return contains(info, today) || (days >= 1 && days <= NOTICE_LEAD_DAYS);
}

export function offersTimetable(info: RamadanInfo, today: string): boolean {
  const days = daysUntilStart(info, today);
  return contains(info, today) || (days >= 1 && days <= EXPORT_LEAD_DAYS);
}

export const RAMADAN_LEAD_DAYS = {
  notice: NOTICE_LEAD_DAYS,
  lastDayNumber: NOTICE_LAST_DAY_NUMBER,
  export: EXPORT_LEAD_DAYS,
} as const;
