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

export function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Settings>;
  return (
    candidate.version === 1 &&
    typeof candidate.place === 'object' &&
    candidate.place !== null &&
    typeof candidate.place.name === 'string' &&
    typeof candidate.place.latitude === 'number' &&
    typeof candidate.place.longitude === 'number' &&
    typeof candidate.place.timeZone === 'string' &&
    typeof candidate.place.countryCode === 'string' &&
    (candidate.sect === 'sunni' || candidate.sect === 'shia') &&
    typeof candidate.method === 'string' &&
    (candidate.madhab === 'hanafi' || candidate.madhab === 'shafii') &&
    Number.isInteger(candidate.hijriOffsetDays)
  );
}
