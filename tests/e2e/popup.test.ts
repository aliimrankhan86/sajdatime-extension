import { expect, test } from '@playwright/test';
import { launchExtension, seedSettings } from './extension';
import { countdownLineCount, undersizedControls } from './measures';

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
    const sizes = await extension.page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(sizes.scrollHeight).toBeLessThanOrEqual(sizes.clientHeight);
    await extension.page.screenshot({ path: 'docs/images/times-light.png' });
  } finally {
    await extension.close();
  }
});

test('does not clip the time column at 200 percent zoom', async () => {
  const extension = await launchExtension('en-GB', { deviceScaleFactor: 2 });
  try {
    await seedSettings(extension);

    // Chrome zooms a popup by enlarging its window and keeping 380 CSS pixels, so
    // this test sets deviceScaleFactor 2 rather than shrinking the viewport. The time
    // column must not clip, the countdown must stay on one line, and every control
    // must keep its 44 CSS pixel target.
    const sizes = await extension.page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(sizes.scroll).toBe(sizes.client);
    await expect(extension.page.locator('[data-slot="fajr"] .time-value')).toBeVisible();
    expect(await extension.page.evaluate(countdownLineCount)).toBe(1);
    expect(await undersizedControls(extension.page)).toEqual([]);
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
    await expect(extension.page.locator('.welcome-note')).not.toContainText('keeps your location');
    await expect(extension.page.locator('.welcome-note')).not.toContainText('never leaves');
    await extension.page.screenshot({ path: 'docs/images/first-run-light.png' });

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

test('keeps Settings visible and opens the sheet', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const button = extension.page.getByRole('button', { name: 'Settings' });
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(600);

    await button.click();
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(extension.page.getByRole('heading', { name: 'Place' })).toBeVisible();
    await extension.page.screenshot({ path: 'docs/images/settings-light.png' });
  } finally {
    await extension.close();
  }
});

test('first run lets someone find a town by name', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    await extension.page.reload();

    const search = extension.page.getByRole('searchbox', { name: 'Or find a place' });
    await search.fill('London');
    const result = extension.page.locator('.city-result').filter({ hasText: 'London' }).first();
    await expect(result).toBeVisible();
    await result.click();

    await expect(extension.page.locator('.place')).toHaveText('London');
    await expect(extension.page.locator('.time-row')).toHaveCount(6);
    await expect(extension.page.getByRole('button', { name: 'Settings' })).toBeVisible();
  } finally {
    await extension.close();
  }
});

test('saves a calculation method chosen in Settings', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await extension.page.locator('#method').selectOption('umm-al-qura');
    await expect(extension.page.locator('#method')).toHaveValue('umm-al-qura');
    const stored = await extension.page.evaluate(async () => {
      const value = await chrome.storage.local.get('sajdatime.settings.v1');
      return value['sajdatime.settings.v1'] as { method: string };
    });
    expect(stored.method).toBe('umm-al-qura');
  } finally {
    await extension.close();
  }
});
