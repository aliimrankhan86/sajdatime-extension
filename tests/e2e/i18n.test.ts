import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, LONDON, screenshot, seedSettings, setTheme } from './extension';

/**
 * PLAN.md section 10, measured rather than looked at.
 *
 * The build has no way to show a screenshot to the reviewer, so every claim about Urdu and
 * Arabic is a number here: the direction attribute, where the pin sits inside the town
 * chip, the mirrored back arrow's matrix, and the width of the document at 380 wide. The
 * screenshots in docs/images/i18n are for the human check on top of that.
 */

const LANGS = ['en', 'ur', 'ar', 'tr', 'id', 'bn'] as const;
type Lang = (typeof LANGS)[number];

const RTL: readonly Lang[] = ['ur', 'ar'];

function withLanguage(language: Lang): unknown {
  return { ...LONDON, language };
}

async function openSettings(page: Page, label = 'Settings'): Promise<void> {
  await page.getByRole('button', { name: label }).first().click();
  await page.waitForSelector('.back-button');
}

/** Where an element sits, and how wide it is, in CSS pixels. */
async function box(page: Page, selector: string): Promise<{ x: number; width: number }> {
  const found = await page.locator(selector).first().boundingBox();
  if (!found) throw new Error(`${selector} is not visible`);
  return { x: found.x, width: found.width };
}

test('each language puts its own lang and dir on the root', async () => {
  for (const language of LANGS) {
    const extension = await launchExtension();
    try {
      await seedSettings(extension, undefined, withLanguage(language));
      const root = extension.page.locator('html');
      await expect(root).toHaveAttribute('lang', language);
      await expect(root).toHaveAttribute('dir', RTL.includes(language) ? 'rtl' : 'ltr');

      // The name and description come through `__MSG_` and `default_locale`, so a missing or
      // unfilled locale file shows up here as the raw placeholder rather than in a store listing.
      const manifest = await extension.page.evaluate(() => chrome.runtime.getManifest());
      expect(manifest.name).toBe('SajdaTime');
      expect(manifest.description ?? '').not.toContain('__MSG_');
      expect((manifest.description ?? '').length).toBeLessThanOrEqual(132);
    } finally {
      await extension.close();
    }
  }
});

test('the town chip and the back arrow mirror, the times do not', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, undefined, withLanguage('en'));
    const englishPin = await box(extension.page, '.town-pin');
    const englishChip = await box(extension.page, '.town-chip');
    expect(englishPin.x - englishChip.x).toBeLessThan(40);

    await extension.page.evaluate(async (stored) => {
      await chrome.storage.local.set({ 'sajdatime.settings.v1': stored });
    }, withLanguage('ar'));
    await extension.page.reload();
    await extension.page.waitForSelector('.next-card');

    // Arabic: the pin sits at the right hand edge, because the row now starts there.
    const arabicPin = await box(extension.page, '.town-pin');
    const arabicChip = await box(extension.page, '.town-chip');
    expect(arabicChip.x + arabicChip.width - (arabicPin.x + arabicPin.width)).toBeLessThan(40);

    // A time is a clock and a clock is read left to right in every language. The text
    // itself is not reordered, and its own direction is isolated from the paragraph.
    const timeText = (await extension.page.locator('.time-value').first().innerText()).trim();
    // "4:53" in a 24 hour place, "4:53 ص" in Arabic, always with Western digits.
    expect(timeText).toMatch(/^\d{1,2}:\d{2}(\s*[صم])?$/);
    expect(timeText).not.toMatch(/[\u0660-\u0669]/);
    const timeDirection = await extension.page
      .locator('.time-value bdi')
      .first()
      .evaluate((element) => getComputedStyle(element).direction);
    expect(timeDirection).toBe('ltr');

    // The back arrow is the one glyph that has to point the other way in Arabic.
    await openSettings(extension.page, 'الإعدادات');
    const transform = await extension.page
      .locator('.back-button svg')
      .first()
      .evaluate((element) => getComputedStyle(element).transform);
    expect(transform).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  } finally {
    await extension.close();
  }
});

