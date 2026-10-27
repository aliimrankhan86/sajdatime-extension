import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchExtension, seedSettings } from './extension';

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

    await extension.page.emulateMedia({ colorScheme: 'dark' });
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

    await extension.page.emulateMedia({ colorScheme: 'dark' });
    expectNoViolations(await audit(extension.page));

    await extension.page.getByRole('button', { name: 'Change' }).click();
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
    expectNoViolations(await audit(extension.page));

    await extension.page.getByRole('searchbox', { name: 'Or find a place' }).fill('London');
    await expect(extension.page.locator('.city-result').first()).toBeVisible();
    expectNoViolations(await audit(extension.page));
  } finally {
    await extension.close();
  }
});
