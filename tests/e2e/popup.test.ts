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
    await extension.page.reload();
    await extension.page.getByRole('button', { name: 'Use my location' }).click();
    await extension.page.waitForSelector('.next-card', { timeout: 20_000 });
    await expect(extension.page.locator('.place')).toHaveText('My location');
    await expect(extension.page.locator('.time-row')).toHaveCount(6);

    const stored = await extension.page.evaluate(async () =>
      chrome.storage.local.get('sajdatime.settings.v1'),
    );
    expect(stored['sajdatime.settings.v1']).toBeTruthy();
  } finally {
    await extension.close();
  }
});
