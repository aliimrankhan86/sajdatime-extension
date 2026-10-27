import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  countryName,
  distanceKm,
  nearestCity,
  parseCityData,
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
): City => ({ name, countryCode, latitude, longitude, population, timeZone });

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
      cities: [['London', 0, 0, 51.5074, -0.1278, 0, 8_961_989]],
    });
    expect(parsed).toEqual([
      {
        name: 'London',
        countryCode: 'GB',
        latitude: 51.51,
        longitude: -0.13,
        timeZone: 'Europe/London',
        population: 8_961_989,
      },
    ]);
  });

  it('rejects a row that points at a missing table entry', () => {
    expect(() =>
      parseCityData({
        timeZones: [],
        countries: ['GB'],
        cities: [['London', 0, 0, 51.5, -0.13, 0, 1]],
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

  it('returns nothing for an empty list', () => {
    expect(nearestCity(51.5, -0.13, [])).toBeNull();
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
