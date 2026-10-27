import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * Playwright's own download may be missing while an older Chrome for Testing build is
 * still cached. Find either one without pinning this machine's username or version, so
 * the suite also runs on another computer.
 */
export function findChromium(): string | undefined {
  const fromEnv = process.env.SAJATIME_CHROME;
  if (fromEnv) return fromEnv;

  const bundled = chromium.executablePath();
  if (existsSync(bundled)) return bundled;

  const cache =
    process.platform === 'darwin'
      ? join(homedir(), 'Library/Caches/ms-playwright')
      : process.platform === 'linux'
        ? join(homedir(), '.cache/ms-playwright')
        : join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData/Local'), 'ms-playwright');
  if (!existsSync(cache)) return undefined;

  const builds = readdirSync(cache)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));

  for (const build of builds) {
    const candidates =
      process.platform === 'darwin'
        ? [
            join(
              cache,
              build,
              'chrome-mac-arm64',
              'Google Chrome for Testing.app',
              'Contents',
              'MacOS',
              'Google Chrome for Testing',
            ),
            join(cache, build, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
            join(cache, build, 'chrome-mac-arm64', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
          ]
        : process.platform === 'linux'
          ? [join(cache, build, 'chrome-linux', 'chrome')]
          : [join(cache, build, 'chrome-win', 'chrome.exe')];
    const found = candidates.find((candidate) => existsSync(candidate));
    if (found) return found;
  }
  return undefined;
}

export interface Extension {
  context: BrowserContext;
  page: Page;
  id: string;
  close: () => Promise<void>;
}

export interface LaunchOptions {
  deviceScaleFactor?: number;
}

export async function launchExtension(
  locale = 'en-GB',
  options: LaunchOptions = {},
): Promise<Extension> {
  const dist = resolve('dist');
  const profile = mkdtempSync(join(tmpdir(), 'sajdatime-e2e-'));
  const executablePath = findChromium();
  const context = await chromium.launchPersistentContext(profile, {
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    locale,
    viewport: { width: 380, height: 600 },
    ...(options.deviceScaleFactor ? { deviceScaleFactor: options.deviceScaleFactor } : {}),
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

export async function seedSettings(
  extension: Extension,
  time = new Date('2026-10-27T11:00:00Z'),
): Promise<void> {
  await extension.page.evaluate(async (settings) => {
    await chrome.storage.local.set({ 'sajdatime.settings.v1': settings });
  }, LONDON);
  await extension.page.clock.install({ time });
  await extension.page.reload();
  await extension.page.waitForSelector('.next-card');
}
