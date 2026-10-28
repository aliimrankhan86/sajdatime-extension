import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, screenshot, seedSettings, setTheme } from './extension';
import type { Extension } from './extension';

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

interface Violation {
  id: string;
  impact: string | null;
  nodes: { target: unknown }[];
}

async function audit(page: Page): Promise<Violation[]> {
  await page.waitForTimeout(250);
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as {
      axe: { run: (root: Document, options: unknown) => Promise<unknown> };
    }).axe;
    return (await axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
    })) as { violations: Violation[] };
  });
  return result.violations;
}

function expectNoViolations(violations: Violation[]) {
  if (violations.length === 0) return;
  const detail = violations
    .map((violation) =>
      [
        `${violation.id} (${violation.impact ?? 'unknown'})`,
        ...violation.nodes.map((node) => `  ${JSON.stringify(node.target)}`),
      ].join('\n'),
    )
    .join('\n');
  throw new Error(`Accessibility violations:\n${detail}`);
}

const FIXED_TIME = new Date('2026-10-27T11:00:00Z');

/**
 * Opens the printable timetable as its own tab. The clock is installed before the
 * navigation, so "today" is the same day every run: the shaded row, the 30 day Ramadan
 * offer and the clock-change note all depend on it.
 */
async function openTimetable(
  extension: Extension,
  search = '',
  time: Date = FIXED_TIME,
): Promise<Page> {
  const page = await extension.context.newPage();
  await page.clock.install({ time });
  await page.goto(`chrome-extension://${extension.id}/print/index.html${search}`);
  await page.waitForSelector('table.print-table');
  return page;
}

async function countPdfPages(pdf: Buffer): Promise<number> {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
}

test('the footer button opens the timetable with the month only in the URL', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);

    const opened = extension.context.waitForEvent('page');
    await extension.page.getByRole('button', { name: 'Save as PDF' }).click();
    const print = await opened;
    await print.waitForSelector('table.print-table');

    const url = new URL(print.url());
    expect(url.pathname.endsWith('/print/index.html')).toBe(true);
    expect(url.searchParams.get('month')).toBe('2026-10');
    expect(url.searchParams.get('kind')).toBe('month');
    // R5: the place comes from storage, never from the URL or the tab.
    expect(url.search.toLowerCase()).not.toContain('lat');
    expect(url.search.toLowerCase()).not.toContain('lon');
    expect(url.search.toLowerCase()).not.toContain('51.5');
    expect(decodeURIComponent(url.search)).not.toContain('London');

    await expect(print.getByRole('heading', { level: 1 })).toHaveText(
      'Prayer times for London',
    );
    expect(await print.locator('tbody tr').count()).toBe(31);

    // R5 keeps the place out of the tab title and so out of the saved file's name. The
    // sheet itself names the town, because PLAN.md section 6.5 asks it to.
    const title = await print.title();
    expect(title).toBe('SajdaTime timetable, October 2026');
    expect(title).not.toContain('London');
    expect(title).not.toMatch(/51\.5/);
  } finally {
    await extension.close();
  }
});

test('the footer has two full width pills that fit the popup', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const settings = extension.page.getByRole('button', { name: 'Settings' });
    const save = extension.page.getByRole('button', { name: 'Save as PDF' });
    const first = await settings.boundingBox();
    const second = await save.boundingBox();
    if (!first || !second) throw new Error('footer buttons are not laid out');

    expect(Math.abs(first.y - second.y)).toBeLessThan(1);
    expect(first.height).toBeGreaterThanOrEqual(48);
    expect(second.height).toBeGreaterThanOrEqual(48);
    // Equal halves, 8 px apart, inside the 380 px popup and its 16 px margins.
    expect(Math.abs(first.width - second.width)).toBeLessThan(1);
    expect(first.x).toBeGreaterThanOrEqual(16);
    expect(second.x).toBeGreaterThan(first.x + first.width);
    expect(second.x + second.width).toBeLessThanOrEqual(364);
    expect(second.x - (first.x + first.width)).toBeGreaterThanOrEqual(7);

    // Neither label wraps and neither overflows its pill. A wrapped label would give the
    // text two line boxes, and a crowded one would push past the button's content width.
    const labels = await extension.page.evaluate(() => {
      const buttons = [...document.querySelectorAll('.footer-actions .action')];
      return buttons.map((button) => {
        const range = document.createRange();
        range.selectNodeContents(button);
        return {
          text: button.textContent?.trim() ?? '',
          lines: range.getClientRects().length,
          overflow: button.scrollWidth - button.clientWidth,
        };
      });
    });
    expect(labels.map((entry) => entry.text)).toEqual(['Settings', 'Save as PDF']);
    for (const entry of labels) {
      expect(entry.lines, entry.text).toBe(1);
      expect(entry.overflow, entry.text).toBeLessThanOrEqual(1);
    }

    const popupHeight = await extension.page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    expect(popupHeight).toBeLessThanOrEqual(600);
  } finally {
    await extension.close();
  }
});

