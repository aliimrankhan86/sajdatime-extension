/**
 * The offline city list.
 *
 * GeoNames `cities5000` is bundled as a compact JSON file. Nothing is fetched from the
 * network: `loadCities` reads a file that ships inside the extension. The list is loaded
 * only when the user opens the place search, so the Times screen never waits for it.
 */

export interface City {
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  population: number;
  /** A Latin name from GeoNames, kept for places whose own name uses another script. */
  ascii?: string;
}

interface CityFile {
  timeZones: unknown;
  countries: unknown;
  cities: unknown;
}

const CITY_DATA_PATH = 'data/cities.json';

/** Two decimals is about one kilometre, which is all prayer times need. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Turn the compact file into cities. The tuples are positional because seventy thousand
 * objects with repeated keys would nearly double the download.
 */
export function parseCityData(value: unknown): City[] {
  if (!value || typeof value !== 'object') throw new Error('The city list is not an object.');
  const file = value as Partial<CityFile>;
  if (!Array.isArray(file.timeZones) || !Array.isArray(file.countries) || !Array.isArray(file.cities)) {
    throw new Error('The city list is missing a table.');
  }
  if (!file.timeZones.every((zone) => typeof zone === 'string')) {
    throw new Error('The city list has a bad time zone table.');
  }
  if (!file.countries.every((code) => typeof code === 'string' && /^[A-Z]{2}$/.test(code))) {
    throw new Error('The city list has a bad country table.');
  }

  const timeZones = file.timeZones as string[];
  const countries = file.countries as string[];
  const cities: City[] = [];

  for (const row of file.cities) {
    if (!Array.isArray(row) || row.length !== 7) {
      throw new Error('The city list has a bad row.');
    }
    const [name, ascii, countryIndex, latitude, longitude, timeZoneIndex, population] = row;
    if (
      typeof name !== 'string' ||
      name.length === 0 ||
      !(typeof ascii === 'string' || ascii === 0) ||
      !Number.isInteger(countryIndex) ||
      !Number.isInteger(timeZoneIndex) ||
      !Number.isInteger(population) ||
      population < 0 ||
      typeof latitude !== 'number' ||
      !Number.isFinite(latitude) ||
      Math.abs(latitude) > 90 ||
      typeof longitude !== 'number' ||
      !Number.isFinite(longitude) ||
      Math.abs(longitude) > 180
    ) {
      throw new Error('The city list has a bad value.');
    }

    const countryCode = countries[countryIndex];
    const timeZone = timeZones[timeZoneIndex];
    if (!countryCode || !timeZone) throw new Error('The city list points at a missing table row.');

    cities.push({
      name,
      countryCode,
      latitude: roundCoordinate(latitude),
      longitude: roundCoordinate(longitude),
      timeZone,
      population,
      ascii: typeof ascii === 'string' && ascii !== name ? ascii : undefined,
    });
  }

  return cities;
}

let cached: Promise<City[]> | null = null;

/** Load and cache the bundled list. A second call reuses the first promise. */
export function loadCities(): Promise<City[]> {
  if (cached) return cached;
  cached = fetch(chrome.runtime.getURL(CITY_DATA_PATH))
    .then((response) => {
      if (!response.ok) throw new Error(`The city list returned ${response.status}.`);
      return response.json() as Promise<unknown>;
    })
    .then(parseCityData)
    .catch((error: unknown) => {
      cached = null;
      throw error;
    });
  return cached;
}

function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Best matches first: a name that starts with the query, then a word inside it, then a
 * name that contains it. Within one score the larger place wins, which puts London above
 * a village of the same name.
 */
export const CITY_SEARCH_LIMIT = 6;

export function searchCities(
  cities: readonly City[],
  query: string,
  limit = CITY_SEARCH_LIMIT,
): City[] {
  const needle = normalise(query);
  if (needle.length < 2) return [];

  const found: { city: City; score: number }[] = [];
  for (const city of cities) {
    const names = [normalise(city.name)];
    if (city.ascii) names.push(normalise(city.ascii));
    let score = -1;
    for (const name of names) {
      if (name.startsWith(needle)) {
        score = 0;
        break;
      }
      if (name.split(/[\s-]+/).some((word) => word.startsWith(needle))) {
        score = 1;
        break;
      }
      if (name.includes(needle)) score = 2;
    }
    if (score < 0) continue;
    found.push({ city, score });
  }

  found.sort((a, b) => a.score - b.score || b.city.population - a.city.population || a.city.name.localeCompare(b.city.name));
  return found.slice(0, limit).map((item) => item.city);
}

/** A readable country name, falling back to the code if the browser cannot name it. */
export function countryName(countryCode: string, locale: string): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    return names.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
