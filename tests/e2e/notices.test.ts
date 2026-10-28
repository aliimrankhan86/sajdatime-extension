import { expect, test } from '@playwright/test';
import { launchExtension, LONDON, seedSettings } from './extension';

// Ramadan 1448 starts on 8 February 2027. The coming notice appears in the three
// days before it; Eid al-Fitr (1 Shawwal 1448) is 9 March 2027.

test('the coming notice shows two days before Ramadan', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2027-02-06T11:00:00Z'), LONDON);
    await expect(extension.page.locator('.notice')).toBeVisible();
    await expect(extension.page.locator('.notice-title')).toHaveText('Ramadan begins on 8 February 2027');
    await expect(extension.page.locator('.notice-line')).toHaveText(
      'From the first day, the Ramadan card shows suhoor and iftar times here. You can turn it off in Settings.',
    );
    await expect(extension.page.getByRole('button', { name: 'Close' })).toBeVisible();

    // The notice sits in the flow between the header and the hero card, so it must
    // not cover the card. (Fitting the whole 380 by 600 popup with a notice
    // showing, with no scroll, is Step 5, which re-plans the Times screen.)
    const gap = await extension.page.evaluate(() => {
      const notice = document.querySelector('.notice');
      const card = document.querySelector('.next-card');
      if (!notice || !card) return -1;
      return card.getBoundingClientRect().top - notice.getBoundingClientRect().bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(0);
  } finally {
    await extension.close();
  }
});

test('the coming notice does not show four days before Ramadan', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2027-02-04T11:00:00Z'), LONDON);
    await expect(extension.page.locator('.notice')).toHaveCount(0);
  } finally {
    await extension.close();
  }
});

test('the coming notice does not show on the first day of Ramadan', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2027-02-08T11:00:00Z'), LONDON);
    await expect(extension.page.locator('.notice')).toHaveCount(0);
  } finally {
    await extension.close();
  }
});

test('closing the coming notice keeps it closed after a reload', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2027-02-06T11:00:00Z'), LONDON);
    await expect(extension.page.locator('.notice')).toBeVisible();
    await extension.page.getByRole('button', { name: 'Close' }).click();
    await expect(extension.page.locator('.notice')).toHaveCount(0);

    // Wait for the dismiss to land in storage, then prove it survives a reload.
    await extension.page.waitForFunction(async (key) => {
      const stored = await chrome.storage.local.get(key);
      return stored[key] === true;
    }, 'sajdatime.notice.ramadan.1448');
    await extension.page.reload();
    await extension.page.waitForSelector('.next-card');
    await expect(extension.page.locator('.notice')).toHaveCount(0);
  } finally {
    await extension.close();
  }
});

test('Eid al-Fitr shows the Eid notice', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2027-03-09T11:00:00Z'), LONDON);
    await expect(extension.page.locator('.notice-title')).toHaveText('Eid Mubarak');
    await expect(extension.page.locator('.notice-line')).toHaveText('Follow your mosque for the date of Eid.');
  } finally {
    await extension.close();
  }
});