test('the month table holds every day and the same times as the popup', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const popupFajr = await extension.page.getByTestId('time-fajr').textContent();
    const print = await openTimetable(extension, '?month=2026-10&kind=month');

    const rows = print.locator('tbody tr');
    expect(await rows.count()).toBe(31);
    await expect(rows.first()).toHaveAttribute('data-date', '2026-10-01');
    await expect(rows.last()).toHaveAttribute('data-date', '2026-10-31');

    // Today is shaded, and the page says so in words as well as in colour.
    await expect(print.locator('tr.is-today')).toHaveAttribute('data-date', '2026-10-27');
    await expect(print.locator('.print-note', { hasText: 'Today' })).toHaveCount(1);

    // Same engine as the popup, so the same Fajr on the same day in the same style.
    const row = print.locator('tr[data-date="2026-10-27"]');
    const fajr = await row.locator('td.time').first().textContent();
    expect(fajr?.trim()).toBeTruthy();
    expect(popupFajr).toContain(fajr?.trim() ?? '');
  } finally {
    await extension.close();
  }
});

test('the Hijri column and the header name the months of the table', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const print = await openTimetable(extension, '?month=2026-10&kind=month');
    const headers = await print.locator('thead th').allTextContents();
    expect(headers).toEqual([
      'Date',
      'Day',
      'Hijri',
      'Fajr',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Maghrib',
      'Isha',
    ]);
    await expect(print.locator('.print-line').first()).toContainText('October 2026');
    await expect(print.locator('.print-line').first()).toContainText(
      "Rabi' al-Thani to Jumada al-Awwal 1448",
    );
    const hijri = await print
      .locator('tr[data-date="2026-10-01"] td.hijri')
      .textContent();
    expect(hijri?.trim()).toBe("20 Rabi' al-Thani");
  } finally {
    await extension.close();
  }
});

test('the clock change footnote appears in October and not in June', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const october = await openTimetable(extension, '?month=2026-10&kind=month');
    const notes = await october.locator('.print-note').allTextContents();
    expect(notes).toContain(
      'Clocks go back on Sunday 25 October. Times from that day are in GMT.',
    );

    const june = await openTimetable(extension, '?month=2026-06&kind=month');
    const juneNotes = await june.locator('.print-note').allTextContents();
    expect(juneNotes.join(' ')).not.toContain('Clocks');
    await expect(june.locator('tbody tr')).toHaveCount(30);
  } finally {
    await extension.close();
  }
});

test('the page is one A4 sheet at 12 pt, black on white, with the buttons hidden', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const print = await openTimetable(extension, '?month=2026-10&kind=month');
    await setTheme(print, 'dark');

    // The paper size comes from the page's own @page rule, not from the caller.
    const pdf = await print.pdf({ preferCSSPageSize: true });
    const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf.toString('latin1'));
    if (!box) throw new Error('no page box in the PDF');
    expect(Math.round(Number(box[1]))).toBe(595);
    expect(Math.round(Number(box[2]))).toBe(842);
    expect(await countPdfPages(pdf)).toBe(1);

    await print.emulateMedia({ media: 'print' });
    await expect(print.locator('.print-bar')).toBeHidden();
    await expect(print.locator('table.print-table')).toBeVisible();

    const drawn = await print.evaluate(() => {
      const cell = document.querySelector('tbody td.time');
      const footer = document.querySelector('.print-foot');
      const shaded = document.querySelector('tr.is-today td');
      if (!cell || !footer || !shaded) return null;
      const read = (element: Element) => {
        const style = getComputedStyle(element);
        return { color: style.color, size: parseFloat(style.fontSize), background: style.backgroundColor };
      };
      return { cell: read(cell), footer: read(footer), shaded: read(shaded), body: read(document.body) };
    });
    if (!drawn) throw new Error('the printed page is missing its parts');
    expect(drawn.body.color).toBe('rgb(0, 0, 0)');
    expect(drawn.body.background).toBe('rgb(255, 255, 255)');
    expect(drawn.cell.color).toBe('rgb(0, 0, 0)');
    expect(drawn.footer.color).toBe('rgb(0, 0, 0)');
    // 12 pt is 16 px.
    expect(drawn.cell.size).toBeGreaterThanOrEqual(16);
    expect(drawn.footer.size).toBeGreaterThanOrEqual(16);
    // The shaded row is a tint of the paper, never a colour that could print grey.
    expect(drawn.shaded.background).toBe('rgb(245, 245, 245)');
  } finally {
    await extension.close();
  }
});

