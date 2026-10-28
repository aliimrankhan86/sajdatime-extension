/**
 * The disclaimer in its two forms, read from the language files. The short one is the
 * four substance points plus the dua, shown on the first-run disclaimer step and in the
 * Settings disclaimer sheet. The full one is the phone's own text adapted for the
 * extension: the watch paragraph is dropped (there is no watch), "app" becomes
 * "extension", "phone" becomes "computer", the Qibla mention goes (there is no Qibla),
 * and the per-prayer "Match your mosque" minutes clause is held back until that feature
 * ships. Neither may ever be removed, softened or hidden (docs/SECURITY.md,
 * docs/UX-PLAN.md).
 *
 * The paragraphs are functions so the words follow the chosen language. The dua is the
 * last paragraph and lives only here: the user is asked once and never nagged.
 */

import { t } from '../i18n';

/** That it is a helper and not an authority, with the dua at the end. */
export function shortDisclaimer(): string {
  return t('disclaimer.short');
}

/** Paragraphs, in order. The dua is the last paragraph and lives only here. */
export function fullDisclaimer(): string[] {
  return [1, 2, 3, 4, 5, 6].map((index) => t(`disclaimer.full.${index}`));
}
