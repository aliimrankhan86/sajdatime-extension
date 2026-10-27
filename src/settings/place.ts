import {
  distanceKm,
  loadCities,
  nearestCity,
  preferredCityName,
  roundCoordinate,
  type City,
} from '../core/cities';
import type { Place } from './types';

/** Makkah, used only when someone asks for it or cannot find their own place. */
export const MAKKAH: Place = {
  name: 'Makkah',
  latitude: 21.4225,
  longitude: 39.8262,
  timeZone: 'Asia/Riyadh',
  countryCode: 'SA',
};

/**
 * Past this distance the town only says roughly where the user is, so the name becomes
 * "Near <town>" and the header does not claim they are in the town centre.
 */
export const NEAR_DISTANCE_KM = 50;

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
 * The browser's own fix, named by the nearest city in the bundled list.
 *
 * The coordinates stay the browser's, rounded as before, because the times are for where
 * the user is and not for the town centre. The name and the country come from that city,
 * which is what lets the first run suggest the right method for the place.
 */
export function placeFromBrowser(
  latitude: number,
  longitude: number,
  timeZone: string,
  city: City | null,
): Place {
  const rounded = {
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
    timeZone,
  };

  // The list could not be read, so fall back to the old unknown place rather than
  // leaving the user without times at all.
  if (!city) return { name: 'My location', ...rounded, countryCode: 'ZZ' };

  const far = distanceKm(latitude, longitude, city.latitude, city.longitude) > NEAR_DISTANCE_KM;
  return {
    name: far ? `Near ${city.name}` : city.name,
    ...rounded,
    countryCode: city.countryCode,
  };
}

/**
 * The whole path from a geolocation fix to a saved place. The city list is loaded only
 * once the browser has returned a position, exactly as the search loads it, so a person
 * who never uses location never pays for the list.
 */
export async function placeFromGeolocation(
  latitude: number,
  longitude: number,
  timeZone: string,
): Promise<Place> {
  const cities = await loadCities().catch(() => null);
  const nearest = cities ? nearestCity(latitude, longitude, cities) : null;
  if (!cities || !nearest) return placeFromBrowser(latitude, longitude, timeZone, nearest);
  const city: City = {
    ...nearest,
    name: preferredCityName(nearest, latitude, longitude, cities),
  };
  return placeFromBrowser(latitude, longitude, timeZone, city);
}
