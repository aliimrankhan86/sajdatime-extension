import { PRAYER_NAMES, isLate, parseAlarmName, prayerAlertMessage, scheduledAlarms } from '../core/alerts';
import { formatClockTime } from '../core/clock';
import { computeDay } from '../core/engine';
import { isRamadan } from '../core/hijri';
import { parseAlertMessage, soundMessageType, type AlertMessageType } from '../core/messages';
import type { Prayer, Sect } from '../core/types';
import { loadSettings } from '../settings/storage';
import { SETTINGS_KEY, type AlertSound } from '../settings/types';

const NOTIFICATION_ICON = chrome.runtime.getURL('icons/icon-128.png');
const CLEAR_AFTER_MS = 60 * 1000;

chrome.runtime.onInstalled.addListener(() => {
  void chrome.action.setBadgeText({ text: '' });
  void rebuildAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  void rebuildAlarms();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !(SETTINGS_KEY in changes)) return;
  void rebuildAlarms();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  void handleAlarm(alarm.name);
});

chrome.notifications.onClicked.addListener((notificationId) => {
  void chrome.action.openPopup().catch(() => chrome.notifications.clear(notificationId));
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex !== 0) return;
  void sendToOffscreen('stop');
  chrome.notifications.clear(notificationId);
});

chrome.runtime.onMessage.addListener((message, sender) => {
  const type = parseAlertMessage(message, sender, chrome.runtime.id, chrome.runtime.getURL(''));
  if (!type) return;
  void handleMessage(type);
});

async function handleAlarm(name: string): Promise<void> {
  const parsed = parseAlarmName(name);
  switch (parsed.kind) {
    case 'refresh':
      await rebuildAlarms();
      break;
    case 'clear':
      chrome.notifications.clear(parsed.notificationId);
      break;
    case 'prayer':
      await firePrayer(parsed.date, parsed.slot);
      break;
    case 'unknown':
      break;
  }
}

async function firePrayer(date: string, slot: Prayer): Promise<void> {
  const settings = await loadSettings();
  if (!settings || !settings.alerts.enabled) return;
  if (!settings.alerts.prayers[slot]) return;
  const scheduled = computeDay(settings.place, date, {
    method: settings.method,
    madhab: settings.madhab,
    timeZone: settings.place.timeZone,
  }).times[slot];
  // A computer asleep or Chrome closed can wake minutes late; drop a stale prayer.
  if (isLate(Date.now(), scheduled.getTime())) return;

  const notificationId = `prayer:${date}:${slot}`;
  const placeName = settings.place.name.slice(0, 60);
  const locale = navigator.language || 'en-GB';
  const inRamadan = settings.ramadanCard && isRamadan(date, settings.hijriOffsetDays);
  try {
    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: NOTIFICATION_ICON,
      title: `${PRAYER_NAMES[slot]}, ${formatClockTime(scheduled, settings.place.timeZone, locale)}`,
      message: prayerAlertMessage(slot, placeName, inRamadan),
      silent: true,
      requireInteraction: true,
      ...(settings.alerts.sound === 'adhan' ? { buttons: [{ title: 'Stop sound' }] } : {}),
    });
  } catch {
    // A fixed message only: the browser may refuse the icon or deny notifications.
    console.error('Could not show the prayer alert.');
    return;
  }
  chrome.alarms.create(`clear:${notificationId}`, { when: Date.now() + CLEAR_AFTER_MS });
  await playSound(settings.alerts.sound, settings.sect);
}

async function handleMessage(type: AlertMessageType): Promise<void> {
  switch (type) {
    case 'play-beep':
    case 'play-adhan-sunni':
    case 'play-adhan-shia':
    case 'stop':
      await sendToOffscreen(type);
      break;
    case 'test-alert':
      await fireTestAlert();
      break;
    case 'sound-ended':
      // The offscreen page says a sound finished; the popup listens for this too.
      break;
  }
}

async function fireTestAlert(): Promise<void> {
  const settings = await loadSettings();
  if (!settings) return;
  try {
    await chrome.notifications.create('test-alert', {
      type: 'basic',
      iconUrl: NOTIFICATION_ICON,
      title: 'Test alert',
      message: 'This is how a prayer alert looks.',
    });
  } catch {
    console.error('Could not show the test alert.');
    return;
  }
  await playSound(settings.alerts.sound, settings.sect);
}

async function playSound(sound: AlertSound, sect: Sect): Promise<void> {
  const type = soundMessageType(sound, sect);
  if (!type) return;
  await sendToOffscreen(type);
}

async function sendToOffscreen(type: AlertMessageType): Promise<void> {
  await ensureOffscreen();
  await chrome.runtime.sendMessage({ type });
}

async function ensureOffscreen(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (contexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen/index.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Plays the prayer alert sound.',
  });
}

async function rebuildAlarms(): Promise<void> {
  const settings = await loadSettings();
  const expected = settings ? scheduledAlarms(settings, new Date()) : [];
  const current = (await chrome.alarms.getAll()).filter((alarm) => isOwnedAlarm(alarm.name));
  const expectedTimes = new Map(expected.map((alarm) => [alarm.name, alarm.when.getTime()] as const));
  const currentTimes = new Map(current.map((alarm) => [alarm.name, alarm.scheduledTime] as const));
  if (same(expectedTimes, currentTimes)) return;
  // This worker owns only prayer: and refresh alarms. A clear:<id> alarm set by an
  // alert must survive a rebuild, or the notification's requireInteraction keeps it
  // pinned until the browser is restarted, so clear only owned names, never clearAll.
  for (const alarm of current) {
    if (!expectedTimes.has(alarm.name)) chrome.alarms.clear(alarm.name);
  }
  for (const alarm of expected) {
    if (currentTimes.get(alarm.name) !== alarm.when.getTime()) {
      chrome.alarms.create(alarm.name, { when: alarm.when.getTime() });
    }
  }
}

function isOwnedAlarm(name: string): boolean {
  return name === 'refresh' || name.startsWith('prayer:');
}

function same(left: Map<string, number>, right: Map<string, number>): boolean {
  if (left.size !== right.size) return false;
  for (const [name, time] of left) {
    if (right.get(name) !== time) return false;
  }
  return true;
}

// The worker is woken for alarms and storage changes; a cold start still rebuilds when
// the stored alarms no longer match the settings (for example after Chrome was closed).
void rebuildAlarms();
