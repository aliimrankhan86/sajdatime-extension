import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, seedSettings, type Extension } from './extension';

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}

async function seed(page: Page, settings: unknown) {
  await page.evaluate(async (value) => {
    await chrome.storage.local.set({ 'sajdatime.settings.v1': value });
  }, settings);
  await page.reload();
  await page.waitForSelector('.next-card');
}

async function storedSectAndMethod(page: Page) {
  return page.evaluate(async () => {
    const value = await chrome.storage.local.get('sajdatime.settings.v1');
    return value['sajdatime.settings.v1'] as { sect: string; method: string };
  });
}

const LONDON_SHIA_TEHRAN = {
  version: 1,
  place: {
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    timeZone: 'Europe/London',
    countryCode: 'GB',
  },
  sect: 'shia',
  method: 'tehran',
  madhab: 'shafii',
  hijriOffsetDays: 0,
};

test('choosing Shia from a Sunni method saves the Shia suggestion and offers only the Shia pair', async () => {
  const extension: Extension = await launchExtension();
  try {
    await seedSettings(extension); // London, Sunni, MWL
    await openSettings(extension.page);
    await extension.page.getByRole('button', { name: 'Shia' }).click();

    const stored = await storedSectAndMethod(extension.page);
    expect(stored.sect).toBe('shia');
    expect(stored.method).toBe('jafari'); // suggestMethod('GB', 'shia').suggested

    const values = await extension.page
      .locator('#method option')
      .evaluateAll((options) => (options as HTMLOptionElement[]).map((option) => option.value));
    expect(values).toEqual(['jafari', 'tehran']);
  } finally {
    await extension.close();
  }
});

test('choosing Sunni from Jafari saves the country Sunni suggestion', async () => {
  const extension: Extension = await launchExtension();
  try {
    await seed(extension.page, { ...LONDON_SHIA_TEHRAN, method: 'jafari' });
    await openSettings(extension.page);
    await extension.page.getByRole('button', { name: 'Sunni' }).click();

    const stored = await storedSectAndMethod(extension.page);
    expect(stored.sect).toBe('sunni');
    expect(stored.method).toBe('moonsighting'); // suggestMethod('GB', 'sunni').suggested
  } finally {
    await extension.close();
  }
});

test('choosing Shia while already on Tehran keeps Tehran', async () => {
  const extension: Extension = await launchExtension();
  try {
    await seed(extension.page, LONDON_SHIA_TEHRAN);
    await openSettings(extension.page);
    await extension.page.getByRole('button', { name: 'Shia' }).click();

    const stored = await storedSectAndMethod(extension.page);
    expect(stored.sect).toBe('shia');
    expect(stored.method).toBe('tehran');
  } finally {
    await extension.close();
  }
});

test('keyboard focus stays on the pressed school button after the save', async () => {
  const extension: Extension = await launchExtension();
  try {
    await seedSettings(extension);
    await openSettings(extension.page);
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeFocused();

    const shia = extension.page.getByRole('button', { name: 'Shia' });
    await shia.press('Enter');
    await expect(shia).toBeFocused();
    await expect(shia).toHaveAttribute('aria-pressed', 'true');
  } finally {
    await extension.close();
  }
});
