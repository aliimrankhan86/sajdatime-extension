import { PRAYER_NAMES, isLate, parseAlarmName, prayerAlertMessage, scheduledAlarms } from '../core/alerts';
import { BADGE_BACKGROUND, BADGE_TEXT, badgeText, humanDuration } from '../core/badge';
import { formatClockTime } from '../core/clock';
import { computeDay, nextPrayer } from '../core/engine';
import { isRamadan } from '../core/hijri';
import { parseAlertMessage, soundMessageType, type AlertMessageType } from '../core/messages';
import type { NextPrayer, Prayer, Sect } from '../core/types';
import { loadSettings } from '../settings/storage';
import { SETTINGS_KEY, type AlertSound, type Settings } from '../settings/types';

const NOTIFICATION_ICON = chrome.runtime.getURL('icons/icon-128.png');
const CLEAR_AFTER_MS = 60 * 1000;

chrome.runtime.onInstalled.addListener(() => {
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
    case 'badge':
      updateBadge(await loadSettings());
      break;
    case 'clear':
      chrome.notifications.clear(parsed.notificationId);
      break;
    case 'prayer':
      await firePrayer(parsed.date, parsed.slot);
      break;
    case 'reminder':
      await fireReminder(parsed.date, parsed.slot);
      break;
    case 'suhoor':
      await fireSuhoor(parsed.date);
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

/**
 * The quiet "before prayer" reminder (PLAN.md §7). A message with no sound, so it never
 * plays the adhan or the beep; it only gives the user a moment to get ready.
 */
async function fireReminder(date: string, slot: Prayer): Promise<void> {
  const settings = await loadSettings();
  if (!settings || !settings.alerts.enabled || !settings.alerts.reminder.enabled) return;
  if (!settings.alerts.prayers[slot]) return;
  const prefs = {
    method: settings.method,
    madhab: settings.madhab,
    timeZone: settings.place.timeZone,
  };
  const at = computeDay(settings.place, date, prefs).times[slot];
  const reminderAt = at.getTime() - settings.alerts.reminder.minutes * 60 * 1000;
  if (isLate(Date.now(), reminderAt)) return;
  const locale = navigator.language || 'en-GB';
  try {
    await chrome.notifications.create(`reminder:${date}:${slot}`, {
      type: 'basic',
      iconUrl: NOTIFICATION_ICON,
      title: `${PRAYER_NAMES[slot]} in ${settings.alerts.reminder.minutes} minutes`,
      message: `${PRAYER_NAMES[slot]} begins at ${formatClockTime(at, settings.place.timeZone, locale)}.`,
      silent: true,
    });
  } catch {
    console.error('Could not show the reminder.');
  }
}

/**
 * The suhoor reminder fires only in Ramadan and is the one reminder that may play sound,
 * so the user does not miss the last chance to eat. It uses the alert sound the user chose.
 */
async function fireSuhoor(date: string): Promise<void> {
  const settings = await loadSettings();
  if (!settings || !settings.suhoorReminder.enabled) return;
  const prefs = {
    method: settings.method,
    madhab: settings.madhab,
    timeZone: settings.place.timeZone,
  };
  const fajr = computeDay(settings.place, date, prefs).times.fajr;
  const reminderAt = fajr.getTime() - settings.suhoorReminder.minutes * 60 * 1000;
  if (isLate(Date.now(), reminderAt)) return;
  const locale = navigator.language || 'en-GB';
  const notificationId = `suhoor:${date}`;
  try {
    await chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: NOTIFICATION_ICON,
      title: `Suhoor ends at ${formatClockTime(fajr, settings.place.timeZone, locale)}`,
      message: `Fajr begins in ${settings.suhoorReminder.minutes} minutes.`,
      silent: true,
      requireInteraction: true,
      ...(settings.alerts.sound === 'adhan' ? { buttons: [{ title: 'Stop sound' }] } : {}),
    });
  } catch {
    console.error('Could not show the suhoor reminder.');
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

/**
 * The toolbar badge shows the time to the next prayer (PLAN.md §7). Before setup there is
 * no badge, only a hint on hover. The badge colours and text are set together every time.
 */
function updateBadge(settings: Settings | null): void {
  if (!settings) {
    void chrome.action.setBadgeText({ text: '' });
    void chrome.action.setTitle({ title: 'SajdaTime: set up your prayer times' });
    return;
  }
  const next = safeNextPrayer(settings);
  if (!next) {
    void chrome.action.setBadgeText({ text: '' });
    void chrome.action.setTitle({ title: 'SajdaTime: set up your prayer times' });
    return;
  }
  const locale = navigator.language || 'en-GB';
  const wait = next.at.getTime() - Date.now();
  const title = `SajdaTime: ${PRAYER_NAMES[next.slot]} in ${humanDuration(wait)} (${formatClockTime(
    next.at,
    settings.place.timeZone,
    locale,
  )})`;
  void chrome.action.setBadgeBackgroundColor({ color: BADGE_BACKGROUND });
  void chrome.action.setBadgeTextColor({ color: BADGE_TEXT });
  void chrome.action.setBadgeText({ text: badgeText(wait) });
  void chrome.action.setTitle({ title });
}

function safeNextPrayer(settings: Settings): NextPrayer | null {
  try {
    return nextPrayer(
      { latitude: settings.place.latitude, longitude: settings.place.longitude },
      { method: settings.method, madhab: settings.madhab, timeZone: settings.place.timeZone },
      new Date(),
    );
  } catch {
    return null;
  }
}

async function rebuildAlarms(): Promise<void> {
  const settings = await loadSettings();
  const expected = settings ? scheduledAlarms(settings, new Date()) : [];
  updateBadge(settings);

  // The badge alarm repeats every minute to keep the countdown current. It is not part of
  // scheduledAlarms and is never cleared, because the badge runs even when alerts are off.
  const all = await chrome.alarms.getAll();
  if (!all.some((alarm) => alarm.name === 'badge')) {
    chrome.alarms.create('badge', { periodInMinutes: 1 });
  }

  const current = all.filter((alarm) => isOwnedAlarm(alarm.name) && alarm.name !== 'badge');
  const expectedTimes = new Map(expected.map((alarm) => [alarm.name, alarm.when.getTime()] as const));
  const currentTimes = new Map(current.map((alarm) => [alarm.name, alarm.scheduledTime] as const));
  if (same(expectedTimes, currentTimes)) return;
  // This worker owns only its own alarm names. A clear:<id> alarm set by an alert must
  // survive a rebuild, or the notification's requireInteraction keeps it pinned until the
  // browser is restarted, so clear only owned names, never clearAll.
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
  return (
    name === 'refresh' ||
    name === 'badge' ||
    name.startsWith('prayer:') ||
    name.startsWith('reminder:') ||
    name.startsWith('suhoor:')
  );
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
