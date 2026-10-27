import { isMethodId } from '../core/methods';
import type { Madhab, MethodId, Sect } from '../core/types';

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

export interface Settings {
  version: 1;
  place: Place;
  sect: Sect;
  method: MethodId;
  madhab: Madhab;
  hijriOffsetDays: number;
}

export const SETTINGS_KEY = 'sajdatime.settings.v1';

// A version 2 must be migrated in storage.ts before this guard sees it. Until then a
// version 2 object is rejected and the popup returns to first run, which is safe before
// the first release and deliberate once released only if the migration is written first.

export function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Settings>;
  const place = candidate.place;
  if (typeof place !== 'object' || place === null) return false;

  return (
    candidate.version === 1 &&
    typeof place.name === 'string' &&
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
    candidate.hijriOffsetDays <= 2
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
