import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sizes = [16, 32, 48, 128, 300];
const svg = readFileSync(resolve('public/icons/icon.svg'), 'utf8').replace(/^<\?xml[^>]*>\s*/, '');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const size of sizes) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<!doctype html><style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    const path = resolve(`public/icons/icon-${size}.png`);
    await page.screenshot({ path, omitBackground: true });
    await page.close();
    console.log(`${path} ${size}x${size}`);
  }
} finally {
  await browser.close();
}
