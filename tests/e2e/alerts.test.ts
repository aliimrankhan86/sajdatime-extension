import { expect, test } from '@playwright/test';
import { launchExtension, LONDON, seedSettings } from './extension';
import { undersizedControls } from './measures';

test('the worker schedules prayer alarms when alerts turn on and clears them when off', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true },
    });

    const alarmNames = () =>
      extension.worker.evaluate(async () => (await chrome.alarms.getAll()).map((alarm) => alarm.name));

    await expect.poll(alarmNames).toContain('refresh');
    const names = await alarmNames();
    expect(names.length).toBeGreaterThan(1);
    for (const name of names) {
      const valid =
        name === 'refresh' || /^prayer:\d{4}-\d{2}-\d{2}:(fajr|dhuhr|asr|maghrib|isha)$/.test(name);
      expect(valid).toBe(true);
    }

    await extension.page.evaluate(async (stored) => {
      await chrome.storage.local.set({ 'sajdatime.settings.v1': stored });
    }, { ...LONDON, alerts: { ...LONDON.alerts, enabled: false } });
    await expect.poll(alarmNames).toEqual([]);
  } finally {
    await extension.close();
  }
});

test('the alert controls keep 44px targets when alerts are on', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true },
    });
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
    expect(await undersizedControls(extension.page)).toEqual([]);
  } finally {
    await extension.close();
  }
});

test('makes no network requests through the whole alert and location flow', async () => {
  const extension = await launchExtension();
  try {
    // SECURITY.md R6: watch every context (popup, worker, offscreen) at once.
    const remote: string[] = [];
    extension.context.on('request', (request) => {
      if (!request.url().startsWith('chrome-extension://')) remote.push(request.url());
    });

    await extension.page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (ok: (position: unknown) => void) =>
            ok({ coords: { latitude: 53.8, longitude: -1.55 } }),
        },
      });
    });

    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true, sound: 'adhan' },
    });

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();

    // Play the adhan: this creates the offscreen audio page and loads the bundled file.
    await extension.page.getByRole('button', { name: 'Play' }).click();
    await expect(extension.page.getByRole('button', { name: 'Stop' })).toBeVisible();

    // The test alert runs the notification path from the popup through the worker.
    await extension.page.getByRole('button', { name: 'Send a test alert' }).click();

    // "Use my location" resolves through the geolocation mock, never the network.
    await extension.page.getByRole('button', { name: 'Change' }).click();
    await extension.page.getByRole('button', { name: 'Use my location' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Location found' })).toBeVisible();

    expect(remote).toEqual([]);
  } finally {
    await extension.close();
  }
});
