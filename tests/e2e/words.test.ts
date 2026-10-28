import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LONDON, launchExtension, seedSettings, setTheme } from './extension';

/**
 * UX-PLAN section 5.4 and section 1.1: no em dash, no en dash, no semicolon and no
 * spaced hyphen in app text, and none of the banned words from the phone's
 * 06-content-and-language.md section 6.3.
 *
 * The check reads what the user actually reads: the rendered text plus every accessible
 * name, placeholder and alt on the screen. A raw source scan would trip over code
 * semicolons and CSS class names, and would miss text assembled at runtime.
 */

const BANNED = [
  'missed',
  'late',
  'owed',
  'debt',
  'excused',
  'qada',
  'imsak',
  'stop eating',
  'tracking',
  'amazing',
  'premium',
  'best',
  'ultimate',
  'valid',
  'invalid',
  'failed',
  'error',
  'must',
  'may',
  'you can pray now',
];

async function userText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const attributes = ['aria-label', 'title', 'placeholder', 'alt'];
    const named = attributes.flatMap((attribute) =>
      Array.from(document.querySelectorAll(`[${attribute}]`)).map(
        (node) => node.getAttribute(attribute) ?? '',
      ),
    );
    return [document.body.innerText, ...named].join('\n');
  });
}

function findProblems(text: string): string[] {
  const problems: string[] = [];
  if (text.includes('\u2014')) problems.push('an em dash');
  if (text.includes('\u2013')) problems.push('an en dash');
  if (text.includes(';')) problems.push('a semicolon');
  if (text.includes(' - ')) problems.push('a spaced hyphen');
  for (const word of BANNED) {
    const pattern = new RegExp(`\\b${word.replace(/ /g, '\\s+')}\\b`, 'i');
    if (pattern.test(text)) problems.push(`the word "${word}"`);
  }
  return problems;
}

test('the word check catches bad copy', () => {
  expect(findProblems('You missed it - try again; now')).toEqual(
    expect.arrayContaining(['a spaced hyphen', 'a semicolon', 'the word "missed"']),
  );
  expect(findProblems('SajdaTime is a helper, not a religious authority.')).toEqual([]);
});

test('every screen uses plain words in both themes', async () => {
  const extension = await launchExtension();
  const page = extension.page;
  try {
    await page.evaluate(async () => chrome.storage.local.clear());
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (ok: (position: unknown) => void) =>
            ok({ coords: { latitude: 53.8, longitude: -1.55 } }),
        },
      });
    });
    await page.reload();

    // First run, light then dark.
    await expect(page.getByRole('button', { name: 'Use my location' })).toBeVisible();
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'dark');
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'light');

    // Location found, light then dark.
    await page.getByRole('button', { name: 'Use my location' }).click();
    await expect(page.getByRole('status')).toContainText('Leeds, United Kingdom');
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'dark');
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'light');

    // Times, light then dark.
    await page.getByRole('status').getByRole('button', { name: 'Continue' }).click();
    await page.waitForSelector('.next-card', { timeout: 20_000 });
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'dark');
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'light');

    // Settings, light then dark.
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'dark');
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'light');

    // Location sheet, including the offline town search, light then dark.
    await page.getByRole('button', { name: 'Change' }).click();
    await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();
    expect(findProblems(await userText(page))).toEqual([]);
    await setTheme(page, 'dark');
    expect(findProblems(await userText(page))).toEqual([]);
  } finally {
    await extension.close();
  }
});

test('a notice uses plain words in both themes', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-03-20T10:00:00Z'), LONDON);
    await expect(extension.page.locator('.notice')).toBeVisible();
    expect(findProblems(await userText(extension.page))).toEqual([]);
    await setTheme(extension.page, 'dark');
    expect(findProblems(await userText(extension.page))).toEqual([]);
  } finally {
    await extension.close();
  }
});
