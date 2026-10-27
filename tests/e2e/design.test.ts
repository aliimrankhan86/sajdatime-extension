import { expect, test } from '@playwright/test';
import { launchExtension, screenshot, seedSettings } from './extension';
import { countdownLineCount, undersizedControls } from './measures';

test('shows a Now pill on the current prayer and a Next pill on the next', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T21:00:00Z'));
    await expect(extension.page.locator('.time-row.is-now')).toHaveCount(1);
    await expect(extension.page.locator('.time-row.is-now')).toHaveAttribute('data-slot', 'isha');
    await expect(extension.page.locator('.time-row.is-now .now-pill')).toHaveText('Now');
    await expect(extension.page.locator('.time-row.is-now')).toHaveAttribute('aria-current', 'time');
    await expect(extension.page.locator('.time-row.is-next')).toHaveCount(0);
    await expect(extension.page.locator('.next-name')).toHaveText('Fajr');
    await expect(extension.page.locator('.next-label')).toHaveText('Next prayer, tomorrow');
  } finally {
    await extension.close();
  }
});

test('the Next row never announces itself as current', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'));
    await expect(extension.page.locator('.time-row.is-next')).toHaveCount(1);
    await expect(extension.page.locator('.time-row.is-next')).not.toHaveAttribute(
      'aria-current',
      /.*/,
    );
  } finally {
    await extension.close();
  }
});

test('every control on every screen has a 44px target', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    expect(await undersizedControls(extension.page)).toEqual([]);

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    expect(await undersizedControls(extension.page)).toEqual([]);

    await extension.page.getByRole('button', { name: 'Change' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Location' })).toBeVisible();
    expect(await undersizedControls(extension.page)).toEqual([]);
  } finally {
    await extension.close();
  }
});

test('keeps the popup readable at 200 percent zoom', async () => {
  const extension = await launchExtension('en-GB', { deviceScaleFactor: 2 });
  try {
    await seedSettings(extension, new Date('2026-10-27T16:00:00Z'));

    // A real browser zoom keeps the CSS viewport at 380 by 600 and doubles the
    // device pixels, so this test sets deviceScaleFactor 2 instead of shrinking the
    // viewport. Nothing may clip, the countdown must stay on one line, and every
    // control must keep its 44 CSS pixel target.
    const widths = await extension.page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
    expect(await extension.page.evaluate(countdownLineCount)).toBe(1);
    expect(await undersizedControls(extension.page)).toEqual([]);

    const outside = await extension.page.evaluate(() =>
      Array.from(document.querySelectorAll('.hero, .next-card, .time-row, .footer'))
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        })
        .filter((rect) => rect.left < -0.5 || rect.right > window.innerWidth + 0.5),
    );
    expect(outside).toEqual([]);
    await screenshot(extension.page, 'docs/images/zoom-200.png', { fullPage: true });

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    const settingsWidths = await extension.page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(settingsWidths.scroll).toBeLessThanOrEqual(settingsWidths.client);
    expect(await undersizedControls(extension.page)).toEqual([]);
    await screenshot(extension.page, 'docs/images/settings-zoom-200.png', { fullPage: true });
  } finally {
    await extension.close();
  }
});

test('dark mode uses a flat card and stays complete', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.emulateMedia({ colorScheme: 'dark' });
    await seedSettings(extension);
    await expect(extension.page.locator('.time-row')).toHaveCount(6);
    const shadow = await extension.page
      .locator('.next-card')
      .evaluate((node) => getComputedStyle(node).boxShadow);
    expect(shadow).toBe('none');
    const bar = await extension.page
      .locator('.time-row.is-next')
      .evaluate((node) => getComputedStyle(node).boxShadow);
    expect(bar).toContain('3px');
    expect(bar).toContain('inset');
    const sizes = await extension.page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(sizes.scrollHeight).toBeLessThanOrEqual(sizes.clientHeight);
    await screenshot(extension.page, 'docs/images/times-dark.png');
  } finally {
    await extension.close();
  }
});

test('makes no network requests while showing times', async () => {
  const extension = await launchExtension();
  try {
    const remote: string[] = [];
    extension.page.on('request', (request) => {
      if (!request.url().startsWith('chrome-extension://')) remote.push(request.url());
    });
    await seedSettings(extension);
    await expect(extension.page.locator('.time-row')).toHaveCount(6);
    expect(remote).toEqual([]);
  } finally {
    await extension.close();
  }
});
