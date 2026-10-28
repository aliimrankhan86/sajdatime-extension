import { isMethodId } from '../core/methods';
import { PRAYERS, type Madhab, type MethodId, type Prayer, type Sect } from '../core/types';

export interface Place {
  /** What the user sees, for example "My location" or a city name. */
  name: string;
  latitude: number;
  longitude: number;
  /** IANA zone for this place. Times are displayed in it. */
  timeZone: string;
  /** ISO 3166-1 alpha-2, or "ZZ" when unknown. Drives the method suggestion. */
  countryCode: string;
}

export const THEMES = ['system', 'light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

export const ALERT_SOUNDS = ['beep', 'adhan', 'silent'] as const;

export type AlertSound = (typeof ALERT_SOUNDS)[number];

export interface AlertsSettings {
  /** Alerts do nothing until the user turns them on in Settings. */
  enabled: boolean;
  sound: AlertSound;
  prayers: Record<Prayer, boolean>;
}

export const DEFAULT_ALERTS: AlertsSettings = {
  enabled: false,
  sound: 'beep',
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
};

export interface Settings {
  version: 1;
  place: Place;
  sect: Sect;
  method: MethodId;
  madhab: Madhab;
  hijriOffsetDays: number;
  alerts: AlertsSettings;
  ramadanCard: boolean;
  /** System follows the computer. System is the default, and a migration adds it. */
  theme: Theme;
}

export const SETTINGS_KEY = 'sajdatime.settings.v1';

// A version 2 must be migrated in storage.ts before this guard sees it. Until then a
// version 2 object is rejected and the popup returns to first run, which is safe before
// the first release and deliberate once released only if the migration is written first.

/**
 * A version 1 setting written before alerts or the Ramadan card shipped has neither.
 * This adds the defaults before validation, so an upgrade never throws a user back to
 * the first run, and never overwrites a value the user has already chosen.
 */
export function migrateSettings(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const candidate = value as Partial<Settings>;
  if (candidate.version !== 1) return value;
  let result = value;
  if (candidate.alerts === undefined) {
    result = { ...result, alerts: DEFAULT_ALERTS };
  }
  if (candidate.ramadanCard === undefined) {
    result = { ...result, ramadanCard: true };
  }
  if (candidate.theme === undefined) {
    result = { ...result, theme: 'system' };
  }
  return result;
}

export function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Settings>;
  const place = candidate.place;
  if (typeof place !== 'object' || place === null) return false;

  return (
    candidate.version === 1 &&
    typeof place.name === 'string' &&
    // docs/SECURITY.md R8: the longest bundled name is far under this, so anything longer
    // is damaged storage and the popup returns to the first run instead of rendering it.
    place.name.length <= 200 &&
    Number.isFinite(place.latitude) &&
    Math.abs(place.latitude) <= 90 &&
    Number.isFinite(place.longitude) &&
    Math.abs(place.longitude) <= 180 &&
    typeof place.timeZone === 'string' &&
    isValidTimeZone(place.timeZone) &&
    typeof place.countryCode === 'string' &&
    /^[A-Z]{2}$/.test(place.countryCode) &&
    (candidate.sect === 'sunni' || candidate.sect === 'shia') &&
    isMethodId(candidate.method) &&
    (candidate.madhab === 'hanafi' || candidate.madhab === 'shafii') &&
    typeof candidate.hijriOffsetDays === 'number' &&
    Number.isInteger(candidate.hijriOffsetDays) &&
    candidate.hijriOffsetDays >= -2 &&
    candidate.hijriOffsetDays <= 2 &&
    isAlertsSettings(candidate.alerts) &&
    typeof candidate.ramadanCard === 'boolean' &&
    THEMES.includes(candidate.theme as Theme)
  );
}

function isAlertsSettings(value: unknown): value is AlertsSettings {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AlertsSettings>;
  if (typeof candidate.enabled !== 'boolean') return false;
  if (!ALERT_SOUNDS.includes(candidate.sound as AlertSound)) return false;
  const prayers = candidate.prayers;
  if (!prayers || typeof prayers !== 'object') return false;
  const keys = Object.keys(prayers);
  if (keys.length !== PRAYERS.length) return false;
  for (const prayer of PRAYERS) {
    if (typeof (prayers as Record<string, unknown>)[prayer] !== 'boolean') return false;
  }
  return true;
}

function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return true;
  } catch {
    return false;
  }
}
