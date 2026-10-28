import { describe, expect, it } from 'vitest';
import { isLate, parseAlarmName, prayerAlertMessage, scheduledAlarms } from '../../src/core/alerts';
import { computeDay } from '../../src/core/engine';
import type { Settings } from '../../src/settings/types';

const TZ = 'Europe/London';
const PLACE = { name: 'London', latitude: 51.5074, longitude: -0.1278, timeZone: TZ, countryCode: 'GB' };
const PRAYERS_ON = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };

function settings(overrides: Partial<Settings> = {}): Settings {
  return {
    version: 1,
    place: PLACE,
    sect: 'sunni',
    method: 'mwl',
    madhab: 'shafii',
    hijriOffsetDays: 0,
    alerts: { enabled: true, prayers: PRAYERS_ON, sound: 'beep' },
    ramadanCard: true,
    ...overrides,
  };
}

// 27 October 2026 at 10:00 in London. British Summer Time ended two days earlier, so
// London is UTC, and 10:00Z is 10:00 local. Fajr (04:53) has already passed.
const NOW = new Date('2026-10-27T10:00:00Z');

describe('scheduledAlarms', () => {
  it('holds the four remaining prayers for today, all five for tomorrow, and refresh', () => {
    const names = scheduledAlarms(settings(), NOW)
      .map((alarm) => alarm.name)
      .sort();
    expect(names).toEqual([
      'prayer:2026-10-27:asr',
      'prayer:2026-10-27:dhuhr',
      'prayer:2026-10-27:isha',
      'prayer:2026-10-27:maghrib',
      'prayer:2026-10-28:asr',
      'prayer:2026-10-28:dhuhr',
      'prayer:2026-10-28:fajr',
      'prayer:2026-10-28:isha',
      'prayer:2026-10-28:maghrib',
      'refresh',
    ]);
  });

  it('leaves out a prayer the user turned off', () => {
    const names = scheduledAlarms(
      settings({ alerts: { enabled: true, prayers: { ...PRAYERS_ON, asr: false }, sound: 'beep' } }),
      NOW,
    ).map((alarm) => alarm.name);
    expect(names).not.toContain('prayer:2026-10-27:asr');
    expect(names).not.toContain('prayer:2026-10-28:asr');
  });

  it('gives nothing when alerts are off', () => {
    expect(
      scheduledAlarms(settings({ alerts: { enabled: false, prayers: PRAYERS_ON, sound: 'beep' } }), NOW),
    ).toEqual([]);
  });

  it('puts a Shia Maghrib alarm at the Shia Maghrib', () => {
    const sunni = computeDay(PLACE, '2026-10-27', { method: 'mwl', madhab: 'shafii', timeZone: TZ });
    const shia = computeDay(PLACE, '2026-10-27', { method: 'tehran', madhab: 'shafii', timeZone: TZ });
    expect(shia.times.maghrib.getTime()).toBeGreaterThan(sunni.times.maghrib.getTime());
    const alarm = scheduledAlarms(settings({ sect: 'shia', method: 'tehran' }), NOW).find(
      (entry) => entry.name === 'prayer:2026-10-27:maghrib',
    );
    expect(alarm?.when.getTime()).toBe(shia.times.maghrib.getTime());
  });
});

describe('the late check', () => {
  const scheduled = Date.UTC(2026, 9, 27, 12, 0, 0);

  it('allows four minutes late', () => {
    expect(isLate(scheduled + 4 * 60 * 1000, scheduled)).toBe(false);
  });

  it('blocks six minutes late', () => {
    expect(isLate(scheduled + 6 * 60 * 1000, scheduled)).toBe(true);
  });
});

describe('parseAlarmName', () => {
  it('reads a prayer name back', () => {
    expect(parseAlarmName('prayer:2026-10-27:asr')).toEqual({
      kind: 'prayer',
      date: '2026-10-27',
      slot: 'asr',
    });
  });

  it('reads refresh and clear names back', () => {
    expect(parseAlarmName('refresh')).toEqual({ kind: 'refresh' });
    expect(parseAlarmName('clear:prayer:2026-10-27:asr')).toEqual({
      kind: 'clear',
      notificationId: 'prayer:2026-10-27:asr',
    });
  });

  it('rejects names that are not a prayer, a refresh or a clear', () => {
    expect(parseAlarmName('')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-10-27:sunrise')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-13-99:asr')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:evil:asr')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-10-27:asr:extra')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-10-27:ASR')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('clear:')).toEqual({ kind: 'unknown' });
  });
});

describe('prayerAlertMessage', () => {
  it('is the iftar wording for Maghrib in Ramadan', () => {
    expect(prayerAlertMessage('maghrib', 'London', true)).toBe(
      'It is time for Maghrib. You can break your fast.',
    );
  });

  it('keeps the ordinary wording outside Ramadan and for other prayers', () => {
    expect(prayerAlertMessage('maghrib', 'London', false)).toBe('It is time for Maghrib in London.');
    expect(prayerAlertMessage('fajr', 'London', true)).toBe('It is time for Fajr in London.');
  });
});
