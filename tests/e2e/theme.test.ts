import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LONDON, launchExtension, seedSettings } from './extension';

/**
 * U12: System, Light, Dark. System is the default. The choice is stored, validated and
 * applied as data-theme on <html>. The content must never be painted in the wrong theme,
 * even for one frame; only the bare window background can follow the operating system
 * while storage is read (there is no inline script, because the CSP forbids one).
 */

const BACKGROUND = {
  light: 'rgb(247, 245, 243)',
  dark: 'rgb(16, 19, 18)',
} as const;

async function themeState(page: Page) {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme ?? null,
    scheme: getComputedStyle(document.documentElement).colorScheme,
    background: getComputedStyle(document.body).backgroundColor,
  }));
}

async function storedTheme(page: Page): Promise<string | undefined> {
  const stored = await page.evaluate(async () => chrome.storage.local.get('sajdatime.settings.v1'));
  return (stored['sajdatime.settings.v1'] as { theme?: string } | undefined)?.theme;
}

test('System is the default and follows the operating system without a reload', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.emulateMedia({ colorScheme: 'dark' });
    await seedSettings(extension);
    expect(await themeState(extension.page)).toEqual({
      theme: 'dark',
      scheme: 'dark',
      background: BACKGROUND.dark,
    });

    await extension.page.emulateMedia({ colorScheme: 'light' });
    await expect
      .poll(async () => (await themeState(extension.page)).theme)
      .toBe('light');
    expect(await themeState(extension.page)).toEqual({
      theme: 'light',
      scheme: 'light',
      background: BACKGROUND.light,
    });
  } finally {
    await extension.close();
  }
});

test('a stored Light choice beats a dark operating system', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.emulateMedia({ colorScheme: 'dark' });
    await seedSettings(extension, undefined, { ...LONDON, theme: 'light' });
    expect(await themeState(extension.page)).toEqual({
      theme: 'light',
      scheme: 'light',
      background: BACKGROUND.light,
    });
  } finally {
    await extension.close();
  }
});

test('a stored Dark choice beats a light operating system', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.emulateMedia({ colorScheme: 'light' });
    await seedSettings(extension, undefined, { ...LONDON, theme: 'dark' });
    expect(await themeState(extension.page)).toEqual({
      theme: 'dark',
      scheme: 'dark',
      background: BACKGROUND.dark,
    });
  } finally {
    await extension.close();
  }
});

test('content first appears with the stored theme, not the operating system one', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.addInitScript(() => {
      const seen: { value: string | null; done: boolean } = { value: null, done: false };
      const record = () => {
        if (seen.done) return;
        if (document.querySelector('.next-card, .welcome, .sheet') === null) return;
        seen.done = true;
        seen.value = document.documentElement.dataset.theme ?? null;
        (window as unknown as { __themeSeen: string | null }).__themeSeen = seen.value;
      };
      // Observe the document, not documentElement: an init script can run before
      // <html> has been parsed, and observing a null root would never fire.
      new MutationObserver(record).observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-theme'],
      });
      document.addEventListener('DOMContentLoaded', record);
      record();
    });

    await extension.page.emulateMedia({ colorScheme: 'dark' });
    await seedSettings(extension, undefined, { ...LONDON, theme: 'light' });
    await expect(extension.page.locator('.next-card')).toBeVisible();
    expect(
      await extension.page.evaluate(
        () => (window as unknown as { __themeSeen?: string | null }).__themeSeen ?? null,
      ),
    ).toBe('light');
  } finally {
    await extension.close();
  }
});

test('the Theme selector stores System, Light and Dark', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    const group = extension.page.getByRole('group', { name: 'Theme' });
    await expect(group.getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await group.getByRole('button', { name: 'Dark' }).click();
    expect((await themeState(extension.page)).theme).toBe('dark');
    await expect.poll(async () => storedTheme(extension.page)).toBe('dark');
    await expect(group.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await group.getByRole('button', { name: 'Light' }).click();
    expect((await themeState(extension.page)).theme).toBe('light');
    await expect.poll(async () => storedTheme(extension.page)).toBe('light');

    await group.getByRole('button', { name: 'System' }).click();
    await expect.poll(async () => storedTheme(extension.page)).toBe('system');
  } finally {
    await extension.close();
  }
});

test('a setting saved before themes existed becomes System', async () => {
  const extension = await launchExtension();
  try {
    const old: Record<string, unknown> = { ...LONDON };
    delete old.theme;
    await extension.page.emulateMedia({ colorScheme: 'dark' });
    await seedSettings(extension, undefined, old);
    expect((await themeState(extension.page)).theme).toBe('dark');

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(
      extension.page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'System' }),
    ).toHaveAttribute('aria-pressed', 'true');
  } finally {
    await extension.close();
  }
});