test('the Times screen never scrolls sideways in any language', async () => {
  for (const language of LANGS) {
    const extension = await launchExtension();
    try {
      await seedSettings(extension, undefined, withLanguage(language));
      const overflow = await extension.page.evaluate(() => {
        const root = document.documentElement;
        const rows = [...document.querySelectorAll('.time-row, .next-card, .footer, .town-chip')];
        return {
          document: root.scrollWidth - root.clientWidth,
          rows: rows
            .map((row) => row.scrollWidth - row.clientWidth)
            .filter((width) => width > 0),
        };
      });
      expect(overflow.document, `${language} document`).toBeLessThanOrEqual(0);
      expect(overflow.rows, `${language} rows`).toEqual([]);
    } finally {
      await extension.close();
    }
  }
});

test('both footer buttons keep one line and cut no word in every language', async () => {
  // "Save as PDF" is the widest translated label in the popup, and the two footer buttons
  // share the width, so this is where a language either fits or is cut. Measured, because
  // the width depends on the font and on the translation.
  for (const language of LANGS) {
    const extension = await launchExtension();
    try {
      await seedSettings(extension, undefined, withLanguage(language));
      const buttons = await extension.page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.footer-actions button')].map((button) => {
          const range = document.createRange();
          range.selectNodeContents(button);
          const runTops = [...range.getClientRects()].map((rect) => Math.round(rect.top));
          return {
            label: (button.textContent ?? '').trim(),
            clipped: button.scrollWidth - button.clientWidth,
            // A mixed direction label ("PDF محفوظ کریں") makes one rectangle per script
            // run on the same line, so count the lines by where they sit, not how many
            // rectangles there are.
            lines: new Set(runTops).size,
          };
        }),
      );
      expect(buttons, language).toHaveLength(2);
      for (const button of buttons) {
        expect(button.label, `${language} label`).not.toBe('');
        expect(button.clipped, `${language} "${button.label}" clipped`).toBeLessThanOrEqual(0);
        expect(button.lines, `${language} "${button.label}" lines`).toBe(1);
      }
    } finally {
      await extension.close();
    }
  }
});

test('nothing is clipped at 200 per cent zoom in Indonesian, Turkish and Bengali', async () => {
  for (const language of ['id', 'tr', 'bn'] as const) {
    const extension = await launchExtension();
    try {
      await seedSettings(extension, undefined, withLanguage(language));
      // CSS zoom stands in for Chrome's 200 per cent zoom here. The popup keeps its agreed
      // 380 pixel width at every zoom, so the page itself may scroll sideways, which is a
      // fixed-width choice and not a translation fault. What must not happen is a row or a
      // button cutting its own words, or a target dropping under 44 pixels.
      await extension.page.evaluate(() => {
        document.documentElement.style.zoom = '2';
      });
      const clipped = await extension.page.evaluate(() => {
        const cut = [...document.querySelectorAll('.time-row, .next-card, .setting-row, .action')]
          .filter((element) => element.scrollWidth - element.clientWidth > 1)
          .map((element) => element.className);
        const small = [...document.querySelectorAll('.action')]
          .filter((element) => element.getBoundingClientRect().height < 44)
          .map((element) => element.className);
        return { cut, small };
      });
      expect(clipped.cut, `${language} cut`).toEqual([]);
      expect(clipped.small, `${language} targets`).toEqual([]);
    } finally {
      await extension.close();
    }
  }
});

test('choosing a language in Settings changes the screen at once, and is kept', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    await openSettings(extension.page);
    await extension.page.getByRole('button', { name: /^Language/ }).click();
    await extension.page.getByRole('button', { name: 'Türkçe' }).click();
    await extension.page.getByRole('button', { name: 'Tamam' }).click();
    await expect(extension.page.locator('html')).toHaveAttribute('lang', 'tr');
    await extension.page.locator('.back-button').click();
    await expect(extension.page.getByText('Öğle').first()).toBeVisible();
    const stored = await extension.page.evaluate(async () => {
      const value = await chrome.storage.local.get('sajdatime.settings.v1');
      return (value['sajdatime.settings.v1'] as { language: string }).language;
    });
    expect(stored).toBe('tr');
  } finally {
    await extension.close();
  }
});

