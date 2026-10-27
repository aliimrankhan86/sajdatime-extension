import { suggestMethod } from '../core/suggestions';
import type { Place, Settings } from './types';

/**
 * A first place from the browser's own location. The country is only a hint from the
 * browser's language, because geolocation does not return one; "ZZ" falls back to the
 * Muslim World League, which is the plan's safe default for an unknown country.
 */
export function firstSettings(place: Place, language: string): Settings {
  const region = regionOf(language);
  const suggestion = suggestMethod(region, 'sunni');
  return {
    version: 1,
    place: { ...place, countryCode: region },
    sect: 'sunni',
    method: suggestion.suggested,
    madhab: 'shafii',
    hijriOffsetDays: 0,
  };
}

export function regionOf(language: string): string {
  try {
    const region = new Intl.Locale(language).region;
    return region && /^[A-Z]{2}$/.test(region) ? region : 'ZZ';
  } catch {
    return 'ZZ';
  }
}
