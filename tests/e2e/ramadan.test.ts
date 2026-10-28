import { expect, test } from '@playwright/test';
import { launchExtension, LONDON, screenshot, seedSettings } from './extension';

// Ramadan 1448 runs from 8 February to 8 March 2027 (29 days). Day 13 is
// 20 February 2027, the date these tests seed so the labels are visible.

test('inside Ramadan the hero and rows change to suhoor and iftar', async () => {
  const extension = await launchExtension();
  try {
    // 16:00 in London is between Asr and Maghrib, so Maghrib is next.
    await seedSettings(extension, new Date('2027-02-20T16:00:00Z'), LONDON);
    await expect(extension.page.locator('.next-name')).toHaveText('Iftar');
    await expect(extension.page.locator('.countdown-note')).toHaveText('until you break your fast');
    await expect(extension.page.locator('[data-slot="fajr"] .time-label')).toContainText('Suhoor ends');
    await expect(extension.page.locator('[data-slot="maghrib"] .time-label')).toContainText('Iftar');
    // The Hijri date already reads "13 Ramadan 1448", so "Ramadan" appears once in the header.
    await expect(extension.page.locator('.hijri')).toHaveText('13 Ramadan 1448');
    const headerRamadanMentions = await extension.page.locator('.hero').evaluate((el) => {
      const text = el.textContent ?? '';
      return (text.match(/Ramadan/g) ?? []).length;
    });
    expect(headerRamadanMentions).toBe(1);

    // The Times view must still fit the 600 pixel popup.
    const sizes = await extension.page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(sizes.scrollHeight).toBeLessThanOrEqual(sizes.clientHeight);

    await screenshot(extension.page, 'docs/images/times-ramadan-light.png');
    await extension.page.emulateMedia({ colorScheme: 'dark' });
    await screenshot(extension.page, 'docs/images/times-ramadan-dark.png');
  } finally {
    await extension.close();
  }
});

test('after Isha in Ramadan the hero says Suhoor ends', async () => {
  const extension = await launchExtension();
  try {
    // 21:00 in London is after Isha, so tomorrow's Fajr is next.
    await seedSettings(extension, new Date('2027-02-20T21:00:00Z'), LONDON);
    await expect(extension.page.locator('.next-name')).toHaveText('Suhoor ends');
    await expect(extension.page.locator('.countdown-note')).toHaveText('until suhoor ends');
  } finally {
    await extension.close();
  }
});

test('turning the Ramadan card off restores the normal labels', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2027-02-20T16:00:00Z'), LONDON);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Ramadan' })).toBeVisible();

    const card = extension.page.getByRole('switch', { name: 'Ramadan card' });
    await card.click();
    await expect(card).toHaveAttribute('aria-checked', 'false');
    await extension.page.getByRole('button', { name: 'Close settings' }).click();

    await expect(extension.page.locator('.next-name')).toHaveText('Maghrib');
    await expect(extension.page.locator('.countdown-note')).toHaveText('until Maghrib');
    await expect(extension.page.locator('[data-slot="fajr"] .time-label')).toHaveText('Fajr');
    await expect(extension.page.locator('[data-slot="maghrib"] .time-label')).toContainText('Maghrib');
    await expect(extension.page.locator('.ramadan-day')).toHaveCount(0);
  } finally {
    await extension.close();
  }
});

test('outside Ramadan nothing changes', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), LONDON);
    await expect(extension.page.locator('.next-name')).toHaveText('Dhuhr');
    await expect(extension.page.locator('[data-slot="fajr"] .time-label')).toHaveText('Fajr');
    await expect(extension.page.locator('.ramadan-day')).toHaveCount(0);

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Ramadan' })).toBeHidden();
  } finally {
    await extension.close();
  }
});
