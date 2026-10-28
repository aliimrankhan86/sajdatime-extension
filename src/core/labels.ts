import type { PrayerSlot } from './types';

/**
 * The Hijri month names, spelled the way the phone spells them. Shared by the Times
 * screen's date line and the printable timetable, so the two can never disagree.
 * Kept in core rather than the popup because the print page is a second entry point.
 */
export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
] as const;

/** The name of a Hijri month, or null when the number is outside 1 to 12. */
export function hijriMonthName(month: number): string | null {
  return HIJRI_MONTHS[month - 1] ?? null;
}

/** The six line labels, in the order they appear on the Times screen and in the table. */
export const SLOT_LABELS: Record<PrayerSlot, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

/** The two Asr schools, in the words Settings uses. */
export const MADHAB_LABELS = { hanafi: 'Hanafi', shafii: "Shafi'i" } as const;
