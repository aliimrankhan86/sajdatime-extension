#!/usr/bin/env node
/**
 * Builds the store images from the built extension, so nothing in them is drawn by hand.
 *
 * The popup is 380 by 600, and a store wants 1280 by 800, so each screen is captured from the real
 * extension at twice the size and placed on a plain field taken from the extension's own colours.
 * The app pixels are untouched; only the margin around them is ours. The Ramadan timetable is a
 * page rather than a popup, so it is captured at the full store size.
 *
 * Run after `npm run build`: node tools/store-images.mjs   (or npm run store-images)
 * Writes docs/store/images/.
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const OUT = resolve('docs/store/images');
const DIST = resolve('dist');

function findChromium() {
  if (process.env.SAJATIME_CHROME) return process.env.SAJATIME_CHROME;
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
            join(cache, build, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
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

/** The same fixture the suite uses, so the screenshots show the state the tests check. */
const LONDON = {
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
  alerts: {
    enabled: false,
    sound: 'beep',
    prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    reminder: { enabled: false, minutes: 10 },
  },
  suhoorReminder: { enabled: false, minutes: 30 },
  ramadanCard: true,
  theme: 'system',
  language: 'auto',
};

const LIGHT = '#f7f5f3';
const DARK = '#101312';
const GREEN = '#0b5a43';

