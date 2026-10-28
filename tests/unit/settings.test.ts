import { describe, expect, it } from 'vitest';
import { firstSettings } from '../../src/settings/create';
import { DEFAULT_ALERTS, isSettings, migrateSettings } from '../../src/settings/types';

const LONDON = {
  version: 1,
  place: {
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    timeZone: 'Europe/London',
    countryCode: 'GB',
  },
  sect: 'sunni',
  method: 'mwl',
  madhab: 'shafii',
  hijriOffsetDays: 0,
  alerts: DEFAULT_ALERTS,
  ramadanCard: true,
} as const;

function changed(overrides: Record<string, unknown>): unknown {
  return { ...LONDON, ...overrides };
}

describe('stored settings', () => {
  it('accepts a complete, known setting', () => {
    expect(isSettings(LONDON)).toBe(true);
  });

  it('rejects an unknown calculation method instead of crashing the popup', () => {
    expect(isSettings(changed({ method: 'not-a-method' }))).toBe(false);
  });

  it('rejects coordinates outside the world', () => {
    expect(
      isSettings({
        ...LONDON,
        place: { ...LONDON.place, latitude: 91 },
      }),
    ).toBe(false);
  });

  it('rejects a place name longer than 200 characters', () => {
    expect(isSettings({ ...LONDON, place: { ...LONDON.place, name: 'a'.repeat(201) } })).toBe(false);
    expect(isSettings({ ...LONDON, place: { ...LONDON.place, name: 'a'.repeat(200) } })).toBe(true);
  });

  it('rejects a time zone the browser does not know', () => {
    expect(
      isSettings({
        ...LONDON,
        place: { ...LONDON.place, timeZone: 'Mars/Olympus_Mons' },
      }),
    ).toBe(false);
  });

  it('rejects a Hijri shift outside the three day range the settings offer', () => {
    expect(isSettings(changed({ hijriOffsetDays: 3 }))).toBe(false);
    expect(isSettings(changed({ hijriOffsetDays: -3 }))).toBe(false);
  });

  it('rejects a damaged alerts object', () => {
    const prayers = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
    expect(isSettings(changed({ alerts: { enabled: 'yes', prayers, sound: 'beep' } }))).toBe(false);
    expect(isSettings(changed({ alerts: { enabled: true, prayers, sound: 'loud' } }))).toBe(false);
    expect(
      isSettings(
        changed({
          alerts: { enabled: true, prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true }, sound: 'beep' },
        }),
      ),
    ).toBe(false);
    expect(
      isSettings(changed({ alerts: { enabled: true, prayers: { ...prayers, sunrise: true }, sound: 'beep' } })),
    ).toBe(false);
  });

  it('rejects a damaged Ramadan card value', () => {
    expect(isSettings(changed({ ramadanCard: 'yes' }))).toBe(false);
    expect(isSettings(changed({ ramadanCard: true }))).toBe(true);
  });
});

describe('alerts migration', () => {
  it('adds the default alerts to an old setting without one', () => {
    const old = { ...LONDON };
    delete (old as { alerts?: unknown }).alerts;
    expect(migrateSettings(old)).toEqual(LONDON);
  });

  it('leaves a setting that already has alerts unchanged', () => {
    expect(migrateSettings(LONDON)).toBe(LONDON);
  });
});

describe('ramadan card migration', () => {
  it('adds the default Ramadan card to an old setting without one', () => {
    const old = { ...LONDON };
    delete (old as { ramadanCard?: unknown }).ramadanCard;
    expect(migrateSettings(old)).toEqual(LONDON);
  });

  it('keeps an off Ramadan card off after migration', () => {
    const old = { ...LONDON, ramadanCard: false };
    delete (old as { alerts?: unknown }).alerts;
    expect(migrateSettings(old)).toEqual({ ...LONDON, ramadanCard: false });
  });
});

describe('first settings', () => {
  it('uses the Muslim World League when the country is unknown', () => {
    const settings = firstSettings({ ...LONDON.place, countryCode: 'ZZ' });
    expect(settings.method).toBe('mwl');
    expect(settings.place.countryCode).toBe('ZZ');
    expect(settings.alerts).toEqual(DEFAULT_ALERTS);
    expect(settings.alerts.enabled).toBe(false);
    expect(settings.ramadanCard).toBe(true);
  });

  it('uses the place country when it is known', () => {
    const settings = firstSettings({ ...LONDON.place, countryCode: 'SA' });
    expect(settings.method).toBe('umm-al-qura');
  });
});
