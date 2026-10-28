import { describe, expect, it } from 'vitest';
import { firstSettings } from '../../src/settings/create';
import {
  DEFAULT_ALERTS,
  DEFAULT_SUHOOR_REMINDER,
  isSettings,
  migrateSettings,
} from '../../src/settings/types';

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
  suhoorReminder: DEFAULT_SUHOOR_REMINDER,
  ramadanCard: true,
  theme: 'system',
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
    const reminder = { enabled: false, minutes: 10 };
    expect(isSettings(changed({ alerts: { enabled: 'yes', prayers, sound: 'beep', reminder } }))).toBe(false);
    expect(isSettings(changed({ alerts: { enabled: true, prayers, sound: 'loud', reminder } }))).toBe(false);
    expect(
      isSettings(
        changed({
          alerts: {
            enabled: true,
            prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true },
            sound: 'beep',
            reminder,
          },
        }),
      ),
    ).toBe(false);
    expect(
      isSettings(
        changed({ alerts: { enabled: true, prayers: { ...prayers, sunrise: true }, sound: 'beep', reminder } }),
      ),
    ).toBe(false);
  });

  it('rejects a damaged reminder and accepts the five known minutes', () => {
    const valid = { enabled: false, minutes: 10 };
    expect(isSettings(changed({ alerts: { ...DEFAULT_ALERTS, reminder: { enabled: 'yes', minutes: 10 } } }))).toBe(
      false,
    );
    expect(isSettings(changed({ alerts: { ...DEFAULT_ALERTS, reminder: { enabled: true, minutes: 4 } } }))).toBe(
      false,
    );
    expect(isSettings(changed({ alerts: { ...DEFAULT_ALERTS, reminder: { enabled: true, minutes: 45 } } }))).toBe(
      false,
    );
    for (const minutes of [5, 10, 15, 20, 30]) {
      expect(isSettings(changed({ alerts: { ...DEFAULT_ALERTS, reminder: { enabled: true, minutes } } }))).toBe(true);
    }
    expect(isSettings(changed({ alerts: { ...DEFAULT_ALERTS, reminder: valid } }))).toBe(true);
  });

  it('rejects a damaged suhoor reminder and accepts the four known minutes', () => {
    expect(
      isSettings(changed({ suhoorReminder: { enabled: 'yes', minutes: 30 } })),
    ).toBe(false);
    expect(isSettings(changed({ suhoorReminder: { enabled: true, minutes: 10 } }))).toBe(false);
    expect(isSettings(changed({ suhoorReminder: { enabled: true, minutes: 90 } }))).toBe(false);
    for (const minutes of [15, 30, 45, 60]) {
      expect(isSettings(changed({ suhoorReminder: { enabled: true, minutes } }))).toBe(true);
    }
    expect(isSettings(changed({ suhoorReminder: { enabled: false, minutes: 30 } }))).toBe(true);
  });

  it('rejects a damaged Ramadan card value', () => {
    expect(isSettings(changed({ ramadanCard: 'yes' }))).toBe(false);
    expect(isSettings(changed({ ramadanCard: true }))).toBe(true);
  });

  it('rejects an unknown theme and accepts the three known ones', () => {
    expect(isSettings(changed({ theme: 'sepia' }))).toBe(false);
    expect(isSettings(changed({ theme: 'system' }))).toBe(true);
    expect(isSettings(changed({ theme: 'light' }))).toBe(true);
    expect(isSettings(changed({ theme: 'dark' }))).toBe(true);
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

describe('reminder migration', () => {
  it('adds the default off reminder to an alerts object without one', () => {
    const old = changed({ alerts: { enabled: true, prayers: DEFAULT_ALERTS.prayers, sound: 'beep' } });
    const migrated = migrateSettings(old) as { alerts: { reminder?: unknown } };
    expect(migrated.alerts.reminder).toEqual(DEFAULT_ALERTS.reminder);
  });

  it('keeps a chosen reminder after migration', () => {
    const old = changed({
      alerts: { ...DEFAULT_ALERTS, reminder: { enabled: true, minutes: 20 } },
    });
    const migrated = migrateSettings(old) as { alerts: { reminder: unknown } };
    expect(migrated.alerts.reminder).toEqual({ enabled: true, minutes: 20 });
  });
});

describe('suhoor reminder migration', () => {
  it('adds the default off suhoor reminder to an old setting without one', () => {
    const old = { ...LONDON };
    delete (old as { suhoorReminder?: unknown }).suhoorReminder;
    expect(migrateSettings(old)).toEqual(LONDON);
  });

  it('keeps a chosen suhoor reminder after migration', () => {
    const old = { ...LONDON, suhoorReminder: { enabled: true, minutes: 45 } };
    expect(migrateSettings(old)).toEqual({ ...LONDON, suhoorReminder: { enabled: true, minutes: 45 } });
  });
});

describe('theme migration', () => {
  it('adds System to an old setting without a theme', () => {
    const old = { ...LONDON };
    delete (old as { theme?: unknown }).theme;
    expect(migrateSettings(old)).toEqual(LONDON);
  });

  it('keeps an explicit theme after migration', () => {
    const old = { ...LONDON, theme: 'dark' };
    expect(migrateSettings(old)).toEqual({ ...LONDON, theme: 'dark' });
  });
});

describe('first settings', () => {
  it('uses the Muslim World League when the country is unknown', () => {
    const settings = firstSettings({ ...LONDON.place, countryCode: 'ZZ' });
    expect(settings.method).toBe('mwl');
    expect(settings.place.countryCode).toBe('ZZ');
    expect(settings.alerts).toEqual(DEFAULT_ALERTS);
    expect(settings.alerts.enabled).toBe(false);
    expect(settings.suhoorReminder).toEqual(DEFAULT_SUHOOR_REMINDER);
    expect(settings.ramadanCard).toBe(true);
    expect(settings.theme).toBe('system');
  });

  it('uses the place country when it is known', () => {
    const settings = firstSettings({ ...LONDON.place, countryCode: 'SA' });
    expect(settings.method).toBe('umm-al-qura');
  });
});
