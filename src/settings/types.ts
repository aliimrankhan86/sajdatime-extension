import { isMethodId } from '../core/methods';
import { LANGUAGE_CHOICES, type LanguageChoice } from '../i18n';
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

/** The quiet "before each prayer" reminder, off by default (PLAN.md §7). */
export const REMINDER_MINUTES = [5, 10, 15, 20, 30] as const;

export type ReminderMinutes = (typeof REMINDER_MINUTES)[number];

export interface ReminderSetting {
  /** Off until the user turns it on in Settings, inside the Alerts group. */
  enabled: boolean;
  minutes: ReminderMinutes;
}

/** The suhoor reminder, off by default and 30 minutes before Fajr when on (PLAN.md §7). */
export const SUHOOR_MINUTES = [15, 30, 45, 60] as const;

export type SuhoorMinutes = (typeof SUHOOR_MINUTES)[number];

export interface SuhoorSetting {
  enabled: boolean;
  minutes: SuhoorMinutes;
}

export interface AlertsSettings {
  /** Alerts do nothing until the user turns them on in Settings. */
  enabled: boolean;
  sound: AlertSound;
  prayers: Record<Prayer, boolean>;
  reminder: ReminderSetting;
}

export const DEFAULT_ALERTS: AlertsSettings = {
  enabled: false,
  sound: 'beep',
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  reminder: { enabled: false, minutes: 10 },
};

export const DEFAULT_SUHOOR_REMINDER: SuhoorSetting = { enabled: false, minutes: 30 };

export interface Settings {
  version: 1;
  place: Place;
  sect: Sect;
  method: MethodId;
  madhab: Madhab;
  hijriOffsetDays: number;
  alerts: AlertsSettings;
  ramadanCard: boolean;
  suhoorReminder: SuhoorSetting;
  /** System follows the computer. System is the default, and a migration adds it. */
  theme: Theme;
  /** `auto` follows the browser language. A migration adds it to older settings. */
  language: LanguageChoice;
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
  } else if (
    typeof candidate.alerts === 'object' &&
    candidate.alerts !== null &&
    (candidate.alerts as Partial<AlertsSettings>).reminder === undefined
  ) {
    // An alerts object written before the reminder shipped keeps its own choices and
    // gains the off-by-default reminder.
    result = {
      ...result,
      alerts: { ...(candidate.alerts as AlertsSettings), reminder: DEFAULT_ALERTS.reminder },
    };
  }
  if (candidate.ramadanCard === undefined) {
    result = { ...result, ramadanCard: true };
  }
  if (candidate.suhoorReminder === undefined) {
    result = { ...result, suhoorReminder: DEFAULT_SUHOOR_REMINDER };
  }
  if (candidate.theme === undefined) {
    result = { ...result, theme: 'system' };
  }
  if (candidate.language === undefined) {
    result = { ...result, language: 'auto' };
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
    isSuhoorSetting(candidate.suhoorReminder) &&
    THEMES.includes(candidate.theme as Theme) &&
    LANGUAGE_CHOICES.includes(candidate.language as LanguageChoice)
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
  return isReminderSetting(candidate.reminder);
}

function isReminderSetting(value: unknown): value is ReminderSetting {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ReminderSetting>;
  return (
    typeof candidate.enabled === 'boolean' &&
    REMINDER_MINUTES.includes(candidate.minutes as ReminderMinutes)
  );
}

function isSuhoorSetting(value: unknown): value is SuhoorSetting {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SuhoorSetting>;
  return (
    typeof candidate.enabled === 'boolean' &&
    SUHOOR_MINUTES.includes(candidate.minutes as SuhoorMinutes)
  );
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
