import { describe, expect, it } from 'vitest';
import { computeDay } from '../../src/core/engine';
import { ramadanInfo } from '../../src/core/hijri';
import { hijriMonthName, slotLabel } from '../../src/core/labels';
import { SLOTS, type CalculationPrefs } from '../../src/core/types';
import {
  buildMonth,
  buildRamadan,
  clockNotes,
  dateSpanLabel,
  daysInMonth,
  monthOfDate,
  monthTitle,
  stepMonth,
  type BuildInput,
} from '../../src/print/timetable';

const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const TROMSO = { latitude: 69.6492, longitude: 18.9553 };

function prefs(overrides: Partial<CalculationPrefs> = {}): CalculationPrefs {
  return { method: 'mwl', madhab: 'shafii', timeZone: 'Europe/London', ...overrides };
}

function input(overrides: Partial<BuildInput> = {}): BuildInput {
  return {
    month: '2026-10',
    coordinates: LONDON,
    prefs: prefs(),
    today: '2026-10-27',
    locale: 'en-GB',
    ...overrides,
  };
}

describe('the month in the URL', () => {
  it('lists every day of the month, in order', () => {
    expect(daysInMonth('2026-10')).toHaveLength(31);
    expect(daysInMonth('2026-11')).toHaveLength(30);
    expect(daysInMonth('2027-02')).toHaveLength(28);
    expect(daysInMonth('2028-02')).toHaveLength(29);
    const october = daysInMonth('2026-10');
    expect(october[0]).toBe('2026-10-01');
    expect(october[30]).toBe('2026-10-31');
  });

  it('refuses anything that is not a month', () => {
    for (const bad of ['2026-13', '2026-00', '2026-1', '26-10', 'nope', '']) {
      expect(() => daysInMonth(bad)).toThrow();
    }
  });

  it('steps to the next and previous month across a year', () => {
    expect(stepMonth('2026-10', 1)).toBe('2026-11');
    expect(stepMonth('2026-12', 1)).toBe('2027-01');
    expect(stepMonth('2027-01', -1)).toBe('2026-12');
    expect(stepMonth('2026-10', -1)).toBe('2026-09');
  });

  it('writes the month out in the page language', () => {
    expect(monthTitle('2026-10', 'en-GB')).toBe('October 2026');
    expect(monthOfDate('2026-10-27')).toBe('2026-10');
  });
});

describe('the Hijri names', () => {
  it('holds the twelve months of the phone, in order', () => {
    const months = Array.from({ length: 12 }, (_, index) => hijriMonthName(index + 1));
    expect(months.filter((name) => name !== null)).toHaveLength(12);
    expect(hijriMonthName(9)).toBe('Ramadan');
    expect(hijriMonthName(1)).toBe('Muharram');
    expect(hijriMonthName(13)).toBeNull();
    expect(hijriMonthName(0)).toBeNull();
  });

  it('names the six lines of the table', () => {
    expect(SLOTS.map((slot) => slotLabel(slot))).toEqual([
      'Fajr',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Maghrib',
      'Isha',
    ]);
  });
});

describe('the month table', () => {
  it('has one row per day, with the weekday and Hijri date', () => {
    const table = buildMonth(input(), null);
    expect(table.days).toHaveLength(31);
    const first = table.days[0];
    const last = table.days[30];
    if (!first || !last) throw new Error('missing rows');
    expect(first.date).toBe('2026-10-01');
    expect(first.day).toBe(1);
    expect(first.weekday).toBe('Thursday');
    expect(first.weekdayShort).toBe('Thu');
    expect(first.hijri).toBe("20 Rabi' al-Thani");
    expect(last.date).toBe('2026-10-31');
    expect(last.weekday).toBe('Saturday');
    expect(last.hijri).toBe('20 Jumada al-Awwal');
  });

  it('names both Hijri months when the Gregorian month spans two', () => {
    const table = buildMonth(input(), null);
    expect(table.hijriLine).toBe("Rabi' al-Thani to Jumada al-Awwal 1448");
  });

  it('uses the same engine as the Times screen', () => {
    const table = buildMonth(input(), null);
    const day = table.days[9];
    if (!day) throw new Error('missing row');
    const expected = computeDay(LONDON, day.date, prefs());
    for (const slot of SLOTS) {
      expect(day.times[slot].toISOString()).toBe(expected.times[slot].toISOString());
    }
    expect(day.isPolar).toBe(expected.isPolar);
  });

  it('honours the saved minutes and the Hijri shift', () => {
    const withMinutes = buildMonth(
      input({ prefs: prefs({ adjustments: { fajr: 3 }, hijriOffsetDays: 1 }) }),
      null,
    );
    const day = withMinutes.days[0];
    const plain = buildMonth(input(), null).days[0];
    if (!day || !plain) throw new Error('missing rows');
    const shiftMinutes = (day.times.fajr.getTime() - plain.times.fajr.getTime()) / 60_000;
    expect(shiftMinutes).toBe(3);
    // One day later in the Hijri calendar, so 21 rather than 20.
    expect(day.hijri).toBe("21 Rabi' al-Thani");
  });

  it('marks today, and only today', () => {
    const table = buildMonth(input({ today: '2026-10-27' }), null);
    const marked = table.days.filter((row) => row.isToday);
    expect(marked).toHaveLength(1);
    expect(marked[0]?.date).toBe('2026-10-27');
  });

  it('marks nothing when today is in another month', () => {
    const table = buildMonth(input({ today: '2026-11-03' }), null);
    expect(table.days.some((row) => row.isToday)).toBe(false);
  });

  it('says nothing about clocks in a month that does not change', () => {
    const june = buildMonth(input({ month: '2026-06', today: '2026-06-01' }), null);
    expect(june.clockNotes).toEqual([]);
  });

  it('estimates the times where the sun does not set', () => {
    const june = buildMonth(
      input({
        month: '2026-06',
        coordinates: TROMSO,
        prefs: prefs({ timeZone: 'Europe/Oslo' }),
        today: '2026-06-21',
      }),
      null,
    );
    expect(june.isPolar).toBe(true);
  });
});

