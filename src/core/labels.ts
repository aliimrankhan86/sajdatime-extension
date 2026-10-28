import { t } from '../i18n';
import type { Madhab, PrayerSlot } from './types';

/**
 * The names the screens use for Hijri months, the six times of day and the two Asr schools.
 * Shared by the Times screen, the printable timetable and the alerts, so no two screens can
 * disagree. Kept in core rather than the popup because the print page is a second entry
 * point and reads the same words.
 *
 * They are functions, not constants: a constant would be filled in once, at module load,
 * and would still say the first language after the user changes it (PLAN.md section 10).
 */

/** The name of a Hijri month, or null when the number is outside 1 to 12. */
export function hijriMonthName(month: number): string | null {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return t(`hijri.${month}`);
}

/** The six line labels, in the order they appear on the Times screen and in the table. */
export function slotLabel(slot: PrayerSlot): string {
  return t(`slot.${slot}`);
}

/** The two Asr schools, in the words Settings uses. */
export function madhabLabel(madhab: Madhab): string {
  return t(`madhab.${madhab}`);
}
