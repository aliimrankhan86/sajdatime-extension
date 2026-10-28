import { parseISODate } from './engine';
import type { Eid } from './types';

const RAMADAN_PREFIX = 'sajdatime.notice.ramadan.';
const EID_PREFIX = 'sajdatime.notice.eid.';

/** The chrome.storage.local key that keeps a coming notice closed for one Ramadan. */
export function ramadanNoticeKey(hijriYear: number): string {
  return `${RAMADAN_PREFIX}${hijriYear}`;
}

/** The chrome.storage.local key that keeps an Eid notice closed. */
export function eidNoticeKey(eid: Eid, hijriYear: number): string {
  return `${EID_PREFIX}${eid}.${hijriYear}`;
}

/** A Gregorian date as the popup writes dates, for the coming notice's title. */
export function formatNoticeDate(dateISO: string, locale: string): string {
  const { year, month, day } = parseISODate(dateISO);
  const atNoon = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(atNoon);
}

/** True when a notice's key has already been dismissed in chrome.storage.local. */
export async function isNoticeDismissed(key: string): Promise<boolean> {
  const stored = await chrome.storage.local.get(key);
  return stored[key] === true;
}

/** Marks a notice closed for its key, so it stays closed on the next open. */
export async function dismissNotice(key: string): Promise<void> {
  await chrome.storage.local.set({ [key]: true });
}
