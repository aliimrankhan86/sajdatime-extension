import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCityData, type City } from '../../src/core/cities';
import { cityForLocation, placeFromBrowser } from '../../src/settings/place';

const LEEDS: City = {
  name: 'Leeds',
  countryCode: 'GB',
  latitude: 53.8,
  longitude: -1.55,
  timeZone: 'Europe/London',
  population: 536_280,
};

/** On the equator, so one degree of latitude is a plain 111.19 kilometres. */
const NOWHERE: City = {
  name: 'Nowhere',
  countryCode: 'GB',
  latitude: 0,
  longitude: 0,
  timeZone: 'UTC',
  population: 1,
};

describe('a place from the browser', () => {
  it('takes the city name and country but keeps the browser coordinates', () => {
    expect(placeFromBrowser(53.8049, -1.5491, 'Europe/London', LEEDS)).toEqual({
      name: 'Leeds',
      countryCode: 'GB',
      latitude: 53.8,
      longitude: -1.55,
      timeZone: 'Europe/London',
    });
  });

  it('says Near when the nearest city is more than 50 kilometres away', () => {
    // 0.6 degrees of latitude is about 67 kilometres.
    const place = placeFromBrowser(0.6, 0, 'UTC', NOWHERE);
    expect(place.name).toBe('Near Nowhere');
    expect(place.countryCode).toBe('GB');
  });

  it('keeps the plain name when the city is closer than 50 kilometres', () => {
    // 0.3 degrees of latitude is about 33 kilometres.
    expect(placeFromBrowser(0.3, 0, 'UTC', NOWHERE).name).toBe('Nowhere');
  });

  it('keeps My location when the city list could not be read', () => {
    expect(placeFromBrowser(53.8, -1.55, 'Europe/London', null)).toEqual({
      name: 'My location',
      latitude: 53.8,
      longitude: -1.55,
      timeZone: 'Europe/London',
      countryCode: 'ZZ',
    });
  });
});

/** The list that actually ships, so these tests fail if the file or its format drifts. */
function bundledCities(): City[] {
  const file = readFileSync(new URL('../../public/data/cities.json', import.meta.url), 'utf8');
  return parseCityData(JSON.parse(file));
}

describe('the city a located point is named after', () => {
  const bundled = bundledCities();

  it('names Paris for its centre, not one of its arrondissements', () => {
    expect(cityForLocation(48.8566, 2.3522, bundled)?.name).toBe('Paris');
  });

  it('names Dubai for its centre, not a district of it', () => {
    expect(cityForLocation(25.2048, 55.2708, bundled)?.name).toBe('Dubai');
  });

  it('still names London', () => {
    expect(cityForLocation(51.5074, -0.1278, bundled)?.name).toBe('London');
  });

  it('still names Leeds', () => {
    expect(cityForLocation(53.8, -1.55, bundled)?.name).toBe('Leeds');
  });

  it('keeps the nearest city when nothing is within 15 kilometres', () => {
    const far: City = {
      name: 'Far',
      countryCode: 'GB',
      latitude: 1,
      longitude: 0,
      timeZone: 'UTC',
      population: 1_000,
    };
    const farther: City = {
      name: 'Farther',
      countryCode: 'GB',
      latitude: 2,
      longitude: 0,
      timeZone: 'UTC',
      population: 2_000,
    };
    // One degree of latitude is about 111 kilometres, so neither is within the radius.
    expect(cityForLocation(0, 0, [farther, far])?.name).toBe('Far');
  });
});
