import { expect, type Page, test } from '@playwright/test';
import { launchExtension, LONDON, seedSettings } from './extension';

/**
 * The Step 6 review asked for a Row that is one line of layout: a 36px icon tile, the
 * title over the value with a 4px gap, the chevron, all centred, in 56 to 64px. It also
 * asked that a group heading show only when the group has two or more rows, and that the
 * method sheet name each method exactly once.
 */

const ALERTS_ON = { ...LONDON, alerts: { ...LONDON.alerts, enabled: true } };

interface Box {
  top: number;
  bottom: number;
  height: number;
  centre: number;
}

interface RowGeometry {
  id: string;
  row: Box;
  title: Box | null;
  value: Box | null;
  icon: Box | null;
  copy: Box | null;
  chevron: Box | null;
}

/** Read every row's boxes in the page, so the assertions can stay in the test. */
async function rowGeometry(page: Page): Promise<RowGeometry[]> {
  return page.evaluate(() => {
    const box = (el: Element) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        centre: rect.top + rect.height / 2,
      };
    };
    return Array.from(document.querySelectorAll<HTMLElement>('[data-row]')).map((row) => {
      const title = row.querySelector('.row-title');
      const value = row.querySelector('.row-value');
      const icon = row.querySelector('.row-icon');
      const copy = row.querySelector('.row-copy');
      const chevron = row.querySelector('.row-chevron');
      return {
        id: row.dataset.row ?? '(unnamed row)',
        row: box(row),
        title: title ? box(title) : null,
        value: value ? box(value) : null,
        icon: icon ? box(icon) : null,
        copy: copy ? box(copy) : null,
        chevron: chevron ? box(chevron) : null,
      };
    });
  });
}

/** Each group's heading (if any) and how many row-shaped children it holds. */
async function groupHeadings(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.group-card')).map((card) => ({
      heading: card.querySelector(':scope > .group-title')?.textContent?.trim() ?? null,
      rows: card.querySelectorAll(':scope > .row, :scope > .switch-row').length,
    })),
  );
}

async function openMethodSheet(page: Page) {
  await page.locator('[data-row="method"]').click();
  await expect(page.getByRole('heading', { name: 'Calculation method' })).toBeFocused();
  return page.evaluate(() => ({
    ids: Array.from(document.querySelectorAll('.method-row')).map(
      (row) => row.getAttribute('data-method') ?? '',
    ),
    names: Array.from(document.querySelectorAll('.method-name')).map(
      (name) => name.textContent?.trim() ?? '',
    ),
    groups: Array.from(document.querySelectorAll('.method-group-title')).map(
      (group) => group.textContent?.trim() ?? '',
    ),
  }));
}

test('every Settings row is one compact line of layout', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), ALERTS_ON);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Prayer times' })).toBeVisible();

    const rows = await rowGeometry(extension.page);
    expect(rows.length).toBeGreaterThanOrEqual(9);

    for (const row of rows) {
      expect(row.row.height, `${row.id} is a 56 to 64 row`).toBeGreaterThanOrEqual(56);
      expect(row.row.height, `${row.id} is a 56 to 64 row`).toBeLessThanOrEqual(64);

      if (row.title && row.value) {
        // The title and the value sit 4 apart, not pushed apart by a stray flex item.
        expect(
          Math.abs(row.value.top - row.title.bottom - 4),
          `${row.id} title and value are 4 apart`,
        ).toBeLessThanOrEqual(0.5);
      }

      // The icon, the text block and the chevron share one vertical centre within 1px.
      const centres = [row.icon?.centre, row.copy?.centre, row.chevron?.centre].filter(
        (centre): centre is number => centre !== undefined,
      );
      expect(centres.length, `${row.id} has parts to centre`).toBeGreaterThanOrEqual(2);
      for (const centre of centres) {
        expect(
          Math.abs(centre - row.row.centre),
          `${row.id} parts share the row centre`,
        ).toBeLessThanOrEqual(1);
      }
    }
  } finally {
    await extension.close();
  }
});

test('a group heading shows only when the group has two or more rows', async () => {
  const extension = await launchExtension();
  try {
    // Alerts off: the Alerts group then holds the master switch alone.
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), LONDON);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    const off = await groupHeadings(extension.page);
    for (const group of off) {
      expect(group.rows, 'every group holds a row').toBeGreaterThanOrEqual(1);
      expect(group.heading !== null, `heading over ${group.rows} row(s)`).toBe(group.rows >= 2);
    }
    // The Disclaimer row stays first, and the two groups the review named lose the
    // heading that only repeated their single row.
    expect(off[0]?.heading).toBeNull();
    expect(off.some((group) => group.heading === 'Place')).toBe(false);

    // Turning alerts on adds the five prayers and the Sound row, so the heading returns.
    await extension.page.getByRole('switch', { name: 'Prayer alerts' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();

    for (const group of await groupHeadings(extension.page)) {
      expect(group.heading !== null, `heading over ${group.rows} row(s)`).toBe(group.rows >= 2);
    }
  } finally {
    await extension.close();
  }
});

test('a Sunni method list names each method once and never a Shia one', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), LONDON);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    const { ids, names, groups } = await openMethodSheet(extension.page);

    // No method twice: the suggested ones are left out of the region groups below.
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(11);

    // No Shia method and no Shia heading for a Sunni user.
    expect(names).not.toContain('Jafari (Ithna Ashari)');
    expect(names).not.toContain('Institute of Geophysics, Tehran');
    expect(groups).not.toContain('Shia');

    // The UK suggestion opens the list, then the regions hold the rest once.
    expect(groups[0]).toBe('Suggested for United Kingdom');
    expect(names.slice(0, 3)).toEqual([
      'Moonsighting Committee',
      'ISNA, North America',
      'University of Karachi',
    ]);
  } finally {
    await extension.close();
  }
});

test('a Shia method list is exactly the two Shia methods', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      sect: 'shia',
      method: 'jafari',
    });
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    const { ids, names, groups } = await openMethodSheet(extension.page);

    expect(ids).toEqual(['jafari', 'tehran']);
    expect(names).toEqual(['Jafari (Ithna Ashari)', 'Institute of Geophysics, Tehran']);
    expect(groups).toEqual(['Shia']);
  } finally {
    await extension.close();
  }
});
