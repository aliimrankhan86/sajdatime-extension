import { expect, test } from '@playwright/test';
import { launchExtension, screenshot, seedSettings, setTheme } from './extension';

async function openSettings(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}

async function closeSettings(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Back to times' }).click();
  await expect(page.locator('.next-card')).toBeVisible();
}

test('changing the Asr school changes Asr and survives a reload', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const before = await extension.page.locator('[data-slot="asr"] .time-value').innerText();
    await openSettings(extension.page);
    await extension.page.locator('[data-row="asr"]').click();
    await extension.page.getByRole('button', { name: 'Hanafi' }).click();
    await extension.page.getByRole('button', { name: 'Done' }).click();
    await closeSettings(extension.page);
    const after = await extension.page.locator('[data-slot="asr"] .time-value').innerText();
    expect(after).not.toBe(before);
    await extension.page.reload();
    await expect(extension.page.locator('[data-slot="asr"] .time-value')).toHaveText(after);
    await openSettings(extension.page);
    await extension.page.locator('[data-row="asr"]').click();
    await expect(extension.page.getByRole('button', { name: 'Hanafi' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  } finally {
    await extension.close();
  }
});

test('changing the calculation method changes Fajr', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const before = await extension.page.locator('[data-slot="fajr"] .time-value').innerText();
    await openSettings(extension.page);
    await extension.page.locator('[data-row="method"]').click();
    await extension.page.getByRole('button', { name: 'Umm al-Qura, Makkah' }).click();
    await closeSettings(extension.page);
    const after = await extension.page.locator('[data-slot="fajr"] .time-value').innerText();
    expect(after).not.toBe(before);
  } finally {
    await extension.close();
  }
});

test('changing place in Settings updates the name, times and zone', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await openSettings(extension.page);
    await extension.page.locator('[data-row="place"]').click();
    await expect(extension.page.getByRole('heading', { name: 'Location' })).toBeVisible();
    await extension.page.getByRole('searchbox', { name: 'Or find a place' }).fill('Makkah');
    const result = extension.page.locator('.city-result').filter({ hasText: 'Makkah' }).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(extension.page.locator('[data-row="place"] .row-title')).toHaveText('Makkah');
    await expect(extension.page.locator('[data-row="place"]')).toBeFocused();
    await closeSettings(extension.page);
    await expect(extension.page.locator('.place')).toHaveText('Makkah');
    await expect(extension.page.locator('[data-slot="dhuhr"] .time-value')).toHaveText('12:06');
    const stored = await extension.page.evaluate(async () => {
      const value = await chrome.storage.local.get('sajdatime.settings.v1');
      return value['sajdatime.settings.v1'] as { place: { timeZone: string }; method: string };
    });
    expect(stored.place.timeZone).toBe('Asia/Riyadh');
    expect(stored.method).toBe('mwl');
  } finally {
    await extension.close();
  }
});

test('dark mode keeps every link readable', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await openSettings(extension.page);
    await setTheme(extension.page, 'dark');
    await screenshot(extension.page, 'docs/images/settings-dark.png');

    // The text links live in the Credits sheet.
    await extension.page.locator('[data-row="credits"]').click();
    const link = extension.page.locator('.link').first();
    await link.scrollIntoViewIfNeeded();
    const colours = await link.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, background: getComputedStyle(document.body).backgroundColor };
    });
    const luminance = (value: string) => {
      const channels = value
        .match(/\d+(?:\.\d+)?/g)!
        .slice(0, 3)
        .map((part) => Number(part) / 255)
        .map((part) => (part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4));
      return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
    };
    const [light, dark] = [luminance(colours.color), luminance(colours.background)].sort(
      (a, b) => b - a,
    );
    expect((light! + 0.05) / (dark! + 0.05)).toBeGreaterThanOrEqual(4.5);
  } finally {
    await extension.close();
  }
});

test('keyboard focus enters Settings and returns to its button', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const settings = extension.page.getByRole('button', { name: 'Settings' });
    await extension.page.mouse.click(10, 10);
    // The town chip is the first focusable control, the footer Settings button is second.
    await extension.page.keyboard.press('Tab');
    await expect(extension.page.getByRole('button', { name: 'change location' })).toBeFocused();
    await extension.page.keyboard.press('Tab');
    await expect(settings).toBeFocused();
    await settings.focus();
    await settings.press('Enter');
    const settingsHeading = extension.page.getByRole('heading', { name: 'Settings' });
    await expect(settingsHeading).toBeVisible();
    await expect(settingsHeading).toBeFocused();

    const place = extension.page.locator('[data-row="place"]');
    await place.click();
    const locationHeading = extension.page.getByRole('heading', { name: 'Location' });
    await expect(locationHeading).toBeVisible();
    await expect(locationHeading).toBeFocused();
    await extension.page.keyboard.press('Escape');
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(place).toBeFocused();

    await extension.page.keyboard.press('Escape');
    await expect(extension.page.locator('.next-card')).toBeVisible();
    await expect(settings).toBeFocused();
  } finally {
    await extension.close();
  }
});

test('keyboard focus stays on the control after a save', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await openSettings(extension.page);
    // Preact moves focus to the heading after the next frame. Wait for that before
    // pressing, or the heading can steal focus from the button in a slow run.
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeFocused();

    await extension.page.locator('[data-row="asr"]').click();
    await expect(extension.page.getByRole('heading', { name: 'Asr school' })).toBeFocused();
    const hanafi = extension.page.getByRole('button', { name: 'Hanafi' });
    await hanafi.press('Enter');
    await expect(hanafi).toBeFocused();
    await expect(hanafi).toHaveAttribute('aria-pressed', 'true');
    await extension.page.getByRole('button', { name: 'Done' }).click();

    await extension.page.locator('[data-row="hijri"]').click();
    await expect(extension.page.getByRole('heading', { name: 'Hijri date' })).toBeFocused();
    const later = extension.page.getByRole('button', { name: 'One day later' });
    await later.press('Enter');
    await expect(later).toBeFocused();
    await expect(extension.page.locator('.step-value')).toContainText('+1 day');
  } finally {
    await extension.close();
  }
});
