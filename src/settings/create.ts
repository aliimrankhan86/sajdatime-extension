import { suggestMethod } from '../core/suggestions';
import { DEFAULT_ALERTS, type Place, type Settings } from './types';

/**
 * A first place from the browser's own location.
 *
 * Geolocation does not return a country. The earlier scaffold guessed one from the
 * browser's language, which gave a user in Karachi an en-US computer the ISNA method:
 * confidently wrong times, with no Settings screen to correct them. Until the city
 * search learns the real country, an unknown place falls back to the Muslim World
 * League, which is the plan's safe default and is not tied to a country.
 */
export function firstSettings(place: Place): Settings {
  const suggestion = suggestMethod(place.countryCode, 'sunni');
  return {
    version: 1,
    place,
    sect: 'sunni',
    method: suggestion.suggested,
    madhab: 'shafii',
    hijriOffsetDays: 0,
    alerts: DEFAULT_ALERTS,
    ramadanCard: true,
  };
}
