import { addDaysISO, computeDay, parseISODate } from '../core/engine';
import { hijriFor } from '../core/hijri';
import { hijriMonthName } from '../core/labels';
import {
  type CalculationPrefs,
  type Coordinates,
  type HijriDay,
  type PrayerSlot,
  type RamadanInfo,
} from '../core/types';

/**
 * The printable timetable (PLAN.md section 6.5).
 *
 * Everything here is a pure function of a month, a place and the saved settings, so the
 * month table, the Hijri dates, the clock-change footnote and the Ramadan rows can be
 * unit-tested without a browser and without opening the page. The page itself only
 * formats and prints, which is also why its URL carries the month and nothing else
 * (docs/SECURITY.md R5): the place is read from storage by the page, never passed along.
 */

export interface DayRow {
  /** YYYY-MM-DD in the place's own zone. */
  date: string;
  day: number;
  /** "Thursday" in the page's language. */
  weekday: string;
  /** "Thu" in the page's language. */
  weekdayShort: string;
  /** "20 Rabi' al-Thani", or null when the browser's Hijri table is missing. */
  hijri: string | null;
  /** 1 to 30 on a Ramadan day, otherwise null. */
  ramadanDay: number | null;
  times: Record<PrayerSlot, Date>;
  isToday: boolean;
  /** True when this day's six times came from a reference latitude. */
  isPolar: boolean;
}

export interface MonthTable {
  /** YYYY-MM. */
  month: string;
  /** "October 2026". */
  title: string;
  /** "Rabi' al-Thani to Jumada al-Awwal 1448", or empty when there is no Hijri table. */
  hijriLine: string;
  days: DayRow[];
  /** The days of this Gregorian month that fall in Ramadan. Empty outside Ramadan. */
  ramadanDays: DayRow[];
  /** One sentence per clock change in the month. */
  clockNotes: string[];
  /** True when any day in the table was estimated from a reference latitude. */
  isPolar: boolean;
}

