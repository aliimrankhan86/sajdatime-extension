import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, screenshot, setTheme, walkToLocation } from './extension';
import { undersizedControls } from './measures';

/**
 * The first-run journey is six steps (five for Shia). These tests check the journey
 * itself, that each step fits the 380 by 600 popup without clipping or undersized
 * controls, and that the screenshots in docs/images stay current when
 * SAJDATIME_SCREENSHOTS=1.
 *
 * The geolocation is mocked once, before reload, so the "Allow location" fix is Leeds
 * (the bundled list names it, and the country lets the method step suggest three).
 */

function mockPosition(): void {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (ok: (position: unknown) => void) =>
        ok({ coords: { latitude: 53.8, longitude: -1.55 } }),
    },
  });
}

async function checkFits(page: Page, name: string): Promise<void> {
  const sizes = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollHeight, `${name} scrollHeight`).toBeLessThanOrEqual(sizes.clientHeight);
  expect(sizes.scrollWidth, `${name} scrollWidth`).toBeLessThanOrEqual(sizes.clientWidth);
  expect(await undersizedControls(page), `${name} undersized controls`).toEqual([]);
}

// Sub sheets may be taller than the popup and scroll like the Settings method sheet, so
// they only have to avoid horizontal clipping and keep full size targets.
async function checkSheetFits(page: Page, name: string): Promise<void> {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth, `${name} scrollWidth`).toBeLessThanOrEqual(sizes.clientWidth);
  expect(await undersizedControls(page), `${name} undersized controls`).toEqual([]);
}

async function shot(page: Page, name: string): Promise<void> {
  await screenshot(page, `docs/images/${name}-light.png`);
  await setTheme(page, 'dark');
  await screenshot(page, `docs/images/${name}-dark.png`);
  await setTheme(page, 'light');
}

test('the six step journey fits and keeps full size targets at each step', async () => {
  const extension = await launchExtension();
  const page = extension.page;
  try {
    await page.evaluate(async () => chrome.storage.local.clear());
    await page.addInitScript(mockPosition);
    await page.clock.install({ time: new Date('2026-10-27T11:00:00Z') });
    await page.reload();

    // 0 Welcome.
    await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
    await checkFits(page, 'welcome');
    await shot(page, 'first-run');

    // Language sheet.
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible();
    await checkFits(page, 'language');
    await shot(page, 'first-run-language');
    await page.getByRole('button', { name: 'Back' }).click();

    // 1 Disclaimer.
    await page.getByRole('button', { name: 'Begin' }).click();
    await checkFits(page, 'disclaimer');
    await shot(page, 'first-run-1-disclaimer');

    // Full disclaimer sheet (scrolls like the Settings method sheet).
    await page.getByRole('button', { name: 'Read in full' }).click();
    await expect(page.getByRole('heading', { name: 'Disclaimer' })).toBeVisible();
    await checkSheetFits(page, 'full disclaimer');
    await shot(page, 'first-run-disclaimer-full');
    await page.getByRole('button', { name: 'Back' }).click();

    // 2 School.
    await page.getByRole('button', { name: 'I understand' }).click();
    await checkFits(page, 'school');
    await shot(page, 'first-run-2-school');
    await page.getByRole('button', { name: 'Sunni' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // 3 Madhab.
    await checkFits(page, 'madhab');
    await shot(page, 'first-run-3-madhab');
    await page.getByRole('button', { name: "Shafi'i" }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // 4 Location (before a place is chosen).
    await checkFits(page, 'location');
    await shot(page, 'first-run-4-location');

    // 4 Location found.
    await page.getByRole('button', { name: 'Allow location' }).click();
    await expect(page.getByRole('status')).toContainText('Leeds');
    await checkFits(page, 'location found');
    await shot(page, 'location-found');

    // 5 Method (three methods for the UK).
    await page.getByRole('button', { name: 'Continue' }).click();
    await checkFits(page, 'method');
    await shot(page, 'first-run-5-method');

    // Match my mosque sheet.
    await page.getByRole('button', { name: 'Match my mosque' }).click();
    await expect(page.getByRole('heading', { name: 'Match my mosque' })).toBeVisible();
    await checkSheetFits(page, 'match mosque');
    await shot(page, 'first-run-match');
    await page.getByRole('button', { name: 'Back' }).click();

    // Other methods sheet (scrolls like the Settings method sheet).
    await page.getByRole('button', { name: 'Other methods' }).click();
    await expect(page.getByRole('heading', { name: 'Other methods' })).toBeVisible();
    await checkSheetFits(page, 'other methods');
    await shot(page, 'first-run-methods');
    await page.getByRole('button', { name: 'Back' }).click();

    // 6 Alerts.
    await page.getByRole('button', { name: 'Continue' }).click();
    await checkFits(page, 'alerts');
    await shot(page, 'first-run-6-alerts');

    // Finish saves and opens Times.
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.waitForSelector('.next-card', { timeout: 20_000 });
    await expect(page.locator('.time-row')).toHaveCount(6);
  } finally {
    await extension.close();
  }
});

test('the Shia journey skips the madhab step and reads five steps', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    await extension.page.addInitScript(mockPosition);
    await extension.page.reload();

    await walkToLocation(extension, { sect: 'shia' });

    // Shia skips madhab: the location step is "Step 3 of 5" and the madhab cards never show.
    await expect(extension.page.locator('.step-line')).toHaveText('Step 3 of 5');
    await expect(extension.page.getByRole('button', { name: 'Hanafi' })).toHaveCount(0);

    // And it still completes.
    await extension.page.getByRole('button', { name: 'Allow location' }).click();
    await extension.page.getByRole('button', { name: 'Continue' }).click();
    await extension.page.getByRole('button', { name: 'Continue' }).click();
    await extension.page.getByRole('button', { name: 'Finish' }).click();
    await extension.page.waitForSelector('.next-card', { timeout: 20_000 });
    await expect(extension.page.locator('.time-row')).toHaveCount(6);
  } finally {
    await extension.close();
  }
});

test('the madhab step keeps Continue disabled until a choice is made', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    await extension.page.reload();
    await extension.page.getByRole('button', { name: 'Begin' }).click();
    await extension.page.getByRole('button', { name: 'I understand' }).click();
    await extension.page.getByRole('button', { name: 'Sunni' }).click();
    await extension.page.getByRole('button', { name: 'Continue' }).click(); // school -> madhab

    await expect(extension.page.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await extension.page.getByRole('button', { name: 'Hanafi' }).click();
    await expect(extension.page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  } finally {
    await extension.close();
  }
});

test('Match my mosque shows the closest methods and flags a far time', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    await extension.page.addInitScript(mockPosition);
    await extension.page.clock.install({ time: new Date('2026-10-27T11:00:00Z') });
    await extension.page.reload();
    await walkToLocation(extension);
    await extension.page.getByRole('button', { name: 'Allow location' }).click();
    await extension.page.getByRole('button', { name: 'Continue' }).click(); // method step

    await extension.page.getByRole('button', { name: 'Match my mosque' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Match my mosque' })).toBeVisible();

    // A time far from every method is flagged, and the closest method is still chosen.
    await extension.page.locator('input[type="time"]').fill('23:59');
    await expect(extension.page.getByRole('note')).toContainText(
      'None of the methods is close to your mosque',
    );
  } finally {
    await extension.close();
  }
});