describe('the clock change footnote', () => {
  it('gives the brief’s own sentence for the day the clocks go back', () => {
    const notes = clockNotes(daysInMonth('2026-10'), 'Europe/London', 'en-GB');
    expect(notes).toEqual([
      'Clocks go back on Sunday 25 October. Times from that day are in GMT.',
    ]);
  });

  it('names the gain when the clocks go forward', () => {
    const notes = clockNotes(daysInMonth('2027-03'), 'Europe/London', 'en-GB');
    expect(notes).toEqual([
      'Clocks go forward on Sunday 28 March. Times from that day are in BST.',
    ]);
  });

  it('uses the zone’s own abbreviation when Intl has one', () => {
    const notes = clockNotes(daysInMonth('2026-11'), 'America/New_York', 'en-US');
    expect(notes).toEqual([
      'Clocks go back on Sunday 1 November. Times from that day are in EST.',
    ]);
  });

  it('spells the zone out where Intl can only give a signed offset', () => {
    // In en-GB the short name for New York is "GMT-5", which reads as a number rather
    // than a name, so the long form goes in the sentence instead.
    const notes = clockNotes(daysInMonth('2026-11'), 'America/New_York', 'en-GB');
    expect(notes).toEqual([
      'Clocks go back on Sunday 1 November. Times from that day are in Eastern Standard Time.',
    ]);
  });

  it('says nothing where the zone never changes', () => {
    expect(clockNotes(daysInMonth('2026-10'), 'Asia/Karachi', 'en-GB')).toEqual([]);
    expect(clockNotes([], 'Europe/London', 'en-GB')).toEqual([]);
  });
});

describe('the Ramadan timetable', () => {
  const offset = 0;
  const info = ramadanInfo('2027-02-08', offset);

  it('knows where Ramadan starts', () => {
    if (!info) throw new Error('no Ramadan');
    expect(info.firstDay).toBe('2027-02-08');
    expect(info.length).toBeGreaterThanOrEqual(29);
    expect(info.length).toBeLessThanOrEqual(30);
  });

  it('numbers the Ramadan days from one to the last, across the month boundary', () => {
    if (!info) throw new Error('no Ramadan');
    const rows = buildRamadan(input({ month: '2027-02', today: info.firstDay }), info);
    expect(rows).toHaveLength(info.length);
    expect(rows[0]?.date).toBe(info.firstDay);
    expect(rows[0]?.ramadanDay).toBe(1);
    expect(rows[rows.length - 1]?.date).toBe(info.lastDay);
    expect(rows[rows.length - 1]?.ramadanDay).toBe(info.length);
    // 1448 Ramadan runs from February into March.
    expect(info.lastDay.startsWith('2027-03')).toBe(true);
  });

  it('marks the Ramadan days of a Gregorian month and leaves the rest alone', () => {
    if (!info) throw new Error('no Ramadan');
    const february = buildMonth(input({ month: '2027-02', today: info.firstDay }), info);
    expect(february.ramadanDays.length).toBeLessThan(february.days.length);
    expect(february.ramadanDays[0]?.ramadanDay).toBe(1);
    for (const row of february.ramadanDays) {
      expect(row.date >= info.firstDay && row.date <= info.lastDay).toBe(true);
    }
    const outside = february.days.filter((row) => row.ramadanDay === null);
    expect(outside.length).toBe(february.days.length - february.ramadanDays.length);
  });

  it('has no Ramadan days in a month that does not touch it', () => {
    if (!info) throw new Error('no Ramadan');
    const june = buildMonth(input({ month: '2026-06', today: '2026-06-01' }), info);
    expect(june.ramadanDays).toEqual([]);
  });

  it('writes the span of the Ramadan table for the header', () => {
    if (!info) throw new Error('no Ramadan');
    expect(dateSpanLabel(info.firstDay, info.lastDay, 'en-GB')).toBe(
      '8 February to 8 March 2027',
    );
  });

  it('writes both years when the span crosses one', () => {
    expect(dateSpanLabel('2026-12-24', '2027-01-06', 'en-GB')).toBe(
      '24 December 2026 to 6 January 2027',
    );
  });
});
