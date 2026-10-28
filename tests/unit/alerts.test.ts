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
    alerts: { enabled: true, prayers: PRAYERS_ON, sound: 'beep', reminder: { enabled: false, minutes: 10 } },
    suhoorReminder: { enabled: false, minutes: 30 },
    ramadanCard: true,
    theme: 'system',
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
      settings({
        alerts: {
          enabled: true,
          prayers: { ...PRAYERS_ON, asr: false },
          sound: 'beep',
          reminder: { enabled: false, minutes: 10 },
        },
      }),
      NOW,
    ).map((alarm) => alarm.name);
    expect(names).not.toContain('prayer:2026-10-27:asr');
    expect(names).not.toContain('prayer:2026-10-28:asr');
  });

  it('gives nothing when alerts are off', () => {
    expect(
      scheduledAlarms(
        settings({
          alerts: {
            enabled: false,
            prayers: PRAYERS_ON,
            sound: 'beep',
            reminder: { enabled: false, minutes: 10 },
          },
        }),
        NOW,
      ),
    ).toEqual([]);
  });

  it('adds a quiet reminder before each remaining prayer when it is on', () => {
    const names = scheduledAlarms(
      settings({
        alerts: {
          enabled: true,
          prayers: PRAYERS_ON,
          sound: 'beep',
          reminder: { enabled: true, minutes: 10 },
        },
      }),
      NOW,
    ).map((alarm) => alarm.name);
    for (const slot of ['dhuhr', 'asr', 'maghrib', 'isha']) {
      expect(names).toContain(`reminder:2026-10-27:${slot}`);
    }
    expect(names).not.toContain('reminder:2026-10-27:fajr');
  });

  it('leaves the reminder off when prayer alerts are off', () => {
    const names = scheduledAlarms(
      settings({
        alerts: {
          enabled: false,
          prayers: PRAYERS_ON,
          sound: 'beep',
          reminder: { enabled: true, minutes: 10 },
        },
      }),
      NOW,
    ).map((alarm) => alarm.name);
    expect(names.filter((name) => name.startsWith('reminder:'))).toEqual([]);
  });

  it('adds a suhoor reminder only on the days of Ramadan', () => {
    // 20 February 2027 is in Ramadan 1448. Suhoor is its own setting, so it fires with
    // prayer alerts off.
    const ramadanNow = new Date('2027-02-20T16:00:00Z');
    const names = scheduledAlarms(
      settings({
        alerts: { enabled: false, prayers: PRAYERS_ON, sound: 'beep', reminder: { enabled: false, minutes: 10 } },
        suhoorReminder: { enabled: true, minutes: 30 },
      }),
      ramadanNow,
    ).map((alarm) => alarm.name);
    expect(names).toContain('suhoor:2027-02-21');
    expect(names.filter((name) => name.startsWith('suhoor:'))).toEqual(['suhoor:2027-02-21']);
  });

  it('keeps the daily refresh when prayer alerts are off but the suhoor reminder is on', () => {
    // 20 February 2027 is in Ramadan 1448. The refresh is the only thing that wakes the
    // worker after midnight to plan the next day, so without it the suhoor alarms
    // scheduled here would stop after the two days planned ahead, until Chrome restarted.
    const ramadanNow = new Date('2027-02-20T16:00:00Z');
    const names = scheduledAlarms(
      settings({
        alerts: { enabled: false, prayers: PRAYERS_ON, sound: 'beep', reminder: { enabled: false, minutes: 10 } },
        suhoorReminder: { enabled: true, minutes: 30 },
      }),
      ramadanNow,
    ).map((alarm) => alarm.name);
    expect(names).toContain('suhoor:2027-02-21');
    expect(names).toContain('refresh');
  });

  it('keeps the daily refresh when the suhoor reminder is on before Ramadan', () => {
    // 1 Ramadan 1448 is 8 February 2027. Three days before, today and tomorrow are both
    // outside Ramadan, so no suhoor alarm exists yet. The refresh still has to wake the
    // worker each night, or the first suhoor alarm is never scheduled when Ramadan begins.
    const beforeRamadan = new Date('2027-02-05T16:00:00Z');
    const names = scheduledAlarms(
      settings({
        alerts: { enabled: false, prayers: PRAYERS_ON, sound: 'beep', reminder: { enabled: false, minutes: 10 } },
        suhoorReminder: { enabled: true, minutes: 30 },
      }),
      beforeRamadan,
    ).map((alarm) => alarm.name);
    expect(names.filter((name) => name.startsWith('suhoor:'))).toEqual([]);
    expect(names).toContain('refresh');
  });

  it('gives an empty list when prayer alerts and the suhoor reminder are both off', () => {
    // Everything off leaves nothing to wake for, so even the daily refresh stays out.
    const ramadanNow = new Date('2027-02-20T16:00:00Z');
    expect(
      scheduledAlarms(
        settings({
          alerts: { enabled: false, prayers: PRAYERS_ON, sound: 'beep', reminder: { enabled: false, minutes: 10 } },
          suhoorReminder: { enabled: false, minutes: 30 },
        }),
        ramadanNow,
      ),
    ).toEqual([]);
  });

  it('never schedules a suhoor reminder outside Ramadan', () => {
    const names = scheduledAlarms(
      settings({ suhoorReminder: { enabled: true, minutes: 30 } }),
      NOW,
    ).map((alarm) => alarm.name);
    expect(names.filter((name) => name.startsWith('suhoor:'))).toEqual([]);
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

  it('reads refresh, badge and clear names back', () => {
    expect(parseAlarmName('refresh')).toEqual({ kind: 'refresh' });
    expect(parseAlarmName('badge')).toEqual({ kind: 'badge' });
    expect(parseAlarmName('clear:prayer:2026-10-27:asr')).toEqual({
      kind: 'clear',
      notificationId: 'prayer:2026-10-27:asr',
    });
  });

  it('reads a reminder name back', () => {
    expect(parseAlarmName('reminder:2026-10-27:asr')).toEqual({
      kind: 'reminder',
      date: '2026-10-27',
      slot: 'asr',
    });
  });

  it('reads a suhoor name back', () => {
    expect(parseAlarmName('suhoor:2026-10-27')).toEqual({ kind: 'suhoor', date: '2026-10-27' });
  });

  it('rejects names that are not a known alarm shape', () => {
    expect(parseAlarmName('')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-10-27:sunrise')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-13-99:asr')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:evil:asr')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-10-27:asr:extra')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('prayer:2026-10-27:ASR')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('clear:')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('reminder:2026-10-27:sunrise')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('reminder:2026-10-27')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('reminder:2026-13-99:asr')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('reminder:2026-10-27:asr:extra')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('suhoor:')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('suhoor:2026-13-99')).toEqual({ kind: 'unknown' });
    expect(parseAlarmName('suhoor:2026-10-27:extra')).toEqual({ kind: 'unknown' });
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
