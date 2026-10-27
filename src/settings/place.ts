import { roundCoordinate, type City } from '../core/cities';
import type { Place } from './types';

/** Makkah, used only when someone asks for it or cannot find their own place. */
export const MAKKAH: Place = {
  name: 'Makkah',
  latitude: 21.4225,
  longitude: 39.8262,
  timeZone: 'Asia/Riyadh',
  countryCode: 'SA',
};

/** A searched town. The country drives the first calculation method suggestion. */
export function placeFromCity(city: City): Place {
  return {
    name: city.name,
    latitude: roundCoordinate(city.latitude),
    longitude: roundCoordinate(city.longitude),
    timeZone: city.timeZone,
    countryCode: city.countryCode,
  };
}

/**
 * The browser's own fix. Geolocation does not return a country, so the country stays
 * unknown and the method falls back to the safe Muslim World League suggestion.
 */
export function placeFromBrowser(latitude: number, longitude: number, timeZone: string): Place {
  return {
    name: 'My location',
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
    timeZone,
    countryCode: 'ZZ',
  };
}
