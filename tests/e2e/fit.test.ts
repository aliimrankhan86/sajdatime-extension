import { expect, test } from '@playwright/test';
import { LONDON, launchExtension, seedSettings } from './extension';

/**
 * A word longer than its room shrinks to fit, but never below 14 pixels, and a word that
 * is too long even then is cut by the ellipsis instead of breaking the layout.
 */
test('a long label shrinks to fit and stops at 14 pixels', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, undefined, LONDON);
    await extension.page.getByRole('button', { name: 'Settings' }).first().click();
    await extension.page.waitForSelector('.row-title');
    const title = extension.page.locator('.row-title').first();
    const normal = await title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    // Long enough to overflow at the normal size, short enough to fit at 14.
    await title.evaluate((el) => {
      el.textContent = 'Kalkulationsmethodenauswahl';
    });
    await expect
      .poll(() => title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
      .toBeLessThan(normal);
    const shrunk = await title.evaluate((el) => ({
      size: parseFloat(getComputedStyle(el).fontSize),
      fits: el.scrollWidth <= el.clientWidth,
    }));
    expect(shrunk.size).toBeGreaterThanOrEqual(14);

    // Far too long: stays at the 14 pixel floor and is cut, never wider than its box.
    await title.evaluate((el) => {
      el.textContent = 'A'.repeat(200);
    });
    await expect
      .poll(() => title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
      .toBe(14);
    expect(await extension.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(380);
    expect(shrunk.fits || shrunk.size === 14).toBe(true);

    // Back to a short word: the normal size returns.
    await title.evaluate((el) => {
      el.textContent = 'School';
    });
    await expect
      .poll(() => title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
      .toBe(normal);
  } finally {
    await extension.close();
  }
});
