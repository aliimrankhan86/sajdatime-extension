import { expect, test } from '@playwright/test';
import { launchExtension, LONDON, screenshot, seedSettings, setTheme } from './extension';
import { undersizedControls } from './measures';

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
    expect(await undersizedControls(extension.page)).toEqual([]);

    // The notice sits in the flow between the header and the hero card, 16 below the
    // header and 8 above the compact card, so it covers neither, and the whole popup
    // must still fit 380 by 600 with no scroll (the D-030 gap, closed in Step 5).
    const layout = await extension.page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const notice = document.querySelector('.notice');
      const card = document.querySelector('.next-card');
      const box = (node: Element | null) => (node ? node.getBoundingClientRect() : null);
      const heroBox = box(hero);
      const noticeBox = box(notice);
      const cardBox = box(card);
      return {
        belowHeader: heroBox && noticeBox ? Math.round(noticeBox.top - heroBox.bottom) : -1,
        gap: noticeBox && cardBox ? Math.round(cardBox.top - noticeBox.bottom) : -1,
        scrollHeight: document.documentElement.scrollHeight,
      };
    });
    expect(layout.belowHeader).toBe(16);
    expect(layout.gap).toBe(8);
    expect(layout.scrollHeight).toBeLessThanOrEqual(600);

    await screenshot(extension.page, 'docs/images/times-coming-light.png');
    await setTheme(extension.page, 'dark');
    await screenshot(extension.page, 'docs/images/times-coming-dark.png');
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
    // With the notice up the hero is the one row form.
    await expect(extension.page.locator('.next-card')).toHaveClass(/is-compact/);
    await extension.page.getByRole('button', { name: 'Close' }).click();
    await expect(extension.page.locator('.notice')).toHaveCount(0);
    // The full hero comes back as soon as the notice is gone, because the room is free.
    await expect(extension.page.locator('.next-card')).not.toHaveClass(/is-compact/);
    await expect(extension.page.locator('.next-label')).toHaveText('Next prayer');
    await expect(extension.page.locator('.day-bar')).toHaveCount(5);

    // Wait for the dismiss to land in storage, then prove it survives a reload.
    await extension.page.waitForFunction(async (key) => {
      const stored = await chrome.storage.local.get(key);
      return stored[key] === true;
    }, 'sajdatime.notice.ramadan.1448');
    await extension.page.reload();
    await extension.page.waitForSelector('.next-card');
    await expect(extension.page.locator('.notice')).toHaveCount(0);
    await expect(extension.page.locator('.next-card')).not.toHaveClass(/is-compact/);
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

    await screenshot(extension.page, 'docs/images/times-eid-light.png');
    await setTheme(extension.page, 'dark');
    await screenshot(extension.page, 'docs/images/times-eid-dark.png');
  } finally {
    await extension.close();
  }
});

// D-030: the base Times screen fills 380 by 600 exactly, so a notice must not push
// it taller. Every state, notice included, stays at or under 600 px with no scroll,
// in both themes. Normal, Ramadan (no notice, card active), coming notice and Eid.
for (const theme of ['light', 'dark'] as const) {
  test(`the popup fits 600 px with no scroll in ${theme}`, async () => {
    const extension = await launchExtension();
    const page = extension.page;
    try {
      const dates: Record<string, string> = {
        normal: '2026-10-27T11:00:00Z',
        ramadan: '2027-02-20T11:00:00Z',
        coming: '2027-02-06T11:00:00Z',
        eid: '2027-03-09T11:00:00Z',
      };
      for (const [name, iso] of Object.entries(dates)) {
        // seedSettings reloads with the stored system theme, so paint the theme after.
        await seedSettings(extension, new Date(iso), LONDON);
        await setTheme(page, theme);
        const fits = await page.evaluate(() => ({
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        }));
        expect(fits.scrollHeight, `${name} in ${theme}`).toBeLessThanOrEqual(600);
        expect(fits.scrollHeight, `${name} in ${theme}`).toBeLessThanOrEqual(fits.clientHeight);
      }
    } finally {
      await extension.close();
    }
  });
}
