import { expect, test } from '@playwright/test';
import { launchExtension, seedSettings } from './extension';

async function openSettings(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}

async function closeSettings(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.locator('.next-card')).toBeVisible();
}

test('changing the Asr school changes Asr and survives a reload', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const before = await extension.page.locator('[data-slot="asr"] .time-value').innerText();
    await openSettings(extension.page);
    await extension.page.getByRole('button', { name: 'Hanafi' }).click();
    await closeSettings(extension.page);
    const after = await extension.page.locator('[data-slot="asr"] .time-value').innerText();
    expect(after).not.toBe(before);
    await extension.page.reload();
    await expect(extension.page.locator('[data-slot="asr"] .time-value')).toHaveText(after);
    await openSettings(extension.page);
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
    await extension.page.locator('#method').selectOption('umm-al-qura');
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
    await extension.page.getByRole('button', { name: 'Change' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Location' })).toBeVisible();
    await extension.page.getByRole('searchbox', { name: 'Or find a place' }).fill('Makkah');
    const result = extension.page.locator('.city-result').filter({ hasText: 'Makkah' }).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(extension.page.locator('.setting-title')).toHaveText('Makkah');
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
    await extension.page.emulateMedia({ colorScheme: 'dark' });
    await extension.page.reload();
    await openSettings(extension.page);
    const privacy = extension.page.getByRole('link', { name: 'Privacy policy' });
    await privacy.scrollIntoViewIfNeeded();
    const colours = await privacy.evaluate((element) => {
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
    await extension.page.screenshot({ path: 'docs/images/settings-dark.png' });
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
    await extension.page.keyboard.press('Tab');
    await expect(settings).toBeFocused();
    await settings.focus();
    await settings.press('Enter');
    const settingsHeading = extension.page.getByRole('heading', { name: 'Settings' });
    await expect(settingsHeading).toBeVisible();
    await expect(settingsHeading).toBeFocused();

    const change = extension.page.getByRole('button', { name: 'Change' });
    await change.click();
    const locationHeading = extension.page.getByRole('heading', { name: 'Location' });
    await expect(locationHeading).toBeVisible();
    await expect(locationHeading).toBeFocused();
    await extension.page.keyboard.press('Escape');
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(change).toBeFocused();

    await extension.page.keyboard.press('Escape');
    await expect(extension.page.locator('.next-card')).toBeVisible();
    await expect(settings).toBeFocused();
  } finally {
    await extension.close();
  }
});
