import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, LONDON, seedSettings, setTheme, walkToLocation } from './extension';

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

test('Times has no WCAG 2.2 AA violations', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.addInitScript({ path: axePath });
    await seedSettings(extension);
    expectNoViolations(await audit(extension.page));

    await setTheme(extension.page, 'dark');
    expectNoViolations(await audit(extension.page));
  } finally {
    await extension.close();
  }
});

test('Settings and Location have no WCAG 2.2 AA violations', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.addInitScript({ path: axePath });
    await seedSettings(extension);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    expectNoViolations(await audit(extension.page));

    await setTheme(extension.page, 'dark');
    expectNoViolations(await audit(extension.page));

    await extension.page.locator('[data-row="place"]').click();
    await expect(extension.page.getByRole('heading', { name: 'Location' })).toBeVisible();
    expectNoViolations(await audit(extension.page));
  } finally {
    await extension.close();
  }
});

test('first run and its search results have no WCAG 2.2 AA violations', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    await extension.page.addInitScript({ path: axePath });
    await extension.page.reload();
    expectNoViolations(await audit(extension.page)); // welcome

    await walkToLocation(extension);
    expectNoViolations(await audit(extension.page)); // location step

    await extension.page.getByRole('searchbox', { name: 'Or type a place' }).fill('London');
    await expect(extension.page.locator('.city-result').first()).toBeVisible();
    expectNoViolations(await audit(extension.page)); // search results

    await setTheme(extension.page, 'dark');
    expectNoViolations(await audit(extension.page));
  } finally {
    await extension.close();
  }
});

test('every first-run step has no WCAG 2.2 AA violations in both themes', async () => {
  const extension = await launchExtension();
  const page = extension.page;
  try {
    await page.evaluate(async () => chrome.storage.local.clear());
    await page.addInitScript({ path: axePath });
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

    const check = async () => {
      expectNoViolations(await audit(page));
      await setTheme(page, 'dark');
      expectNoViolations(await audit(page));
      await setTheme(page, 'light');
    };

    await expect(page.getByRole('button', { name: 'Begin' })).toBeVisible();
    await check(); // welcome

    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible();
    await check(); // language sheet
    await page.getByRole('button', { name: 'Back' }).click();

    await page.getByRole('button', { name: 'Begin' }).click();
    await check(); // disclaimer
    await page.getByRole('button', { name: 'Read in full' }).click();
    await expect(page.getByRole('heading', { name: 'Disclaimer' })).toBeVisible();
    await check(); // full disclaimer
    await page.getByRole('button', { name: 'Back' }).click();

    await page.getByRole('button', { name: 'I understand' }).click();
    await check(); // school

    await page.getByRole('button', { name: 'Sunni' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await check(); // madhab

    await page.getByRole('button', { name: "Shafi'i" }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await check(); // location

    await page.getByRole('button', { name: 'Allow location' }).click();
    await expect(page.getByRole('status')).toContainText('Leeds');
    await check(); // location found

    await page.getByRole('button', { name: 'Continue' }).click();
    await check(); // method

    await page.getByRole('button', { name: 'Continue' }).click();
    await check(); // alerts

    await page.getByRole('button', { name: 'Finish' }).click();
    await page.waitForSelector('.next-card', { timeout: 20_000 });
    await check(); // times
  } finally {
    await extension.close();
  }
});

test('Settings with the Alerts group open has no WCAG 2.2 AA violations', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.addInitScript({ path: axePath });
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true },
    });
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
    await expect(extension.page.getByRole('button', { name: 'Sound, Soft beep' })).toBeVisible();
    expectNoViolations(await audit(extension.page));

    await setTheme(extension.page, 'dark');
    expectNoViolations(await audit(extension.page));
  } finally {
    await extension.close();
  }
});

test('the location found panel has no WCAG 2.2 AA violations', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.evaluate(async () => chrome.storage.local.clear());
    await extension.page.addInitScript({ path: axePath });
    await extension.page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (ok: (position: unknown) => void) =>
            ok({ coords: { latitude: 53.8, longitude: -1.55 } }),
        },
      });
    });
    await extension.page.reload();
    await walkToLocation(extension);
    await extension.page.getByRole('button', { name: 'Allow location' }).click();
    await expect(extension.page.getByRole('status')).toContainText('Leeds');
    expectNoViolations(await audit(extension.page));

    await setTheme(extension.page, 'dark');
    expectNoViolations(await audit(extension.page));
  } finally {
    await extension.close();
  }
});
