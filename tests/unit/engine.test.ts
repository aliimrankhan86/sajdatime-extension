import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  computeDay,
  currentPrayer,
  dateInZone,
  nextPrayer,
  parseISODate,
} from '../../src/core/engine';
import { SLOTS, type CalculationPrefs, type PrayerSlot } from '../../src/core/types';

const MAKKAH = { latitude: 21.4225, longitude: 39.8262 };
const TEHRAN = { latitude: 35.6892, longitude: 51.389 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const OSLO = { latitude: 59.9139, longitude: 10.7522 };
const TRONDHEIM = { latitude: 63.4305, longitude: 10.3951 };
const TAMPERE = { latitude: 61.4978, longitude: 23.761 };
const ANCHORAGE = { latitude: 61.2181, longitude: -149.9003 };
const MANCHESTER = { latitude: 53.48, longitude: -2.24 };

function prefs(overrides: Partial<CalculationPrefs>): CalculationPrefs {
  return {
    method: 'mwl',
    madhab: 'shafii',
    timeZone: 'Europe/London',
    ...overrides,
  };
}

function clock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function clocks(
  coordinates: { latitude: number; longitude: number },
  date: string,
  options: CalculationPrefs,
): Record<PrayerSlot, string> {
  const day = computeDay(coordinates, date, options);
  return Object.fromEntries(
    Object.entries(day.times).map(([slot, value]) => [slot, clock(value, options.timeZone)]),
  ) as Record<PrayerSlot, string>;
}

function circularMinutes(a: number, b: number): number {
  const minutes = Math.abs(a - b) / 60000;
  const rem = minutes % 1440;
  return Math.min(rem, 1440 - rem);
}

describe('computeDay', () => {
  it('matches the phone for Makkah, Umm al-Qura, 15 January 2026', () => {
    expect(
      clocks(MAKKAH, '2026-01-15', prefs({ method: 'umm-al-qura', timeZone: 'Asia/Riyadh' })),
    ).toEqual({
      fajr: '05:41',
      sunrise: '07:01',
      dhuhr: '12:30',
      asr: '15:38',
      maghrib: '17:59',
      isha: '19:29',
    });
  });

  it('matches the phone for Tehran, Jafari, 21 June 2026', () => {
    expect(clocks(TEHRAN, '2026-06-21', prefs({ method: 'jafari', timeZone: 'Asia/Tehran' }))).toEqual(
      {
        fajr: '03:14',
        sunrise: '04:49',
        dhuhr: '12:06',
        asr: '15:55',
        maghrib: '19:42',
        isha: '20:44',
      },
    );
  });

  it('keeps a normal Shia day above 60 degrees in summer as a real day', () => {
    // The Shia Maghrib sits after sunset, so the solar day must be judged against sunset
    // itself. Before this fix Oslo on midsummer was wrongly projected to 45 degrees and
    // showed Sunrise 05:30 with a false "cannot be worked out" note.
    const jafari = computeDay(OSLO, '2026-06-21', prefs({ method: 'jafari', timeZone: 'Europe/Oslo' }));
    const tehran = computeDay(OSLO, '2026-06-21', prefs({ method: 'tehran', timeZone: 'Europe/Oslo' }));

    expect(jafari.isPolar).toBe(false);
    expect(tehran.isPolar).toBe(false);
    expect(clock(jafari.times.sunrise, 'Europe/Oslo')).toBe('03:54');
  });

  it('matches the phone Shia Maghrib and Isha at five high-latitude places', () => {
    // Values are the phone's, from tools/adhan-probe (adhan-java 1.2.1, the library the
    // phone ships). The Shia Maghrib is the Twilight Angle cap; Isha is the method's
    // 14-degree Isha, itself capped by the Twilight Angle rule when the sun never reaches
    // it. See DECISIONS D-002.
    const cases = [
      {
        name: 'Oslo', place: OSLO, zone: 'Europe/Oslo', date: '2026-06-21',
        jafari: { maghrib: '23:05', isha: '23:56' },
        tehran: { maghrib: '23:07', isha: '23:56' },
      },
      {
        name: 'Trondheim', place: TRONDHEIM, zone: 'Europe/Oslo', date: '2026-06-21',
        jafari: { maghrib: '23:52', isha: '00:26' },
        tehran: { maghrib: '23:53', isha: '00:26' },
      },
      {
        name: 'Tampere', place: TAMPERE, zone: 'Europe/Helsinki', date: '2026-06-21',
        jafari: { maghrib: '23:30', isha: '00:15' },
        tehran: { maghrib: '23:32', isha: '00:15' },
      },
      {
        name: 'Manchester', place: MANCHESTER, zone: 'Europe/London', date: '2026-06-21',
        jafari: { maghrib: '22:10', isha: '23:19' },
        tehran: { maghrib: '22:13', isha: '23:19' },
      },
      {
        name: 'Anchorage', place: ANCHORAGE, zone: 'America/Anchorage', date: '2026-06-20',
        jafari: { maghrib: '00:01', isha: '00:47' },
        tehran: { maghrib: '00:03', isha: '00:47' },
      },
    ];

    for (const item of cases) {
      const jafari = computeDay(item.place, item.date, prefs({ method: 'jafari', timeZone: item.zone }));
      const tehran = computeDay(item.place, item.date, prefs({ method: 'tehran', timeZone: item.zone }));
      expect(clock(jafari.times.maghrib, item.zone), `${item.name} Jafari Maghrib`).toBe(item.jafari.maghrib);
      expect(clock(jafari.times.isha, item.zone), `${item.name} Jafari Isha`).toBe(item.jafari.isha);
      expect(clock(tehran.times.maghrib, item.zone), `${item.name} Tehran Maghrib`).toBe(item.tehran.maghrib);
      expect(clock(tehran.times.isha, item.zone), `${item.name} Tehran Isha`).toBe(item.tehran.isha);
    }
  });

  it('keeps the Shia Maghrib before Isha, ordered, and continuous all of 2026', () => {
    // The phone cap is smooth: it returns the true 4 or 4.5 degree twilight when the sun
    // reaches it, and sunset plus angle / 60 of the night otherwise, so a real day never
    // jumps. This sweeps the whole year from 50 to 66 degrees and asserts three things on
    // every real day: Maghrib is before Isha, Jafari is never later than Tehran, and
    // Maghrib moves at most 10 minutes from one day to the next, measured as circular
    // time-of-day distance so a midnight crossing (23:59 to 00:01) counts as two minutes,
    // not 24 hours. Polar days and the first real day after them are skipped, because the
    // 45-degree projection changes the place and is not a day-to-day move.
    let largestMove = 0;
    for (let latitude = 50; latitude <= 66; latitude += 0.5) {
      let previousWasPolar = false;
      let previous: { jafari: number; tehran: number } | null = null;
      for (let dayOfYear = 0; dayOfYear < 365; dayOfYear += 1) {
        const date = new Date(Date.UTC(2026, 0, 1 + dayOfYear)).toISOString().slice(0, 10);
        const place = { latitude, longitude: 10 };
        const jafari = computeDay(place, date, prefs({ method: 'jafari', timeZone: 'UTC' }));
        const tehran = computeDay(place, date, prefs({ method: 'tehran', timeZone: 'UTC' }));
        const polar = jafari.isPolar || tehran.isPolar;
        if (polar || previousWasPolar) {
          previousWasPolar = polar;
          previous = null;
          continue;
        }
        previousWasPolar = false;

        expect(jafari.times.maghrib.getTime()).toBeLessThan(jafari.times.isha.getTime());
        expect(tehran.times.maghrib.getTime()).toBeLessThan(tehran.times.isha.getTime());
        expect(jafari.times.maghrib.getTime()).toBeLessThanOrEqual(tehran.times.maghrib.getTime());

        if (previous) {
          const jafariMove = circularMinutes(jafari.times.maghrib.getTime(), previous.jafari);
          const tehranMove = circularMinutes(tehran.times.maghrib.getTime(), previous.tehran);
          largestMove = Math.max(largestMove, jafariMove, tehranMove);
        }
        previous = { jafari: jafari.times.maghrib.getTime(), tehran: tehran.times.maghrib.getTime() };
      }
    }
    console.log('largest daily Shia Maghrib move (minutes):', largestMove.toFixed(2));
    expect(largestMove).toBeLessThanOrEqual(10);
  }, 60_000);

  it('keeps every time on the whole minute, as the phone does', () => {
    const day = computeDay(OSLO, '2026-06-21', prefs({ method: 'jafari', timeZone: 'Europe/Oslo' }));
    for (const slot of SLOTS) {
      expect(day.times[slot].getSeconds()).toBe(0);
      expect(day.times[slot].getMilliseconds()).toBe(0);
    }
  });

  it('matches the phone for Singapore nearest-minute rounding', () => {
    // adhan-js sets Rounding.Up for Singapore, which moves Dhuhr and Isha one minute
    // later than the phone's nearest-minute rule. The engine forces nearest so the two
    // agree. See DECISIONS D-004.
    const day = computeDay(
      MAKKAH,
      '2026-01-15',
      prefs({ method: 'singapore', timeZone: 'Asia/Riyadh' }),
    );
    expect(clock(day.times.dhuhr, 'Asia/Riyadh')).toBe('12:31');
    expect(clock(day.times.isha, 'Asia/Riyadh')).toBe('19:17');
  });

  it('matches the phone for London, Muslim World League, 10 April 2026', () => {
    expect(clocks(LONDON, '2026-04-10', prefs({ method: 'mwl' }))).toEqual({
      fajr: '04:12',
      sunrise: '06:16',
      dhuhr: '13:03',
      asr: '16:46',
      maghrib: '19:49',
      isha: '21:46',
    });
  });

  it('matches the phone at midsummer in London, where the angle never happens', () => {
    expect(clocks(LONDON, '2026-06-21', prefs({ method: 'mwl' }))).toEqual({
      fajr: '02:31',
      sunrise: '04:43',
      dhuhr: '13:03',
      asr: '17:25',
      maghrib: '21:22',
      isha: '23:27',
    });
  });

  it('returns six finite times inside the polar circle and says the sun does not rise', () => {
    const day = computeDay(
      { latitude: 78.2232, longitude: 15.6267 },
      '2026-06-21',
      prefs({ method: 'mwl', timeZone: 'Arctic/Longyearbyen' }),
    );
    expect(Object.values(day.times).every((value) => Number.isFinite(value.getTime()))).toBe(true);
    expect(day.isPolar).toBe(true);
  });

  it('never returns a polar day in an impossible order', () => {
    const cases = [
      { place: { latitude: 69.6492, longitude: 18.9553 }, zone: 'Europe/Oslo', date: '2026-12-21' },
      {
        place: { latitude: 78.2232, longitude: 15.6267 },
        zone: 'Arctic/Longyearbyen',
        date: '2026-12-21',
      },
      {
        place: { latitude: -77.8419, longitude: 166.6863 },
        zone: 'Antarctica/McMurdo',
        date: '2026-06-21',
      },
    ];

    for (const item of cases) {
      const day = computeDay(item.place, item.date, prefs({ timeZone: item.zone }));
      const milliseconds = SLOTS.map((slot) => day.times[slot].getTime());
      for (let index = 1; index < milliseconds.length; index += 1) {
        expect(milliseconds[index]).toBeGreaterThan(milliseconds[index - 1] ?? Number.NaN);
      }
      expect(day.isPolar).toBe(true);
    }
  });

  it('holds the day in order when two corrections cross', () => {
    const day = computeDay(
      { latitude: 59.9, longitude: 10.75 },
      '2026-01-01',
      prefs({ timeZone: 'Europe/Oslo', adjustments: { dhuhr: 30, asr: -30 } }),
    );
    expect(day.times.asr.getTime()).toBeGreaterThanOrEqual(day.times.dhuhr.getTime());
  });

  it('does not call an ordinary London day polar', () => {
    expect(computeDay(LONDON, '2026-04-10', prefs({})).isPolar).toBe(false);
  });

  it('adds half an hour to Isha in Ramadan for Umm al-Qura only', () => {
    const ramadan = clocks(
      MAKKAH,
      '2026-02-20',
      prefs({ method: 'umm-al-qura', timeZone: 'Asia/Riyadh' }),
    );
    const ordinary = clocks(
      MAKKAH,
      '2026-02-20',
      prefs({ method: 'umm-al-qura', timeZone: 'Asia/Riyadh', hijriOffsetDays: -3 }),
    );
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return (hours ?? 0) * 60 + (minutes ?? 0);
    };
    expect(toMinutes(ramadan.isha) - toMinutes(ordinary.isha)).toBe(30);
  });

  it('applies a manual adjustment and refuses one outside thirty minutes', () => {
    const normal = clocks(LONDON, '2026-04-10', prefs({}));
    const shifted = clocks(LONDON, '2026-04-10', prefs({ adjustments: { fajr: 10 } }));
    expect(shifted.fajr).toBe('04:22');
    expect(normal.fajr).toBe('04:12');
    expect(() => computeDay(LONDON, '2026-04-10', prefs({ adjustments: { fajr: 31 } }))).toThrow(
      /outside -30 to \+30/,
    );
  });

  it('rejects impossible dates and coordinates', () => {
    expect(() => parseISODate('2026-02-30')).toThrow(/Not a real date/);
    expect(() => computeDay(LONDON, '2026-02-30', prefs({}))).toThrow(/Not a real date/);
    expect(() => computeDay({ latitude: 91, longitude: 0 }, '2026-04-10', prefs({}))).toThrow(
      /outside the world/,
    );
  });
});

