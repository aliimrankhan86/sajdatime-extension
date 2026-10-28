import { addDaysISO, computeDay, dateInZone, parseISODate } from './engine';
import { PRAYERS, type CalculationPrefs, type Prayer } from './types';
import type { Settings } from '../settings/types';

export interface ScheduledAlarm {
  name: string;
  when: Date;
}

export type AlarmName =
  | { kind: 'prayer'; date: string; slot: Prayer }
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
 * day refresh that rebuilds the list when the civil date rolls over. Sunrise is shown on
 * the Times screen but is not a prayer, so it is never scheduled.
 */
export function scheduledAlarms(settings: Settings, now: Date): ScheduledAlarm[] {
  if (!settings.alerts.enabled) return [];
  const prefs: CalculationPrefs = {
    method: settings.method,
    madhab: settings.madhab,
    timeZone: settings.place.timeZone,
  };
  const today = dateInZone(now, settings.place.timeZone);
  const tomorrow = addDaysISO(today, 1);
  const alarms: ScheduledAlarm[] = [];
  for (const date of [today, tomorrow]) {
    const day = computeDay(settings.place, date, prefs);
    for (const prayer of PRAYERS) {
      if (!settings.alerts.prayers[prayer]) continue;
      const at = day.times[prayer];
      if (at.getTime() <= now.getTime()) continue;
      alarms.push({ name: prayerAlarmName(date, prayer), when: at });
    }
  }
  alarms.push({ name: 'refresh', when: refreshTime(now, settings.place.timeZone) });
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
 * Strict read of an alarm name (SECURITY.md R11). Only the three shapes the worker
 * creates are accepted; anything else is ignored rather than used.
 */
export function parseAlarmName(name: string): AlarmName {
  if (name === 'refresh') return { kind: 'refresh' };
  if (name.startsWith('clear:')) {
    const notificationId = name.slice('clear:'.length);
    return notificationId.length > 0 ? { kind: 'clear', notificationId } : { kind: 'unknown' };
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
