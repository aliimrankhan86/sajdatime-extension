import { expect, test } from '@playwright/test';
import { launchExtension, seedSettings } from './extension';

test('shows the place, the next prayer and all six times', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await expect(extension.page.locator('.place')).toHaveText('London');
    await expect(extension.page.locator('.hijri')).toContainText('Jumada al-Awwal');
    await expect(extension.page.locator('.next-name')).toHaveText('Dhuhr');
    await expect(extension.page.locator('.next-time')).toHaveText('11:45');
    await expect(extension.page.locator('.time-row')).toHaveCount(6);
    await expect(extension.page.locator('[data-slot="fajr"] .time-value')).toHaveText('04:53');
    await expect(extension.page.locator('[data-slot="isha"] .time-value')).toHaveText('18:29');
  } finally {
    await extension.close();
  }
});

test('does not clip the time column when browser zoom shrinks the viewport', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await extension.page.setViewportSize({ width: 253, height: 600 });
    const sizes = await extension.page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(sizes.scroll).toBe(sizes.client);
    await expect(extension.page.locator('[data-slot="fajr"] .time-value')).toBeVisible();
    await extension.page.screenshot({ path: 'docs/images/zoom-253.png' });
  } finally {
    await extension.close();
  }
});

test('counts down without losing the next prayer', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const first = await extension.page.locator('.countdown').innerText();
    await extension.page.waitForTimeout(2_100);
    const second = await extension.page.locator('.countdown').innerText();
    expect(second).not.toBe(first);
    expect(second).toMatch(/\d+ s$/);
    await expect(extension.page.locator('.next-name')).toHaveText('Dhuhr');
  } finally {
    await extension.close();
  }
});

test('uses the browser 12 hour style when its language does', async () => {
  const extension = await launchExtension('en-US');
  try {
    await seedSettings(extension);
    await expect(extension.page.locator('.next-time')).toHaveText(/11:45\s?AM/);
    await expect(extension.page.locator('[data-slot="fajr"] .time-value')).toHaveText(/4:53\s?AM/);
  } finally {
    await extension.close();
  }
});

test('does not mark today for tomorrow Fajr', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T21:00:00Z'));
    await expect(extension.page.locator('.next-name')).toHaveText('Fajr');
    await expect(extension.page.locator('.next-label')).toHaveText('Next prayer, tomorrow');
    await expect(extension.page.locator('.time-row.is-next')).toHaveCount(0);
  } finally {
    await extension.close();
  }
});

test('first run asks for location, then saves the place', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    await extension.page.reload();
    await expect(extension.page.getByRole('button', { name: 'Use my location' })).toBeVisible();

    // The browser's own permission bubble cannot be driven from Playwright for an
    // extension origin, so this test supplies a known fix and checks what we do with it.
    await extension.page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (ok: (position: unknown) => void) =>
            ok({ coords: { latitude: 51.5074, longitude: -0.1278 } }),
        },
      });
    });
    await extension.page.clock.install({ time: new Date('2026-10-27T11:00:00Z') });
    await extension.page.reload();
    await extension.page.getByRole('button', { name: 'Use my location' }).click();
    await extension.page.waitForSelector('.next-card', { timeout: 20_000 });
    await expect(extension.page.locator('.place')).toHaveText('My location');
    await expect(extension.page.locator('.time-row')).toHaveCount(6);
    await expect(extension.page.locator('.next-name')).toHaveText('Dhuhr');
    await expect(extension.page.locator('[data-slot="fajr"] .time-value')).toHaveText('04:53');

    const stored = await extension.page.evaluate(async () =>
      chrome.storage.local.get('sajdatime.settings.v1'),
    );
    expect(stored['sajdatime.settings.v1']).toMatchObject({
      method: 'mwl',
      place: { countryCode: 'ZZ', latitude: 51.51, longitude: -0.13 },
    });
  } finally {
    await extension.close();
  }
});

test('first run offers Makkah when location is refused', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (_ok: unknown, fail: (error: unknown) => void) =>
            fail({ code: 1 }),
        },
      });
    });
    await extension.page.reload();
    await extension.page.getByRole('button', { name: 'Use my location' }).click();

    await expect(extension.page.getByRole('alert')).toContainText('could not read your location');
    const makkah = extension.page.getByRole('button', { name: 'Use Makkah for now' });
    await expect(makkah).toBeVisible();
    await makkah.click();

    await extension.page.waitForSelector('.next-card', { timeout: 20_000 });
    await expect(extension.page.locator('.place')).toHaveText('Makkah');
    await expect(extension.page.locator('.time-row')).toHaveCount(6);
    const stored = await extension.page.evaluate(async () =>
      chrome.storage.local.get('sajdatime.settings.v1'),
    );
    expect(stored['sajdatime.settings.v1']).toMatchObject({
      method: 'umm-al-qura',
      place: { countryCode: 'SA' },
    });
  } finally {
    await extension.close();
  }
});