describe('next and current prayer', () => {
  const makkah = prefs({ method: 'umm-al-qura', timeZone: 'Asia/Riyadh' });

  it('finds Fajr just after midnight in the place', () => {
    const next = nextPrayer(MAKKAH, makkah, new Date('2026-01-15T00:00:00Z'));
    expect(next.slot).toBe('fajr');
    expect(clock(next.at, 'Asia/Riyadh')).toBe('05:41');
    expect(next.isTomorrow).toBe(false);
  });

  it('finds the next prayer after Isha as tomorrow Fajr', () => {
    const next = nextPrayer(MAKKAH, makkah, new Date('2026-01-15T17:00:00Z'));
    expect(next.slot).toBe('fajr');
    expect(next.isTomorrow).toBe(true);
  });

  it('treats the window after sunrise and before Dhuhr as no current prayer', () => {
    expect(currentPrayer(MAKKAH, makkah, new Date('2026-01-15T06:00:00Z'))).toBeNull();
  });

  it('returns Dhuhr as the current prayer during its window', () => {
    expect(currentPrayer(MAKKAH, makkah, new Date('2026-01-15T10:00:00Z'))).toBe('dhuhr');
  });

  it('keeps Isha current after midnight', () => {
    expect(currentPrayer(MAKKAH, makkah, new Date('2026-01-15T21:30:00Z'))).toBe('isha');
  });
});

describe('civil date helpers', () => {
  it('uses the place date, not the computer date', () => {
    expect(dateInZone(new Date('2026-01-15T23:30:00Z'), 'Asia/Riyadh')).toBe('2026-01-16');
    expect(dateInZone(new Date('2026-01-15T23:30:00Z'), 'Europe/London')).toBe('2026-01-15');
  });

  it('adds days across month, year and leap boundaries', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });
});