test('the Ramadan timetable replaces the columns and numbers the days', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const print = await openTimetable(extension, '?month=2027-02&kind=ramadan');

    await expect(print.getByRole('heading', { level: 1 })).toHaveText(
      'Ramadan timetable for London',
    );
    const headers = await print.locator('thead th').allTextContents();
    expect(headers).toEqual([
      'Day of Ramadan',
      'Date',
      'Day',
      'Suhoor ends',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Iftar',
      'Isha',
    ]);

    const rows = print.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(29);
    expect(count).toBeLessThanOrEqual(30);
    await expect(rows.first()).toHaveAttribute('data-date', '2027-02-08');
    expect((await rows.first().locator('td').first().textContent())?.trim()).toBe('1');
    expect((await rows.last().locator('td').first().textContent())?.trim()).toBe(
      String(count),
    );
    await expect(print.locator('.print-line').first()).toContainText('Ramadan 1448');
    // The span crosses into March, so the date column names the month.
    await expect(rows.last().locator('td').nth(1)).toContainText('Mar');

    await print.getByRole('button', { name: 'Month timetable' }).click();
    await expect(print.locator('thead th').first()).toHaveText('Date');
    await expect(print.locator('tbody tr')).toHaveCount(28);
  } finally {
    await extension.close();
  }
});

test('the Ramadan table is offered in Ramadan and near it, and not otherwise', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);

    const ramadan = await openTimetable(extension, '?month=2027-02&kind=month');
    await expect(
      ramadan.getByRole('button', { name: 'Ramadan timetable' }),
    ).toBeVisible();

    const june = await openTimetable(extension, '?month=2026-06&kind=month');
    await expect(june.getByRole('button', { name: 'Ramadan timetable' })).toHaveCount(0);

    // Thirty days before Ramadan the offer appears, because the plan asks for it then.
    const before = await openTimetable(
      extension,
      '?month=2027-01&kind=month',
      new Date('2027-01-20T09:00:00Z'),
    );
    await expect(before.getByRole('button', { name: 'Ramadan timetable' })).toBeVisible();
  } finally {
    await extension.close();
  }
});

test('the month moves forward and back within the page', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const print = await openTimetable(extension, '?month=2026-10&kind=month');
    await print.getByRole('button', { name: 'Next month' }).click();
    await expect(print.locator('.print-line').first()).toContainText('November 2026');
    await expect(print.locator('tbody tr')).toHaveCount(30);
    await print.getByRole('button', { name: 'Previous month' }).click();
    await expect(print.locator('.print-line').first()).toContainText('October 2026');
    await print.getByRole('button', { name: 'Previous month' }).click();
    await expect(print.locator('.print-line').first()).toContainText('September 2026');
  } finally {
    await extension.close();
  }
});

test('a bad month falls back to the current one instead of breaking', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const print = await openTimetable(extension, '?month=2026-13&kind=elsewhere');
    await expect(print.locator('.print-line').first()).toContainText('October 2026');
    await expect(print.locator('table.print-table')).toBeVisible();
  } finally {
    await extension.close();
  }
});

test('the page asks for setup instead of printing nothing', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    const print = await extension.context.newPage();
    await print.clock.install({ time: FIXED_TIME });
    await print.goto(`chrome-extension://${extension.id}/print/index.html`);
    await expect(print.getByRole('heading', { level: 1 })).toHaveText('Set up SajdaTime first');
    await expect(print.locator('table')).toHaveCount(0);
  } finally {
    await extension.close();
  }
});

test('the timetable has no WCAG 2.2 AA violations in either theme', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension);
    const print = await openTimetable(extension, '?month=2026-10&kind=month');
    await print.addInitScript({ path: axePath });
    await print.reload();
    await print.waitForSelector('table.print-table');
    expectNoViolations(await audit(print));

    await setTheme(print, 'dark');
    expectNoViolations(await audit(print));

    await print.setViewportSize({ width: 900, height: 1100 });
    await setTheme(print, 'light');
    await screenshot(print, 'docs/images/pdf-month.png');
    await setTheme(print, 'dark');
    await screenshot(print, 'docs/images/pdf-month-dark.png');

    const pdf = await print.pdf({ preferCSSPageSize: true });
    if (process.env.SAJDATIME_SCREENSHOTS === '1') {
      writeFileSync('docs/images/pdf-sample.pdf', pdf);
    }

    await print.goto(`chrome-extension://${extension.id}/print/index.html?month=2027-02&kind=ramadan`);
    await print.waitForSelector('table.print-table');
    await setTheme(print, 'light');
    await screenshot(print, 'docs/images/pdf-ramadan.png');
  } finally {
    await extension.close();
  }
});
