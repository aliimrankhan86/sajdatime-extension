import { describe, expect, it } from 'vitest';
import { computeDay } from '../../src/core/engine';
import { matchLabel, matchMethods } from '../../src/core/match';
import { methodsOfferedTo } from '../../src/core/methods';
import { MAKKAH } from '../../src/settings/place';

const LONDON = {
  name: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
  timeZone: 'Europe/London',
  countryCode: 'GB',
};

function fajrMinutes(method: Parameters<typeof computeDay>[2]['method'], date: string): number {
  const day = computeDay(LONDON, date, {
    method,
    madhab: 'shafii',
    timeZone: LONDON.timeZone,
    hijriOffsetDays: 0,
  });
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: LONDON.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(day.times.fajr);
  let hour = 0;
  let minute = 0;
  for (const part of parts) {
    if (part.type === 'hour') hour = Number(part.value);
    if (part.type === 'minute') minute = Number(part.value);
  }
  return hour * 60 + minute;
}

describe('matchMethods', () => {
  const now = new Date('2026-10-28T11:00:00Z');

  it('puts the exact match first with a zero difference', () => {
    // Muslim World League and Karachi both use an 18-degree Fajr, so they tie on London.
    const target = fajrMinutes('mwl', '2026-10-28');
    const matches = matchMethods(LONDON, LONDON.timeZone, 'sunni', 'shafii', 0, target, now);
    expect(matches.length).toBe(methodsOfferedTo('sunni').length);
    expect(matches[0]?.diffMinutes).toBe(0);
    expect(matches.find((entry) => entry.method === 'mwl')?.diffMinutes).toBe(0);
  });

  it('is sorted closest first', () => {
    const matches = matchMethods(LONDON, LONDON.timeZone, 'sunni', 'shafii', 0, 6 * 60, now);
    for (let index = 1; index < matches.length; index += 1) {
      const current = matches[index];
      const previous = matches[index - 1];
      if (!current || !previous) continue;
      expect(Math.abs(current.diffMinutes)).toBeGreaterThanOrEqual(Math.abs(previous.diffMinutes));
    }
  });

  it('offers only the methods for the chosen school', () => {
    const sunni = matchMethods(LONDON, LONDON.timeZone, 'sunni', 'shafii', 0, 6 * 60, now).map(
      (entry) => entry.method,
    );
    const shia = matchMethods(LONDON, LONDON.timeZone, 'shia', 'shafii', 0, 6 * 60, now).map(
      (entry) => entry.method,
    );
    expect(sunni).not.toContain('jafari');
    expect(sunni).not.toContain('tehran');
    expect(shia).toEqual(expect.arrayContaining(['jafari', 'tehran']));
  });

  it('still works for a place far from any method', () => {
    const matches = matchMethods(
      MAKKAH,
      MAKKAH.timeZone,
      'sunni',
      'shafii',
      0,
      3 * 60,
      new Date('2026-10-28T11:00:00Z'),
    );
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('matchLabel', () => {
  it('uses the words from PLAN 5.4', () => {
    expect(matchLabel(0)).toBe("At your mosque's time");
    expect(matchLabel(1)).toBe('1 minute after your mosque');
    expect(matchLabel(-1)).toBe('1 minute before your mosque');
    expect(matchLabel(6)).toBe('6 minutes after your mosque');
    expect(matchLabel(-6)).toBe('6 minutes before your mosque');
  });
});