test('the first run offers Browser language, then each language in its own name', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(() => chrome.storage.local.clear());
    await extension.page.reload();
    await extension.page.getByRole('button', { name: 'English' }).click();
    // Each row reads as its own name, then the muted English name (or, for Browser
    // language, the language it gives today), so match the start of the row.
    const rows = await extension.page.locator('.choice-title').allInnerTexts();
    expect(rows).toEqual(['Browser language', 'English', 'اردو', 'العربية', 'Türkçe', 'Bahasa Indonesia', 'বাংলা']);
  } finally {
    await extension.close();
  }
});

test('every language passes axe in both themes', async () => {
  const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
  for (const language of LANGS) {
    const extension = await launchExtension();
    try {
      await extension.page.addInitScript({ path: axePath });
      await seedSettings(extension, undefined, withLanguage(language));
      for (const theme of ['light', 'dark'] as const) {
        await setTheme(extension.page, theme);
        await extension.page.waitForTimeout(250);
        const violations = await extension.page.evaluate(async () => {
          const axe = (window as unknown as {
            axe: { run: (root: Document, options: unknown) => Promise<{ violations: { id: string }[] }> };
          }).axe;
          const result = (await axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
            },
          })) as { violations: { id: string; nodes: { target: unknown; html: string }[] }[] };
          return result.violations.map(
            (violation) =>
              `${violation.id}: ${violation.nodes.map((node) => node.html.slice(0, 160)).join(' | ')}`,
          );
        });
        expect(violations, `${language} ${theme}`).toEqual([]);
        if (process.env['SAJDATIME_SCREENSHOTS'] === '1') {
          await screenshot(extension.page, `docs/images/i18n/times-${language}-${theme}.png`);
        }
      }
    } finally {
      await extension.close();
    }
  }
});


test('the method sheet fits the popup and cuts no word in any language', async () => {
  // The method names are the longest translated strings on a row and the row is a fixed 380 px
  // wide, so this is where a translation is most likely to clip or to push the page sideways.
  // Selecting by data-row rather than by label is what lets one test cover all six.
  for (const language of LANGS) {
    const extension = await launchExtension();
    try {
      await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), withLanguage(language) as typeof LONDON);
      await extension.page.locator('.footer-actions button').first().click();
      await extension.page.locator('[data-row="method"]').click();
      await extension.page.waitForSelector('.method-row, .choice-row');

      const report = await extension.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.method-row, .choice-row'));
        return {
          sideways: document.body.scrollWidth - document.body.clientWidth,
          rows: rows.length,
          clipped: rows.filter((row) => row.scrollWidth > row.clientWidth + 1).length,
          short: rows.filter((row) => row.getBoundingClientRect().height < 44).length,
        };
      });

      expect(report.rows, language).toBeGreaterThan(5);
      expect(report.clipped, language).toBe(0);
      expect(report.short, language).toBe(0);
      expect(report.sideways, language).toBeLessThanOrEqual(0);
    } finally {
      await extension.close();
    }
  }
});

/**
 * The screenshots for the human check, for the two right to left languages only, in both
 * themes: Settings, the short first run disclaimer, the first run method step with the new
 * select, the full method list it opens, and the printable timetable. Rewritten only when
 * SAJDATIME_SCREENSHOTS=1, so a normal run leaves the checkout alone.
 */
