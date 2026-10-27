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

  it('keeps a normal Shia day usable above 60 degrees in summer', () => {
    // The Shia Maghrib sits after sunset, so the solar day must be judged against sunset
    // itself. Before this fix Oslo on midsummer was wrongly projected to 45 degrees and
    // showed Sunrise 05:30 with a false "cannot be worked out" note. The sun does reach
    // 4 degrees here, so the true angle is used rather than the Twilight Angle cap.
    const jafari = computeDay(OSLO, '2026-06-21', prefs({ method: 'jafari', timeZone: 'Europe/Oslo' }));
    const tehran = computeDay(OSLO, '2026-06-21', prefs({ method: 'tehran', timeZone: 'Europe/Oslo' }));

    expect(jafari.isPolar).toBe(false);
    expect(tehran.isPolar).toBe(false);
    expect(clock(jafari.times.sunrise, 'Europe/Oslo')).toBe('03:54');
    expect(clock(jafari.times.maghrib, 'Europe/Oslo')).toBe('23:35');
    expect(clock(tehran.times.maghrib, 'Europe/Oslo')).toBe('23:46');
  });

  it('uses the phone Shia Maghrib when the sun never reaches the angle', () => {
    // At Trondheim on midsummer the sun never dips 4 degrees, so a plain maghrib angle
    // would quietly fall back to sunset. The phone's second pass with the Twilight Angle
    // rule gives a later Maghrib. Values are the phone engine's, from the Java adhan probe.
    const jafari = computeDay(
      TRONDHEIM,
      '2026-06-21',
      prefs({ method: 'jafari', timeZone: 'Europe/Oslo' }),
    );
    const tehran = computeDay(
      TRONDHEIM,
      '2026-06-21',
      prefs({ method: 'tehran', timeZone: 'Europe/Oslo' }),
    );

    expect(clock(jafari.times.maghrib, 'Europe/Oslo')).toBe('23:52');
    expect(clock(tehran.times.maghrib, 'Europe/Oslo')).toBe('23:53');
  });

  it('keeps the Shia Maghrib strictly before Isha when the true angle is late', () => {
    // Between about 60.5 and 70 degrees north the sun reaches 4 or 4.5 degrees near solar
    // midnight, after the method's Isha. Without the before-Isha guard the order clamp
    // would move Isha onto Maghrib and show the same minute twice. The guard falls back
    // to the Twilight Angle cap, which is always earlier than Isha.
    const tampereJafari = computeDay(
      TAMPERE,
      '2026-06-21',
      prefs({ method: 'jafari', timeZone: 'Europe/Helsinki' }),
    );
    expect(clock(tampereJafari.times.maghrib, 'Europe/Helsinki')).toBe('23:30');
    expect(clock(tampereJafari.times.isha, 'Europe/Helsinki')).toBe('00:15');

    const tampereTehran = computeDay(
      TAMPERE,
      '2026-06-21',
      prefs({ method: 'tehran', timeZone: 'Europe/Helsinki' }),
    );
    expect(clock(tampereTehran.times.maghrib, 'Europe/Helsinki')).toBe('23:32');
    expect(clock(tampereTehran.times.isha, 'Europe/Helsinki')).toBe('00:15');

    const trondheim = computeDay(
      TRONDHEIM,
      '2026-05-26',
      prefs({ method: 'jafari', timeZone: 'Europe/Oslo' }),
    );
    expect(clock(trondheim.times.maghrib, 'Europe/Oslo')).toBe('23:12');
    expect(clock(trondheim.times.isha, 'Europe/Oslo')).toBe('23:59');
  });

  it('keeps a late true angle that is still before Isha', () => {
    // Anchorage on 20 June reaches 4 degrees at 00:01, after sunset but still before the
    // method's Isha, so the true angle wins and the cap is not used.
    const anchorage = computeDay(
      ANCHORAGE,
      '2026-06-20',
      prefs({ method: 'jafari', timeZone: 'America/Anchorage' }),
    );
    expect(clock(anchorage.times.maghrib, 'America/Anchorage')).toBe('00:01');
    expect(clock(anchorage.times.isha, 'America/Anchorage')).toBe('00:47');
  });

  it('never lets the Shia Maghrib land on or after Isha from May to August', () => {
    // The collision window runs from late May to mid July, and its edges differ by
    // latitude, so this sweeps the whole window for both Shia methods rather than
    // pinning three days.
    for (let latitude = 55; latitude <= 66; latitude += 1) {
      for (let offset = 0; offset <= 122; offset += 3) {
        const date = new Date(Date.UTC(2026, 4, 1) + offset * 86_400_000)
          .toISOString()
          .slice(0, 10);
        for (const method of ['jafari', 'tehran'] as const) {
          const day = computeDay(
            { latitude, longitude: 10 },
            date,
            prefs({ method, timeZone: 'UTC' }),
          );
          if (day.isPolar) continue;
          expect(day.times.maghrib.getTime()).toBeLessThan(day.times.isha.getTime());
        }
      }
    }
  });

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
