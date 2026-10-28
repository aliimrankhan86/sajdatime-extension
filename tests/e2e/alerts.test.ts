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

test('a fired prayer creates a notification titled with the prayer', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true, sound: 'silent' },
    });
    // getAll returns only ids, so spy on create in the worker to read the title.
    await extension.worker.evaluate(async () => {
      const g = globalThis as { __created?: { id: string; title: string }[] };
      const original = chrome.notifications.create;
      g.__created = [];
      Object.defineProperty(chrome.notifications, 'create', {
        configurable: true,
        value: (id: string, options: chrome.notifications.NotificationCreateOptions) => {
          g.__created!.push({ id, title: options.title });
          return original(id, options);
        },
      });
    });

    // A far-future prayer, fired now, so the late check does not drop it.
    await extension.worker.evaluate(async () => {
      await chrome.alarms.create('prayer:2099-01-01:fajr', { when: Date.now() });
    });

    const created = () =>
      extension.worker.evaluate(async () =>
        (globalThis as { __created?: { id: string; title: string }[] }).__created,
      );
    await expect.poll(created).toHaveLength(1);
    const [entry] = (await created()) ?? [];
    expect(entry?.id).toBe('prayer:2099-01-01:fajr');
    expect(entry?.title).toMatch(/^Fajr, /);

    const ids = () =>
      extension.worker.evaluate(async () => Object.keys(await chrome.notifications.getAll()));
    await expect.poll(ids).toContain('prayer:2099-01-01:fajr');
  } finally {
    await extension.close();
  }
});

test('Play returns to Play when the beep ends, and Stop returns it at once', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true },
    });
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();

    const play = extension.page.getByRole('button', { name: 'Play' });
    const stop = extension.page.getByRole('button', { name: 'Stop' });

    // Play starts the beep and becomes Stop.
    await play.click();
    await expect(stop).toBeVisible();

    // The beep is about 1.2 seconds; when it ends the button returns to Play by itself.
    await expect(play).toBeVisible({ timeout: 5000 });

    // Pressing Stop during the beep returns to Play at once.
    await play.click();
    await expect(stop).toBeVisible();
    await stop.click();
    await expect(play).toBeVisible();
  } finally {
    await extension.close();
  }
});

test('the adhan plays through an offscreen document', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true, sound: 'adhan' },
    });
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await extension.page.getByRole('button', { name: 'Play' }).click();
    await expect(extension.page.getByRole('button', { name: 'Stop' })).toBeVisible();

    const offscreenCount = () =>
      extension.worker.evaluate(async () => {
        const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
        return contexts.length;
      });
    await expect.poll(offscreenCount).toBeGreaterThan(0);
  } finally {
    await extension.close();
  }
});

test('starting a new sound over a playing one keeps Play on Stop', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true, sound: 'adhan' },
    });

    // A prayer fires now and its adhan starts playing through the offscreen page.
    await extension.worker.evaluate(async () => {
      await chrome.alarms.create('prayer:2099-01-01:fajr', { when: Date.now() });
    });
    const offscreenCount = () =>
      extension.worker.evaluate(async () =>
        (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length,
      );
    await expect.poll(offscreenCount).toBeGreaterThan(0);

    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();

    // Play starts a second adhan over the first. The replaced adhan must not report its
    // end, or this flips straight back to Play while the new adhan is still sounding.
    await extension.page.getByRole('button', { name: 'Play' }).click();
    await extension.page.waitForTimeout(1500);
    await expect(extension.page.getByRole('button', { name: 'Stop' })).toBeVisible();
  } finally {
    await extension.close();
  }
});

test('a settings change clears only prayer alarms, never a pending clear alarm', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true },
    });
    const alarmNames = () =>
      extension.worker.evaluate(async () => (await chrome.alarms.getAll()).map((alarm) => alarm.name));
    await expect.poll(alarmNames).toContain('refresh');

    // An alert just fired: its clear:<id> alarm waits 60 seconds to clear the notification.
    await extension.worker.evaluate(async () => {
      await chrome.alarms.create('clear:prayer:2099-01-01:fajr', { when: Date.now() + 60000 });
    });
    await expect.poll(alarmNames).toContain('clear:prayer:2099-01-01:fajr');

    // Turning alerts off forces a rebuild that must clear the prayer alarms only.
    await extension.page.evaluate(async (stored) => {
      await chrome.storage.local.set({ 'sajdatime.settings.v1': stored });
    }, { ...LONDON, alerts: { ...LONDON.alerts, enabled: false } });

    await expect.poll(alarmNames).toEqual(['clear:prayer:2099-01-01:fajr']);
  } finally {
    await extension.close();
  }
});

test('the Alerts group shows five switches and keeps the chosen sound', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), LONDON);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();

    // The group is hidden beyond the master switch while alerts are off.
    await expect(extension.page.getByRole('heading', { name: 'Sound' })).toBeHidden();
    await expect(extension.page.getByRole('button', { name: 'Send a test alert' })).toBeHidden();

    await extension.page.getByRole('switch', { name: 'Prayer alerts' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Sound' })).toBeVisible();
    for (const prayer of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
      await expect(extension.page.getByRole('switch', { name: prayer })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    }
    await expect(extension.page.getByRole('button', { name: 'Soft beep' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Pick the adhan; a reload keeps it.
    await extension.page.getByRole('button', { name: 'Adhan' }).click();
    await expect(extension.page.getByRole('button', { name: 'Adhan' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await extension.page.reload();
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('button', { name: 'Adhan' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(extension.page.getByRole('button', { name: 'Soft beep' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  } finally {
    await extension.close();
  }
});

test('focus stays on a pressed alert switch after the save', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true },
    });
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.getByRole('heading', { name: 'Alerts' })).toBeVisible();

    await extension.page.getByRole('switch', { name: 'Fajr' }).click();
    await expect(extension.page.getByRole('switch', { name: 'Fajr' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(extension.page.getByRole('switch', { name: 'Fajr' })).toBeFocused();
  } finally {
    await extension.close();
  }
});

test('Send a test alert creates the Test alert notification', async () => {
  const extension = await launchExtension();
  try {
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), {
      ...LONDON,
      alerts: { ...LONDON.alerts, enabled: true, sound: 'silent' },
    });
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await extension.page.getByRole('button', { name: 'Send a test alert' }).click();
    const ids = () =>
      extension.worker.evaluate(async () => Object.keys(await chrome.notifications.getAll()));
    await expect.poll(ids).toContain('test-alert');
  } finally {
    await extension.close();
  }
});

test('the amber notice shows when the browser denies notifications', async () => {
  const extension = await launchExtension();
  try {
    await extension.page.addInitScript(() => {
      Object.defineProperty(chrome.notifications, 'getPermissionLevel', {
        configurable: true,
        value: () => Promise.resolve('denied'),
      });
    });
    await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), LONDON);
    await extension.page.getByRole('button', { name: 'Settings' }).click();
    await expect(extension.page.locator('.blocked-notice')).toBeVisible();
    await expect(extension.page.locator('.blocked-title')).toHaveText('Prayer alerts are blocked');
  } finally {
    await extension.close();
  }
});
