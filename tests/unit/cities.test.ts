import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  countryName,
  distanceKm,
  nearestCity,
  parseCityData,
  preferredCityName,
  roundCoordinate,
  searchCities,
  type City,
} from '../../src/core/cities';

const city = (
  name: string,
  countryCode: string,
  latitude: number,
  longitude: number,
  population: number,
  timeZone = 'Europe/London',
): City => ({ name, countryCode, latitude, longitude, population, timeZone, section: false });

const cities = [
  city('London', 'GB', 51.5074, -0.1278, 8_961_989),
  city('Londonderry', 'GB', 54.9967, -7.3086, 83_652),
  city('New London', 'US', 41.3557, -72.0995, 27_000, 'America/New_York'),
  city('Londrina', 'BR', -23.3103, -51.1628, 575_377, 'America/Sao_Paulo'),
];

describe('city search', () => {
  it('puts a name that starts with the query before one that contains it', () => {
    expect(searchCities(cities, 'london').map((item) => item.name)).toEqual([
      'London',
      'Londonderry',
      'New London',
    ]);
  });

  it('prefers the larger place when the match is equally good', () => {
    const towns = [
      city('Birmingham', 'GB', 52.4862, -1.8904, 1_144_919),
      city('Birmingham', 'US', 33.5207, -86.8025, 200_733, 'America/Chicago'),
    ];
    expect(searchCities(towns, 'birming')[0]?.countryCode).toBe('GB');
  });

  it('ignores accents and case', () => {
    expect(searchCities([city('Málaga', 'ES', 36.7213, -4.4214, 578_460, 'Europe/Madrid')], 'malaga')).toHaveLength(1);
  });

  it('searches the Latin name for a city in another script', () => {
    const moscow: City = {
      name: 'Москва',
      ascii: 'Moscow',
      countryCode: 'RU',
      latitude: 55.7558,
      longitude: 37.6173,
      population: 10_381_222,
      timeZone: 'Europe/Moscow',
      section: false,
    };
    expect(searchCities([moscow], 'moscow').map((item) => item.name)).toEqual(['Москва']);
  });

  it('waits for two letters', () => {
    expect(searchCities(cities, 'l')).toEqual([]);
  });

  it('returns no more than the limit', () => {
    expect(searchCities(cities, 'london', 2)).toHaveLength(2);
  });
});

describe('city file', () => {
  it('reads the compact tuple format', () => {
    const parsed = parseCityData({
      timeZones: ['Europe/London'],
      countries: ['GB'],
      cities: [['London', 0, 0, 51.5074, -0.1278, 0, 8_961_989, 0]],
    });
    expect(parsed).toEqual([
      {
        name: 'London',
        countryCode: 'GB',
        latitude: 51.51,
        longitude: -0.13,
        timeZone: 'Europe/London',
        population: 8_961_989,
        section: false,
      },
    ]);
  });

  it('reads a section flag from the tuple', () => {
    const parsed = parseCityData({
      timeZones: ['America/New_York'],
      countries: ['US'],
      cities: [['Bushwick', 0, 0, 40.6943, -73.9188, 0, 112_620, 1]],
    });
    expect(parsed[0]?.section).toBe(true);
  });

  it('rejects a row that points at a missing table entry', () => {
    expect(() =>
      parseCityData({
        timeZones: [],
        countries: ['GB'],
        cities: [['London', 0, 0, 51.5, -0.13, 0, 1, 0]],
      }),
    ).toThrow(/missing table row/i);
  });

  it('rounds coordinates to about one kilometre', () => {
    expect(roundCoordinate(51.50735)).toBe(51.51);
    expect(roundCoordinate(-0.1278)).toBe(-0.13);
  });
});

describe('country names', () => {
  it('names a country in the browser language', () => {
    expect(countryName('GB', 'en-GB')).toBe('United Kingdom');
  });

  it('falls back to the code', () => {
    expect(countryName('ZZ', 'en-GB')).toBe('Unknown Region');
  });
});

