import { chromium, expect, test } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { findChromium, LONDON } from './extension';

/**
 * This is the one test that opens the real toolbar popup and measures it, because
 * every other end-to-end test opens the popup as a 380 by 600 tab. Chrome sizes an
 * action popup to the document's intrinsic width, so the popup itself must be checked.
 *
 * `chrome.action.openPopup()` resolves under Playwright's headless Chrome but never
 * surfaces a measurable page target, so this test runs in headful Chrome for Testing
 * with a remote debugging port and reads the popup target straight from the DevTools
 * protocol. The assertions are the real window size, the real body width, and whether
 * the Settings button is fully inside the viewport.
 */

const DEBUG_PORT = 9333;

interface CdpTarget {
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

async function cdpTargets(): Promise<CdpTarget[]> {
  const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  return (await response.json()) as CdpTarget[];
}

async function evaluateOnTarget(target: CdpTarget, expression: string): Promise<unknown> {
  return new Promise((resolvePromise, rejectPromise) => {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const id = 1;
    const timer = setTimeout(() => {
      socket.close();
      rejectPromise(new Error('DevTools evaluate timed out'));
    }, 10_000);

    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue: true },
        }),
      );
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as {
        id: number;
        error?: { message: string };
        result?: { result?: { value: unknown } };
      };
      if (message.id !== id) return;
      clearTimeout(timer);
      socket.close();
      if (message.error) rejectPromise(new Error(message.error.message));
      else resolvePromise(message.result?.result?.value);
    });

    socket.addEventListener('error', (error) => rejectPromise(error));
  });
}

async function waitForPopupTarget(): Promise<CdpTarget> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const targets = await cdpTargets();
    const popup = targets.find(
      (target) => target.type === 'page' && target.url.includes('/popup/index.html'),
    );
    if (popup) return popup;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error('the action popup target never appeared over the debugging port');
}

const MEASURE = `(() => {
  const button = document.querySelector('.header-button');
  const rect = button ? button.getBoundingClientRect() : null;
  return {
    ready: !!rect && rect.width > 0,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    bodyWidth: document.body.getBoundingClientRect().width,
    settingsVisible: !!rect && rect.left >= 0 && rect.right <= window.innerWidth,
  };
})()`;

// The popup target is listed before Preact has rendered the header, so poll the
// target until the Settings button exists and then take the one measurement.
interface PopupMeasurement {
  ready: boolean;
  innerWidth: number;
  innerHeight: number;
  bodyWidth: number;
  settingsVisible: boolean;
}

async function measurePopup(target: CdpTarget): Promise<PopupMeasurement> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const measurement = (await evaluateOnTarget(target, MEASURE)) as PopupMeasurement;
    if (measurement.ready) return measurement;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error('the Settings button never rendered in the popup');
}

test('the real action popup opens at 380 by 600 with Settings visible', async () => {
  const dist = resolve('dist');
  const profile = mkdtempSync(join(tmpdir(), 'sajdatime-popup-'));
  const executablePath = findChromium();
  const context = await chromium.launchPersistentContext(profile, {
    ...(executablePath ? { executablePath } : {}),
    headless: false, // headless never surfaces the popup target, so this one test is headful
    locale: 'en-GB',
    viewport: { width: 380, height: 600 },
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`,
      `--remote-debugging-port=${DEBUG_PORT}`,
    ],
  });

  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 10_000 });

    // Seed settings from the service worker and open a normal page in front, so the
    // only target whose URL contains /popup/index.html is the real action popup.
    await worker.evaluate(async (settings) => {
      await chrome.storage.local.set({ 'sajdatime.settings.v1': settings });
    }, LONDON);

    const page = await context.newPage();
    await page.goto('about:blank');

    await worker.evaluate(async () => {
      await chrome.action.openPopup();
    });

    const target = await waitForPopupTarget();
    const measured = await measurePopup(target);

    expect(measured.innerWidth).toBe(380);
    expect(measured.innerHeight).toBe(600);
    expect(measured.bodyWidth).toBe(380);
    expect(measured.settingsVisible).toBe(true);
  } finally {
    await context.close();
  }
});
