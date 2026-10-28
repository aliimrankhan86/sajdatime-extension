import { chromium, expect, test } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { createServer } from 'node:net';
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
 *
 * Why this test was intermittent when the whole suite ran (Step 8 review, 28 October
 * 2026): it measured the first frame in which the footer existed. Under suite load the
 * popup target is listed before the document has loaded and before Chrome has finished
 * sizing the window to the document, so a single early read sometimes saw a half sized
 * window. It also used a fixed port (9333), which a Chrome left behind by an earlier
 * run can still hold. The test now takes a free port at run time and waits for the
 * document to reach `complete` and the measurements to be identical twice in a row,
 * which is a settled size rather than a sleep. Nothing about the assertions changed.
 */

/** A port the OS confirms is free right now, so a stale Chrome cannot answer instead. */
async function freePort(): Promise<number> {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.unref();
    server.on('error', rejectPort);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => {
        if (port > 0) resolvePort(port);
        else rejectPort(new Error('the OS did not give a free port'));
      });
    });
  });
}

interface CdpTarget {
  id: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

async function cdpTargets(port: number): Promise<CdpTarget[]> {
  const response = await fetch(`http://127.0.0.1:${port}/json`);
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

/** The popup target is listed before the page exists, so keep asking until it does. */
async function waitForPopupTarget(port: number, timeoutMs: number): Promise<CdpTarget | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const targets = await cdpTargets(port);
      const popup = targets.find(
        (target) => target.type === 'page' && target.url.includes('/popup/index.html'),
      );
      if (popup) return popup;
    } catch {
      // The debugging endpoint is still starting, or the target went away. Ask again.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  return null;
}

const MEASURE = `(() => {
  const button = document.querySelector('.footer-settings');
  const rect = button ? button.getBoundingClientRect() : null;
  return {
    ready: !!rect && rect.width > 0,
    readyState: document.readyState,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    bodyWidth: document.body.getBoundingClientRect().width,
    settingsVisible: !!rect && rect.left >= 0 && rect.right <= window.innerWidth,
  };
})()`;

interface PopupMeasurement {
  ready: boolean;
  readyState: string;
  innerWidth: number;
  innerHeight: number;
  bodyWidth: number;
  settingsVisible: boolean;
}

function settledSize(previous: PopupMeasurement, current: PopupMeasurement): boolean {
  return (
    previous.innerWidth === current.innerWidth &&
    previous.innerHeight === current.innerHeight &&
    previous.bodyWidth === current.bodyWidth &&
    previous.settingsVisible === current.settingsVisible
  );
}

/**
 * Reads the popup until the document has loaded and two consecutive reads agree. Chrome
 * sizes the popup after the first layout, so an early single read can catch a window
 * that is still growing. Waiting for agreement is the settled size without a fixed sleep.
 */
async function measureSettled(target: CdpTarget): Promise<PopupMeasurement> {
  const deadline = Date.now() + 20_000;
  let previous: PopupMeasurement | null = null;
  while (Date.now() < deadline) {
    let current: PopupMeasurement | null = null;
    try {
      current = (await evaluateOnTarget(target, MEASURE)) as PopupMeasurement;
    } catch {
      // The target is still attaching. Try again.
    }
    if (current && current.ready && current.readyState === 'complete') {
      if (previous && settledSize(previous, current)) return current;
      previous = current;
    } else {
      previous = null;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  throw new Error('the popup size never settled at a loaded document');
}

test('the real action popup opens at 380 by 600 with Settings visible', async () => {
  const dist = resolve('dist');
  const profile = mkdtempSync(join(tmpdir(), 'sajdatime-popup-'));
  const executablePath = findChromium();
  const debugPort = await freePort();
  const context = await chromium.launchPersistentContext(profile, {
    ...(executablePath ? { executablePath } : {}),
    headless: false, // headless never surfaces the popup target, so this one test is headful
    locale: 'en-GB',
    viewport: { width: 380, height: 600 },
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`,
      `--remote-debugging-port=${debugPort}`,
    ],
  });

  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 20_000 });

    // Seed settings from the service worker and open a normal page in front, so the
    // only target whose URL contains /popup/index.html is the real action popup.
    await worker.evaluate(async (settings) => {
      await chrome.storage.local.set({ 'sajdatime.settings.v1': settings });
    }, LONDON);

    const page = await context.newPage();
    await page.goto('about:blank');

    // If the debug endpoint is not listening yet, the first attempt can throw before the
    // popup opens. Three attempts over a fresh target is plenty, and a real failure
    // still surfaces as the settled-measurement error below.
    let target: CdpTarget | null = null;
    for (let attempt = 0; attempt < 3 && !target; attempt += 1) {
      try {
        await worker.evaluate(async () => {
          await chrome.action.openPopup();
        });
      } catch {
        // The window may not be focused yet. The target check below decides.
      }
      target = await waitForPopupTarget(debugPort, 8_000);
    }
    expect(target, 'the action popup target never appeared over the debugging port').not.toBeNull();

    const measured = await measureSettled(target as CdpTarget);

    expect(measured.innerWidth).toBe(380);
    expect(measured.innerHeight).toBe(600);
    expect(measured.bodyWidth).toBe(380);
    expect(measured.settingsVisible).toBe(true);
  } finally {
    await context.close();
  }
});
