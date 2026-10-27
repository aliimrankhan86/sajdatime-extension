import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nearestCity, parseCityData, preferredCityName, type City } from '../../src/core/cities';
import { placeFromBrowser } from '../../src/settings/place';

const LEEDS: City = {
  name: 'Leeds',
  countryCode: 'GB',
  latitude: 53.8,
  longitude: -1.55,
  timeZone: 'Europe/London',
  population: 536_280,
  section: false,
};

/** On the equator, so one degree of latitude is a plain 111.19 kilometres. */
const NOWHERE: City = {
  name: 'Nowhere',
  countryCode: 'GB',
  latitude: 0,
  longitude: 0,
  timeZone: 'UTC',
  population: 1,
  section: false,
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

  /** The name the shipped rule gives a point, after promoting a district to its city. */
  function nameFor(latitude: number, longitude: number): string | undefined {
    const nearest = nearestCity(latitude, longitude, bundled);
    return nearest ? preferredCityName(nearest, latitude, longitude, bundled) : undefined;
  }

  it('names London', () => {
    expect(nameFor(51.5074, -0.1278)).toBe('London');
  });

  it('names Leeds', () => {
    expect(nameFor(53.8008, -1.5491)).toBe('Leeds');
  });

  it('names Bradford, not the larger nearby Leeds', () => {
    expect(nameFor(53.7939, -1.7521)).toBe('Bradford');
  });

  it('names Dewsbury', () => {
    expect(nameFor(53.6908, -1.6291)).toBe('Dewsbury');
  });

  it('names Paris, not the arrondissement', () => {
    expect(nameFor(48.8566, 2.3522)).toBe('Paris');
  });

  it('names Dubai, not the Bur Dubai district', () => {
    expect(nameFor(25.2048, 55.2708)).toBe('Dubai');
  });

  it('names Kehl in Germany, not Strasbourg across the Rhine', () => {
    expect(nearestCity(48.5726, 7.8146, bundled)?.countryCode).toBe('DE');
    expect(nameFor(48.5726, 7.8146)).toBe('Kehl');
  });

  it('names Ilford, not London, because London is not a word inside Ilford', () => {
    expect(nameFor(51.55765, 0.07278)).toBe('Ilford');
  });
});