async function launch(executablePath) {
  const profile = mkdtempSync(join(tmpdir(), 'sajdatime-store-'));
  const context = await chromium.launchPersistentContext(profile, {
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    locale: 'en-GB',
    deviceScaleFactor: 2,
    viewport: { width: 380, height: 600 },
    args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
  });
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker', { timeout: 15_000 }));
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/popup/index.html`);
  return { context, page, id, profile };
}

async function settle(page) {
  await page.waitForSelector('.next-card');
  // One painted frame after the clock formats, so the countdown is not caught mid-swap.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

async function popupShot(executablePath, settings, time, file) {
  const { context, page, profile } = await launch(executablePath);
  try {
    await page.evaluate(async (stored) => {
      await chrome.storage.local.clear();
      await chrome.storage.local.set({ 'sajdatime.settings.v1': stored });
    }, settings);
    await page.clock.install({ time });
    await page.reload();
    await settle(page);
    const buffer = await page.screenshot({ type: 'png' });
    writeFileSync(join(OUT, file), buffer);
    const words = (await page.locator('body').innerText()).split('\n').filter(Boolean).slice(0, 8);
    console.log(`${file}: ${words.join(' | ')}`);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}

async function methodStepShot(executablePath) {
  const { context, page, profile } = await launch(executablePath);
  try {
    await page.evaluate(() => chrome.storage.local.clear());
    await page.clock.install({ time: new Date('2026-10-27T09:00:00Z') });
    await page.reload();
    await page.waitForSelector('[data-autofocus]');
    for (const label of ['Begin', 'I understand', 'Sunni', 'Continue']) {
      await page.getByRole('button', { name: label, exact: true }).click();
    }
    // The madhab row's spoken name is the row, which is the school plus the other schools sharing
    // its Asr rule, so it is matched by its first words rather than exactly.
    await page.getByRole('button', { name: /^Shafi'i/ }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: /Skip for now and use Makkah/ }).click();
    // Makkah fills the location step rather than skipping it, so that step needs its Continue.
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    // The method step opens on the suggested method. Open the full list, which is the screen that
    // shows all thirteen methods and their times.
    await page.locator('.method-chooser').click();
    await page.waitForSelector('.method-row');
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    const buffer = await page.screenshot({ type: 'png' });
    writeFileSync(join(OUT, 'method-step.png'), buffer);
    const words = (await page.locator('body').innerText()).split('\n').filter(Boolean).slice(0, 8);
    console.log(`method-step.png: ${words.join(' | ')}`);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}

/** Draws a captured popup on a plain field at exactly 1280 by 800. */
async function compose(page, popupPng, background, file) {
  const base64 = popupPng.toString('base64');
  await page.setContent(`<canvas id="sheet" width="1280" height="800"></canvas>`);
  await page.evaluate(
    async ({ data, background }) => {
      const canvas = document.getElementById('sheet');
      const context = canvas.getContext('2d');
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();

      // 752 high leaves 24 pixels of field above and below, and keeps the popup's own proportions.
      const height = 752;
      const width = Math.round((image.width / image.height) * height);
      const x = Math.round((canvas.width - width) / 2);
      const y = Math.round((canvas.height - height) / 2);
      const radius = 16;

      context.save();
      context.shadowColor = 'rgba(0, 0, 0, 0.18)';
      context.shadowBlur = 28;
      context.shadowOffsetY = 8;
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
      context.fillStyle = '#fdfcfb';
      context.fill();
      context.restore();

      context.save();
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
      context.clip();
      context.drawImage(image, x, y, width, height);
      context.restore();
    },
    { data: base64, background },
  );
  await page.locator('#sheet').screenshot({ path: join(OUT, file) });
  console.log(`${file}: 1280x800 on ${background}`);
}

async function promoShot(page, iconBase64) {
  await page.setContent(`<canvas id="tile" width="440" height="280"></canvas>`);
  await page.evaluate(
    async ({ icon, green }) => {
      const canvas = document.getElementById('tile');
      const context = canvas.getContext('2d');
      context.fillStyle = green;
      context.fillRect(0, 0, canvas.width, canvas.height);

      const image = new Image();
      image.src = `data:image/png;base64,${icon}`;
      await image.decode();
      const size = 104;
      context.drawImage(image, (canvas.width - size) / 2, 40, size, size);

      context.fillStyle = '#ffffff';
      context.font = '600 40px system-ui, -apple-system, Segoe UI, Tahoma, sans-serif';
      context.textAlign = 'center';
      context.fillText('SajdaTime', canvas.width / 2, 214);
    },
    { icon: iconBase64, green: GREEN },
  );
  await page.locator('#tile').screenshot({ path: join(OUT, 'promo-tile-440x280.png') });
  console.log('promo-tile-440x280.png: 440x280');
}

/** Reads the width and height out of a PNG header, so the claim is checked, not assumed. */
function pngSize(file) {
  const buffer = readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

if (!existsSync(DIST)) throw new Error('dist is missing. Run npm run build first.');
mkdirSync(OUT, { recursive: true });
const executablePath = findChromium();

await popupShot(
  executablePath,
  { ...LONDON, theme: 'light' },
  new Date('2026-10-27T11:00:00Z'),
  '.times-light-popup.png',
);
await methodStepShot(executablePath);
await popupShot(executablePath, { ...LONDON, theme: 'dark' }, new Date('2026-10-27T11:00:00Z'), '.times-dark-popup.png');
await popupShot(
  executablePath,
  { ...LONDON, theme: 'light' },
  new Date('2027-02-08T12:00:00Z'),
  '.ramadan-popup.png',
);
await popupShot(
  executablePath,
  { ...LONDON, theme: 'light', language: 'ur' },
  new Date('2026-10-27T11:00:00Z'),
  '.times-urdu-popup.png',
);

const composer = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
  viewport: { width: 1280, height: 800 },
});
try {
  const page = await composer.newPage();
  await compose(page, readFileSync(join(OUT, '.times-light-popup.png')), LIGHT, 'times-light.png');
  await compose(page, readFileSync(join(OUT, '.times-dark-popup.png')), DARK, 'times-dark.png');
  await compose(page, readFileSync(join(OUT, '.ramadan-popup.png')), LIGHT, 'ramadan.png');
  await compose(page, readFileSync(join(OUT, '.times-urdu-popup.png')), LIGHT, 'times-urdu.png');

  // The method step is a full screen in the popup, so it composes like the others.
  const methodComposer = await composer.newPage();
  await methodComposer.setViewportSize({ width: 1280, height: 800 });
  await compose(methodComposer, readFileSync(join(OUT, 'method-step.png')), LIGHT, 'method-step.png');

  const icon = readFileSync(resolve('public/icons/icon-300.png')).toString('base64');
  await promoShot(page, icon);

  // A blank or misplaced image would pass a size check, so read two pixels: the corner has to be
  // the field colour and the middle has to be the app. This is the check a person does by looking.
  for (const [file, field] of [
    ['times-light.png', LIGHT],
    ['times-dark.png', DARK],
    ['ramadan.png', LIGHT],
    ['times-urdu.png', LIGHT],
    ['method-step.png', LIGHT],
  ]) {
    const pixels = await page.evaluate(
      async ({ data }) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const read = (x, y) =>
          [...context.getImageData(x, y, 1, 1).data]
            .slice(0, 3)
            .map((value) => value.toString(16).padStart(2, '0'))
            .join('');
        // One middle pixel is not enough: the dark theme's own background is the same colour as the
        // field, so a column of samples is read and any difference counts as the app drawing.
        const column = [];
        for (let y = 40; y < image.height - 40; y += 40) column.push(read(image.width / 2, y));
        return { corner: read(2, 2), column };
      },
      { data: readFileSync(join(OUT, file)).toString('base64') },
    );
    const expected = field.replace('#', '');
    if (pixels.corner !== expected) throw new Error(file + ': corner is ' + pixels.corner + ', not ' + expected);
    if (pixels.column.every((pixel) => pixel === expected)) {
      throw new Error(file + ': the middle column is empty field, so the app did not draw');
    }
    console.log('ok   ' + file + ': field ' + expected + ', app pixels in the middle');
  }
} finally {
  await composer.close();
}

copyFileSync(resolve('public/icons/icon-300.png'), join(OUT, 'logo-300.png'));
for (const file of [
  '.times-light-popup.png',
  '.times-dark-popup.png',
  '.ramadan-popup.png',
  '.times-urdu-popup.png',
]) {
  rmSync(join(OUT, file), { force: true });
}

const expected = {
  'times-light.png': [1280, 800],
  'times-dark.png': [1280, 800],
  'method-step.png': [1280, 800],
  'ramadan.png': [1280, 800],
  'times-urdu.png': [1280, 800],
  'promo-tile-440x280.png': [440, 280],
  'logo-300.png': [300, 300],
};
let bad = 0;
for (const [file, [width, height]] of Object.entries(expected)) {
  const size = pngSize(join(OUT, file));
  const ok = size.width === width && size.height === height;
  if (!ok) bad += 1;
  console.log(`${ok ? 'ok  ' : 'WRONG'} ${file}: ${size.width}x${size.height}`);
}
if (bad > 0) throw new Error(`${bad} image(s) are the wrong size`);
console.log('store images done');