export interface BuildInput {
  /** YYYY-MM. */
  month: string;
  coordinates: Coordinates;
  /** Method, school, zone, Hijri shift and the user's minutes. */
  prefs: CalculationPrefs;
  /** The place's civil date, YYYY-MM-DD. */
  today: string;
  /** The page's language, for weekday and month names. */
  locale: string;
}

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseMonth(month: string): { year: number; month: number } {
  const match = MONTH_PATTERN.exec(month);
  if (!match) throw new Error(`Not a month: ${month}`);
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (!Number.isInteger(year) || monthNumber < 1 || monthNumber > 12) {
    throw new Error(`Not a month: ${month}`);
  }
  return { year, month: monthNumber };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function monthOfDate(date: string): string {
  return date.slice(0, 7);
}

/** Every civil date in the month, in order. */
export function daysInMonth(month: string): string[] {
  const { year, month: monthNumber } = parseMonth(month);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const days: string[] = [];
  for (let day = 1; day <= count; day += 1) {
    days.push(`${year}-${pad(monthNumber)}-${pad(day)}`);
  }
  return days;
}

/** Moves a month by whole months, so December to January crosses the year. */
export function stepMonth(month: string, delta: number): string {
  const { year, month: monthNumber } = parseMonth(month);
  const moved = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}`;
}

function noonUTC(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

/** "October 2026" in the page's language. */
export function monthTitle(month: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(noonUTC(`${month}-01`));
}

// Intl formatters are not cheap and a table asks for three per day, so one of each.
function formatters(locale: string) {
  return {
    weekday: new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'long' }),
    weekdayShort: new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'short' }),
  };
}

/** The name of a zone's offset, as Intl writes it. */
function offsetLabel(timeZone: string, date: string, locale: string): string {
  const format = (style: 'short' | 'long') =>
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: style })
      .formatToParts(noonUTC(date))
      .find((part) => part.type === 'timeZoneName')?.value ?? '';

  // "GMT+5" is a signed number, not a name. There the long form ("Eastern Standard
  // Time") reads better in a sentence. Where the short form is a real abbreviation, as
  // in GMT and BST, it is the one people say.
  const short = format('short');
  return /^(GMT|UTC)[+-]/.test(short) ? format('long') : short;
}

/** The zone's offset from UTC in minutes, at noon UTC on that date. */
function offsetMinutes(timeZone: string, date: string): number {
  const value =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(noonUTC(date))
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  const match = /^(?:GMT|UTC)(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(value);
  if (!match) return 0;
  const minutes = Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  return match[1] === '-' ? -minutes : minutes;
}

/**
 * The clock-change footnote for a run of days, in the brief's own words:
 * "Clocks go back on Sunday 25 October. Times from that day are in GMT."
 *
 * Each date is compared with the day before it at noon UTC, which is past every
 * spring-forward and fall-back hour in the world's inhabited zones. A month with no
 * change gets no note, and the rare month with two changes gets two notes.
 */
export function clockNotes(days: string[], timeZone: string, locale: string): string[] {
  const first = days[0];
  if (!first) return [];
  const notes: string[] = [];
  let previous = offsetMinutes(timeZone, addDaysISO(first, -1));

  for (const date of days) {
    const current = offsetMinutes(timeZone, date);
    if (current !== previous) {
      const forward = current > previous;
      const weekday = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'long' }).format(
        noonUTC(date),
      );
      const monthName = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', month: 'long' }).format(
        noonUTC(date),
      );
      const { day } = parseISODate(date);
      notes.push(
        `${forward ? 'Clocks go forward' : 'Clocks go back'} on ${weekday} ${day} ${monthName}. Times from that day are in ${offsetLabel(timeZone, date, locale)}.`,
      );
    }
    previous = current;
  }
  return notes;
}

/**
 * The Hijri months a run of days falls in, as one line for the table header. A Gregorian
 * month that spans two Hijri months names both, and a year change names both years.
 */
function hijriSpan(days: DayRow[], offsetDays: number): string {
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return '';
  const start = hijriFor(first.date, offsetDays);
  const end = hijriFor(last.date, offsetDays);
  if (!start || !end) return '';
  const startName = hijriMonthName(start.month);
  const endName = hijriMonthName(end.month);
  if (!startName || !endName) return '';
  if (start.month === end.month && start.year === end.year) {
    return `${startName} ${start.year}`;
  }
  if (start.year === end.year) {
    return `${startName} to ${endName} ${start.year}`;
  }
  return `${startName} ${start.year} to ${endName} ${end.year}`;
}

function hijriLabel(day: HijriDay): string | null {
  const month = hijriMonthName(day.month);
  return month ? `${day.day} ${month}` : null;
}

/** The Ramadan day number for a date, given where Ramadan starts, or null. */
function ramadanNumber(info: RamadanInfo | null, date: string): number | null {
  if (!info || date < info.firstDay || date > info.lastDay) return null;
  const start = parseISODate(info.firstDay);
  const current = parseISODate(date);
  const startUTC = Date.UTC(start.year, start.month - 1, start.day);
  const currentUTC = Date.UTC(current.year, current.month - 1, current.day);
  return Math.round((currentUTC - startUTC) / DAY_MS) + 1;
}

/**
 * One day's row. The Ramadan day number is passed in, so the same builder serves the
 * Gregorian month and the Ramadan table.
 */
function buildRow(
  date: string,
  input: BuildInput,
  formats: ReturnType<typeof formatters>,
  ramadanDay: number | null,
): DayRow {
  const times = computeDay(input.coordinates, date, input.prefs);
  const hijri = hijriFor(date, input.prefs.hijriOffsetDays ?? 0);
  return {
    date,
    day: parseISODate(date).day,
    weekday: formats.weekday.format(noonUTC(date)),
    weekdayShort: formats.weekdayShort.format(noonUTC(date)),
    hijri: hijri ? hijriLabel(hijri) : null,
    ramadanDay,
    times: times.times,
    isToday: date === input.today,
    isPolar: times.isPolar,
  };
}

/**
 * The whole table for one Gregorian month, with the Ramadan day numbers filled in when
 * the month overlaps Ramadan. The Ramadan dates are passed in so the page works them out
 * once instead of once per row.
 */
export function buildMonth(input: BuildInput, ramadan: RamadanInfo | null): MonthTable {
  const dates = daysInMonth(input.month);
  const formats = formatters(input.locale);
  const days = dates.map((date) => buildRow(date, input, formats, ramadanNumber(ramadan, date)));
  return {
    month: input.month,
    title: monthTitle(input.month, input.locale),
    hijriLine: hijriSpan(days, input.prefs.hijriOffsetDays ?? 0),
    days,
    ramadanDays: days.filter((row) => row.ramadanDay !== null),
    clockNotes: clockNotes(dates, input.prefs.timeZone, input.locale),
    isPolar: days.some((row) => row.isPolar),
  };
}

/**
 * The rows of the Ramadan timetable: every day from 1 Ramadan to the last, which can
 * cross a Gregorian month boundary.
 */
export function buildRamadan(input: BuildInput, info: RamadanInfo): DayRow[] {
  const formats = formatters(input.locale);
  const rows: DayRow[] = [];
  for (let date = info.firstDay; date <= info.lastDay; date = addDaysISO(date, 1)) {
    rows.push(buildRow(date, input, formats, ramadanNumber(info, date)));
  }
  return rows;
}

/**
 * "8 Feb" for the Ramadan table, whose rows cross a month boundary, so the date column
 * never leaves the reader guessing which month a row belongs to.
 */
export function shortDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  }).format(noonUTC(date));
}

/**
 * "8 February to 9 March 2027" for the Ramadan header. The year is written once at the
 * end when the span stays in one year, and on both sides when it does not.
 */
export function dateSpanLabel(first: string, last: string, locale: string): string {
  const dayMonth = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
  });
  const year = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', year: 'numeric' });
  const firstYear = year.format(noonUTC(first));
  const lastYear = year.format(noonUTC(last));
  if (firstYear === lastYear) {
    return `${dayMonth.format(noonUTC(first))} to ${dayMonth.format(noonUTC(last))} ${lastYear}`;
  }
  return `${dayMonth.format(noonUTC(first))} ${firstYear} to ${dayMonth.format(noonUTC(last))} ${lastYear}`;
}
