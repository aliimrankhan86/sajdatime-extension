import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, seedSettings } from './extension';

async function undersizedControls(page: Page) {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('button, summary, select, input'));
    return nodes
      .filter((node) => {
        const element = node as HTMLElement;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((node) => {
        const element = node as HTMLElement;
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((control) => control.width < 44 || control.height < 44);
  });
}

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
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T16:00:00Z'));
    await extension.page.setViewportSize({ width: 190, height: 600 });

    const widths = await extension.page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);

    const outside = await extension.page.evaluate(() =>
      Array.from(document.querySelectorAll('.hero, .next-card, .time-row, .footer'))
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        })
        .filter((rect) => rect.left < -0.5 || rect.right > window.innerWidth + 0.5),
    );
    expect(outside).toEqual([]);
    await extension.page.screenshot({ path: 'docs/images/zoom-190.png', fullPage: true });

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    const settingsWidths = await extension.page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(settingsWidths.scroll).toBeLessThanOrEqual(settingsWidths.client);
    await extension.page.screenshot({ path: 'docs/images/settings-zoom-190.png', fullPage: true });
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
    const sizes = await extension.page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(sizes.scrollHeight).toBeLessThanOrEqual(sizes.clientHeight);
    await extension.page.screenshot({ path: 'docs/images/times-dark.png' });
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
