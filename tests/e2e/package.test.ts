import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { chromium } from '@playwright/test';
import { findChromium } from './extension';

/**
 * The zip is the thing Ali uploads, so it is tested, not just produced.
 *
 * `npm run package` writes artifacts/sajdatime-<version>.zip from dist. This test opens that zip,
 * checks nothing private or useless went into it, unzips it into a clean folder and loads that
 * folder into a fresh browser profile, which is as close as a machine can get to a store install.
 * A stale version, a source map, a test file or a bundle that only works from the repo all fail
 * here rather than in review.
 *
 * `unzip` is the one tool used; it ships with macOS and Linux and the suite already depends on the
 * machine having Playwright's browsers.
 */

const root = resolve('.');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string };
const zip = join(root, 'artifacts', `sajdatime-${packageJson.version}.zip`);

test('the package loads in a clean profile and carries nothing it should not', async () => {
  test.setTimeout(120_000);
  execFileSync('npm', ['run', 'package'], { cwd: root, stdio: 'pipe' });
  expect(existsSync(zip), `no zip at ${zip}`).toBe(true);

  const entries = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  // What must be inside.
  for (const needed of [
    'manifest.json',
    'background/index.js',
    'popup/index.html',
    'print/index.html',
    '_locales/en/messages.json',
    '_locales/ar/messages.json',
    '_locales/tr/messages.json',
    '_locales/id/messages.json',
    'icons/icon-16.png',
    'icons/icon-128.png',
    'THIRD-PARTY-NOTICES.txt',
  ]) {
    expect(entries, needed).toContain(needed);
  }
  expect(entries.some((entry) => entry.startsWith('audio/'))).toBe(true);
  expect(entries.some((entry) => entry.startsWith('data/'))).toBe(true);
  expect(entries.some((entry) => entry.startsWith('assets/'))).toBe(true);

  // What must never be inside.
  for (const forbidden of ['.map', '.DS_Store', 'node_modules/', 'tests/', 'src/', '.git/', 'icons/icon-300.png']) {
    expect(entries.filter((entry) => entry.includes(forbidden)), forbidden).toEqual([]);
  }

  const folder = mkdtempSync(join(tmpdir(), 'sajdatime-store-'));
  try {
    execFileSync('unzip', ['-q', zip, '-d', folder]);
    const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8')) as {
      version: string;
      name: string;
      default_locale?: string;
    };
    expect(manifest.version).toBe(packageJson.version);
    expect(manifest.default_locale).toBe('en');

    const executablePath = findChromium();
    const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'sajdatime-store-profile-')), {
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      locale: 'en-GB',
      viewport: { width: 380, height: 600 },
      args: [`--disable-extensions-except=${folder}`, `--load-extension=${folder}`],
    });
    try {
      const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker', { timeout: 15_000 }));
      const id = new URL(worker.url()).host;
      const page = await context.newPage();
      await page.goto(`chrome-extension://${id}/popup/index.html`);
      // The first run's welcome step is what a new install shows, so a rendered heading is proof
      // the packaged bundle runs rather than only parses.
      await page.waitForSelector('[data-autofocus]', { timeout: 15_000 });
      const heading = await page.locator('[data-autofocus]').innerText();
      expect(heading.length).toBeGreaterThan(0);
      const resolved = await page.evaluate(() => chrome.runtime.getManifest());
      expect(resolved.name).toBe('SajdaTime');
      expect((resolved.description ?? '').includes('__MSG_')).toBe(false);
    } finally {
      await context.close();
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
