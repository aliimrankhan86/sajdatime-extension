import { describe, expect, it } from 'vitest';
import type { City } from '../../src/core/cities';
import { placeFromBrowser } from '../../src/settings/place';

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
