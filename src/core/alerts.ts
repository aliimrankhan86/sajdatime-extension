import { addDaysISO, computeDay, dateInZone, parseISODate } from './engine';
import { isRamadan } from './hijri';
import { PRAYERS, type CalculationPrefs, type Prayer } from './types';
import type { Settings } from '../settings/types';

export interface ScheduledAlarm {
  name: string;
  when: Date;
}

export type AlarmName =
  | { kind: 'prayer'; date: string; slot: Prayer }
  | { kind: 'reminder'; date: string; slot: Prayer }
  | { kind: 'suhoor'; date: string }
  | { kind: 'badge' }
  | { kind: 'refresh' }
  | { kind: 'clear'; notificationId: string }
  | { kind: 'unknown' };

/** The names shown in a prayer alert, in the same order as PRAYERS. */
export const PRAYER_NAMES: Record<Prayer, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

/** An alarm more than this late is dropped instead of firing a stale alert. */
export const LATE_MS = 5 * 60 * 1000;

export function prayerAlarmName(date: string, slot: Prayer): string {
  return `prayer:${date}:${slot}`;
}

export function reminderAlarmName(date: string, slot: Prayer): string {
  return `reminder:${date}:${slot}`;
}

export function suhoorAlarmName(date: string): string {
  return `suhoor:${date}`;
}

/** The body of a prayer alert; in Ramadan the Maghrib alert is the iftar call. */
export function prayerAlertMessage(slot: Prayer, placeName: string, inRamadan: boolean): string {
  if (inRamadan && slot === 'maghrib') return 'It is time for Maghrib. You can break your fast.';
  return `It is time for ${PRAYER_NAMES[slot]} in ${placeName}.`;
}

export function isLate(nowMs: number, scheduledMs: number): boolean {
  return nowMs - scheduledMs > LATE_MS;
}

/**
 * The alarms that make today's and tomorrow's remaining prayers fire, plus the once a
 * day refresh that rebuilds the list when the civil date rolls over, plus the quiet
 * "before prayer" reminder when it is on. Sunrise is shown on the Times screen but is not
 * a prayer, so it is never scheduled. The suhoor reminder is its own setting and fires in
 * Ramadan even when the prayer alerts are off.
 *
 * The refresh is scheduled whenever the prayer alerts or the suhoor reminder are on, not
 * only when an alarm already exists in the list. A suhoor reminder switched on two or
 * three days before Ramadan schedules nothing yet (today and tomorrow are not Ramadan),
 * but it still needs the midnight wake-up each night, or the first suhoor alarm is never
 * scheduled when Ramadan begins. With both switches off the list stays empty: there is
 * nothing to wake for.
 */
export function scheduledAlarms(settings: Settings, now: Date): ScheduledAlarm[] {
  const prefs: CalculationPrefs = {
    method: settings.method,
    madhab: settings.madhab,
    timeZone: settings.place.timeZone,
  };
  const today = dateInZone(now, settings.place.timeZone);
  const tomorrow = addDaysISO(today, 1);
  const alarms: ScheduledAlarm[] = [];

  if (settings.alerts.enabled) {
    for (const date of [today, tomorrow]) {
      const day = computeDay(settings.place, date, prefs);
      for (const prayer of PRAYERS) {
        if (!settings.alerts.prayers[prayer]) continue;
        const at = day.times[prayer].getTime();
        if (at <= now.getTime()) continue;
        alarms.push({ name: prayerAlarmName(date, prayer), when: new Date(at) });
        if (settings.alerts.reminder.enabled) {
          const reminderAt = at - settings.alerts.reminder.minutes * 60 * 1000;
          if (reminderAt > now.getTime()) {
            alarms.push({ name: reminderAlarmName(date, prayer), when: new Date(reminderAt) });
          }
        }
      }
    }
  }

  if (settings.suhoorReminder.enabled) {
    for (const date of [today, tomorrow]) {
      if (!isRamadan(date, settings.hijriOffsetDays)) continue;
      const fajr = computeDay(settings.place, date, prefs).times.fajr.getTime();
      const at = fajr - settings.suhoorReminder.minutes * 60 * 1000;
      if (at > now.getTime()) alarms.push({ name: suhoorAlarmName(date), when: new Date(at) });
    }
  }

  // Any prayer, reminder or suhoor alarm needs the midnight wake-up to plan the next day,
  // and so does a suhoor reminder that has no alarm yet because Ramadan has not started.
  if (settings.alerts.enabled || settings.suhoorReminder.enabled) {
    alarms.push({ name: 'refresh', when: refreshTime(now, settings.place.timeZone) });
  }

  return alarms;
}

/**
 * One minute after the next local midnight, so the worker wakes once a day to schedule
 * the new day. The zone offset is read twice so a daylight-saving change on the same
 * night does not throw the wake-up by an hour.
 */
function refreshTime(now: Date, timeZone: string): Date {
  const today = dateInZone(now, timeZone);
  const tomorrow = addDaysISO(today, 1);
  const guess = Date.parse(`${tomorrow}T00:00:00Z`);
  const first = guess - zoneOffsetMs(guess, timeZone);
  const second = guess - zoneOffsetMs(first, timeZone);
  return new Date(second + 60 * 1000);
}

function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (type: string): number => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUTC - instant;
}

/**
 * Strict read of an alarm name (SECURITY.md R11). Only the shapes the worker creates are
 * accepted; anything else is ignored rather than used.
 */
export function parseAlarmName(name: string): AlarmName {
  if (name === 'refresh') return { kind: 'refresh' };
  if (name === 'badge') return { kind: 'badge' };
  if (name.startsWith('clear:')) {
    const notificationId = name.slice('clear:'.length);
    return notificationId.length > 0 ? { kind: 'clear', notificationId } : { kind: 'unknown' };
  }
  if (name.startsWith('reminder:')) {
    const parts = name.slice('reminder:'.length).split(':');
    if (parts.length !== 2) return { kind: 'unknown' };
    const [date, slot] = parts;
    if (!date || !slot) return { kind: 'unknown' };
    if (!PRAYERS.includes(slot as Prayer)) return { kind: 'unknown' };
    try {
      parseISODate(date);
    } catch {
      return { kind: 'unknown' };
    }
    return { kind: 'reminder', date, slot: slot as Prayer };
  }
  if (name.startsWith('suhoor:')) {
    const date = name.slice('suhoor:'.length);
    if (!date) return { kind: 'unknown' };
    try {
      parseISODate(date);
    } catch {
      return { kind: 'unknown' };
    }
    return { kind: 'suhoor', date };
  }
  if (!name.startsWith('prayer:')) return { kind: 'unknown' };
  const parts = name.slice('prayer:'.length).split(':');
  if (parts.length !== 2) return { kind: 'unknown' };
  const [date, slot] = parts;
  if (!date || !slot) return { kind: 'unknown' };
  if (!PRAYERS.includes(slot as Prayer)) return { kind: 'unknown' };
  try {
    parseISODate(date);
  } catch {
    return { kind: 'unknown' };
  }
  return { kind: 'prayer', date, slot: slot as Prayer };
}
