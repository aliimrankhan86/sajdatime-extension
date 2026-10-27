import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME =
  '/Users/aliimrankhan/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

export interface Extension {
  context: BrowserContext;
  page: Page;
  id: string;
  close: () => Promise<void>;
}

export async function launchExtension(locale = 'en-GB'): Promise<Extension> {
  const dist = resolve('dist');
  const profile = mkdtempSync(join(tmpdir(), 'sajdatime-e2e-'));
  const context = await chromium.launchPersistentContext(profile, {
    executablePath: CHROME,
    headless: true,
    locale,
    viewport: { width: 380, height: 600 },
    args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
  });

  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 10_000 });
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/popup/index.html`);

  return {
    context,
    page,
    id,
    close: () => context.close(),
  };
}

export const LONDON = {
  version: 1,
  place: {
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    timeZone: 'Europe/London',
    countryCode: 'GB',
  },
  sect: 'sunni',
  method: 'mwl',
  madhab: 'shafii',
  hijriOffsetDays: 0,
};

export async function seedSettings(extension: Extension): Promise<void> {
  await extension.page.evaluate(async (settings) => {
    await chrome.storage.local.set({ 'sajdatime.settings.v1': settings });
  }, LONDON);
  await extension.page.clock.install({ time: new Date('2026-10-27T11:00:00Z') });
  await extension.page.reload();
  await extension.page.waitForSelector('.next-card');
}
