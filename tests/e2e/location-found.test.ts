import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, screenshot, seedSettings } from './extension';

/** Leeds, because the bundled city list names it and its country is GB. */
const LEEDS = { latitude: 53.8, longitude: -1.55 };

/**
 * The browser's own permission bubble cannot be driven from Playwright for an extension
 * origin, so the fix is supplied through navigator.geolocation, as the other tests do.
 */
async function mockPosition(page: Page, coords = LEEDS) {
  await page.addInitScript((fix) => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: (position: unknown) => void) => ok({ coords: fix }),
      },
    });
  }, coords);
}

test('the Location sheet confirms the town and Done goes back to Settings', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await mockPosition(extension.page);
    await extension.page.reload();
    await expect(extension.page.locator('.place')).toHaveText('London');

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await extension.page.getByRole('button', { name: 'Change' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Location' })).toBeVisible();

    // The same confirmation as the first run, with Done in place of Continue, and the
    // sheet header still above it so Close and Escape keep working.
    await extension.page.getByRole('button', { name: 'Use my location' }).click();
    const panel = extension.page.getByRole('status');
    await expect(panel.getByRole('heading', { name: 'Location found' })).toBeVisible();
    await expect(panel).toContainText('Leeds, United Kingdom');
    await expect(panel).toContainText('Your prayer times are now for this place.');
    const done = panel.getByRole('button', { name: 'Done' });
    await expect(done).toBeFocused();
    await screenshot(extension.page, 'docs/images/location-found-settings-light.png');

    await done.click();
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(extension.page.locator('.setting-title')).toHaveText('Leeds');
    await expect(extension.page.getByRole('button', { name: 'Change' })).toBeFocused();

    const stored = await extension.page.evaluate(async () =>
      chrome.storage.local.get('sajdatime.settings.v1'),
    );
    expect(stored['sajdatime.settings.v1']).toMatchObject({
      place: {
        name: 'Leeds',
        countryCode: 'GB',
        latitude: 53.8,
        longitude: -1.55,
        timeZone: 'Europe/London',
      },
    });
  } finally {
    await extension.close();
  }
});

test('a city list that will not load still saves My location and goes on', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    let blocked = 0;
    await extension.page.route('**/data/cities.json', (route) => {
      blocked += 1;
      return route.abort();
    });
    await mockPosition(extension.page);
    await extension.page.reload();

    await extension.page.getByRole('button', { name: 'Use my location' }).click();
    const panel = extension.page.getByRole('status');
    await expect(panel.getByRole('heading', { name: 'Location found' })).toBeVisible();
    await expect(panel).toContainText('My location');
    await panel.getByRole('button', { name: 'Continue' }).click();

    await extension.page.waitForSelector('.next-card', { timeout: 20_000 });
    await expect(extension.page.locator('.place')).toHaveText('My location');
    await expect(extension.page.locator('.time-row')).toHaveCount(6);

    // Without this the test could pass because the list loaded after all.
    expect(blocked).toBeGreaterThan(0);
    const stored = await extension.page.evaluate(async () =>
      chrome.storage.local.get('sajdatime.settings.v1'),
    );
    expect(stored['sajdatime.settings.v1']).toMatchObject({
      method: 'mwl',
      place: { countryCode: 'ZZ', latitude: 53.8, longitude: -1.55 },
    });
  } finally {
    await extension.close();
  }
});
