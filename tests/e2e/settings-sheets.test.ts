import { expect, test } from '@playwright/test';
import { LONDON, launchExtension, screenshot, seedSettings, setTheme } from './extension';

/**
 * Every Settings row opens a sheet, the sheet takes focus, Escape closes it, and
 * focus returns to the row that opened it. This is the Step 6 done-when for the
 * keyboard, and it doubles as the screenshot pass: with SAJDATIME_SCREENSHOTS=1 it
 * writes one image per sheet in light and dark to docs/images.
 */

const SHEETS = [
  { row: 'disclaimer', title: 'Disclaimer', file: 'sheet-disclaimer' },
  { row: 'school', title: 'School', file: 'sheet-school' },
  { row: 'asr', title: 'Asr school', file: 'sheet-asr' },
  { row: 'method', title: 'Calculation method', file: 'sheet-method' },
  { row: 'hijri', title: 'Hijri date', file: 'sheet-hijri' },
  { row: 'sound', title: 'Sound', file: 'sheet-sound' },
  { row: 'theme', title: 'Theme', file: 'sheet-theme' },
  { row: 'credits', title: 'Credits', file: 'sheet-credits' },
] as const;

test('every Settings row opens its sheet, Escape closes, and focus returns', async () => {
  const extension = await launchExtension();
  const page = extension.page;
  try {
    // Alerts on, so the Sound row (and its sheet) is rendered.
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true },
    });
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    for (const sheet of SHEETS) {
      await setTheme(page, 'light');
      const row = page.locator(`[data-row="${sheet.row}"]`);
      await row.click();
      const heading = page.getByRole('heading', { name: sheet.title });
      await expect(heading).toBeVisible();
      await expect(heading).toBeFocused();
      await screenshot(page, `docs/images/${sheet.file}-light.png`, { fullPage: true });

      await setTheme(page, 'dark');
      await screenshot(page, `docs/images/${sheet.file}-dark.png`, { fullPage: true });

      await page.keyboard.press('Escape');
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
      await expect(row).toBeFocused();
    }
  } finally {
    await extension.close();
  }
});