test('captures the right to left screens when asked', async () => {
  test.skip(process.env['SAJDATIME_SCREENSHOTS'] !== '1', 'screenshots are opt in');
  const NATIVE = { ur: 'اردو', ar: 'العربية' } as const;

  for (const language of ['ur', 'ar'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      // Settings and the timetable come from saved settings.
      const extension = await launchExtension();
      try {
        await seedSettings(extension, undefined, withLanguage(language));
        await setTheme(extension.page, theme);
        await extension.page.locator('.footer-settings').click();
        await extension.page.waitForSelector('.back-button');
        await screenshot(extension.page, `docs/images/i18n/settings-${language}-${theme}.png`);

        const print = await extension.context.newPage();
        // The timetable is laid out for A4, so it needs a page wide enough to hold all
        // seven columns before it is worth looking at.
        await print.setViewportSize({ width: 900, height: 1200 });
        await print.clock.install({ time: new Date('2026-10-27T11:00:00Z') });
        await print.goto(`chrome-extension://${extension.id}/print/index.html`);
        await print.waitForSelector('table.print-table');
        await setTheme(print, theme);
        await screenshot(print, `docs/images/i18n/pdf-${language}-${theme}.png`, { fullPage: true });
        await print.close();
      } finally {
        await extension.close();
      }

      // The first run is walked with the language chosen at its first step, so every word
      // on the way, including the new select, is in the language of the screenshot.
      const run = await launchExtension();
      const page = run.page;
      try {
        await page.evaluate(() => chrome.storage.local.clear());
        await page.clock.install({ time: new Date('2026-10-27T11:00:00Z') });
        await page.reload();
        await page.waitForSelector('.language-button');
        await page.locator('.language-button').click();
        await page.locator('.choice-row').filter({ hasText: NATIVE[language] }).click();
        await page.locator('.back-button').click();
        await setTheme(page, theme);

        await page.locator('.first-run-primary').click(); // Begin
        await screenshot(page, `docs/images/i18n/first-run-disclaimer-${language}-${theme}.png`);

        await page.locator('.first-run-primary').click(); // I understand
        await page.locator('.choice-card').first().click(); // Sunni
        await page.locator('.first-run-foot .action').last().click(); // Continue
        await page.locator('.choice-card').first().click(); // the first madhab
        await page.locator('.first-run-foot .action').last().click(); // Continue
        await page.locator('.first-run-skip button').click(); // Makkah
        await expect(page.locator('.first-run-foot .action').last()).toBeEnabled();
        await page.locator('.first-run-foot .action').last().click(); // Continue to method

        await page.waitForSelector('.method-chooser');
        await screenshot(page, `docs/images/i18n/first-run-method-${language}-${theme}.png`);

        await page.locator('.method-chooser').click();
        await page.waitForSelector('.method-body');
        await page.evaluate(() => window.scrollTo(0, 0));
        await screenshot(page, `docs/images/i18n/all-methods-${language}-${theme}.png`);
      } finally {
        await run.close();
      }
    }
  }
});

test('the language picker shows each language in English too, and still fits', async () => {
  for (const language of ['en', 'ur', 'bn'] as const) {
    const extension = await launchExtension();
    try {
      await seedSettings(extension, undefined, withLanguage(language));
      await extension.page.locator('.footer-actions button').first().click();
      await extension.page.locator('[data-row="language"]').click();
      await extension.page.waitForSelector('.choice-row');
      const hints = await extension.page.locator('.choice-hint').allInnerTexts();
      // The first hint is the language "Browser language" gives today, in its own name.
      expect(['English', 'اردو', 'العربية', 'Türkçe', 'Bahasa Indonesia', 'বাংলা'], language).toContain(hints[0]);
      expect(hints.slice(1), language).toEqual(['Urdu', 'Arabic', 'Turkish', 'Indonesian', 'Bengali']);
      const fits = await extension.page.evaluate(() => {
        const rows = [...document.querySelectorAll<HTMLElement>('.choice-row')];
        return {
          clipped: rows.filter((row) => row.scrollWidth - row.clientWidth > 1).length,
          width: document.documentElement.scrollWidth,
          // Done must stay on screen: the English names sit beside, not under, each name.
          doneBottom: [...document.querySelectorAll<HTMLElement>('button')]
            .filter((button) => button.closest('.sheet-body') === null && button.className.includes('action'))
            .map((button) => button.getBoundingClientRect().bottom)
            .pop() ?? 0,
        };
      });
      expect(fits.clipped, language).toBe(0);
      expect(fits.width, language).toBeLessThanOrEqual(380);
      expect(fits.doneBottom, `${language} Done`).toBeGreaterThan(0);
      expect(fits.doneBottom, `${language} Done`).toBeLessThanOrEqual(600);
      await screenshot(extension.page, `docs/images/i18n/picker-${language}.png`);
    } finally {
      await extension.close();
    }
  }
});