/** The list that actually ships, so these tests fail if the file or its format drifts. */
function bundledCities(): City[] {
  const file = readFileSync(new URL('../../public/data/cities.json', import.meta.url), 'utf8');
  return parseCityData(JSON.parse(file));
}

describe('nearest city', () => {
  const bundled = bundledCities();

  it('names Leeds for a position in Leeds', () => {
    const nearest = nearestCity(53.8, -1.55, bundled);
    expect(nearest?.name).toBe('Leeds');
    expect(nearest?.countryCode).toBe('GB');
  });

  it('names a city in the right country for a position in Karachi', () => {
    expect(nearestCity(24.86, 67.01, bundled)?.countryCode).toBe('PK');
  });

  it('picks the closer of two cities', () => {
    const near = city('Nearby', 'GB', 51.5, -0.1, 1_000);
    const far = city('Faraway', 'GB', 40, -3, 2_000);
    expect(nearestCity(51.51, -0.12, [far, near])?.name).toBe('Nearby');
  });

  it('skips a section of a city to name the city itself', () => {
    const paris = city('Paris', 'FR', 48.8534, 2.3488, 2_138_551, 'Europe/Paris');
    const arrondissement = {
      ...city('Paris 04 Hôtel-de-Ville', 'FR', 48.8601, 2.3507, 27_332, 'Europe/Paris'),
      section: true,
    };
    expect(nearestCity(48.8566, 2.3522, [arrondissement, paris])?.name).toBe('Paris');
  });

  it('returns nothing for an empty list', () => {
    expect(nearestCity(51.5, -0.13, [])).toBeNull();
  });
});

describe('preferred city name', () => {
  it('promotes a district to the larger city whose name is a whole word inside it', () => {
    const burDubai = city('Bur Dubai', 'AE', 25.2604, 55.2989, 18_698, 'Asia/Dubai');
    const dubai = city('Dubai', 'AE', 25.0773, 55.3093, 1_137_347, 'Asia/Dubai');
    expect(preferredCityName(burDubai, 25.2048, 55.2708, [burDubai, dubai])).toBe('Dubai');
  });

  it('keeps the district when the larger name is only a substring, not a word', () => {
    const dubailand = city('Dubailand', 'AE', 25.2, 55.3, 5_000, 'Asia/Dubai');
    const dubai = city('Dubai', 'AE', 25.0773, 55.3093, 1_137_347, 'Asia/Dubai');
    expect(preferredCityName(dubailand, 25.2, 55.3, [dubailand, dubai])).toBe('Dubailand');
  });

  it('keeps the district when the larger city is in another country', () => {
    const kehl = city('Kehl', 'DE', 48.5726, 7.8146, 35_000, 'Europe/Berlin');
    const strasbourg = city('Strasbourg', 'FR', 48.5839, 7.7455, 280_966, 'Europe/Paris');
    expect(preferredCityName(kehl, 48.5726, 7.8146, [kehl, strasbourg])).toBe('Kehl');
  });

  it('keeps the district when the larger city is fewer than ten times its size', () => {
    const northTown = city('North Town', 'GB', 51.5, -0.1, 20_000);
    const town = city('Town', 'GB', 51.51, -0.12, 150_000);
    expect(preferredCityName(northTown, 51.5, -0.1, [northTown, town])).toBe('North Town');
  });

  it('keeps the district when the larger city is more than 20 kilometres away', () => {
    const eastDistrict = city('East District', 'GB', 51.5, -0.1, 10_000);
    const district = city('District', 'GB', 51.5, 0.3, 1_000_000);
    expect(preferredCityName(eastDistrict, 51.5, -0.1, [eastDistrict, district])).toBe('East District');
  });
});

describe('great circle distance', () => {
  it('measures one degree of latitude as about 111 kilometres', () => {
    expect(distanceKm(0, 0, 1, 0)).toBeCloseTo(111.19, 0);
  });

  it('measures London to Leeds as about 270 kilometres', () => {
    const distance = distanceKm(51.5074, -0.1278, 53.8, -1.55);
    expect(distance).toBeGreaterThan(260);
    expect(distance).toBeLessThan(280);
  });
});
