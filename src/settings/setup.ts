import { isSettings, type Settings } from './types';

/**
 * First-run progress, held separately from the finished settings so the popup can resume
 * the setup at the same step after being closed. Written only while setup is in progress
 * and removed the moment it finishes, so `sajdatime.settings.v1` stays the one source of
 * truth for a finished install (docs/SECURITY.md R8 names both keys).
 */
export const SETUP_KEY = 'sajdatime.setup.v1';

/** 0 welcome, 1 disclaimer, 2 school, 3 madhab, 4 location, 5 method, 6 alerts. */
export const MAX_STEP = 6;

export interface SetupDraft {
  step: number;
  /** A complete, valid settings object whose fields are filled in step by step. */
  settings: Settings;
  /**
   * Whether the madhab step was answered. A fresh draft starts on the default Shafi'i,
   * but the Madhab step must still show nothing preselected on the first visit, so the
   * flag tells the first-visit look apart from a Back or resume where a choice exists.
   */
  madhabChosen: boolean;
}

export function isSetupDraft(value: unknown): value is SetupDraft {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SetupDraft>;
  return (
    typeof candidate.step === 'number' &&
    Number.isInteger(candidate.step) &&
    candidate.step >= 0 &&
    candidate.step <= MAX_STEP &&
    isSettings(candidate.settings) &&
    typeof candidate.madhabChosen === 'boolean'
  );
}

export async function loadSetupDraft(): Promise<SetupDraft | null> {
  const stored = await chrome.storage.local.get(SETUP_KEY);
  const value: unknown = stored[SETUP_KEY];
  return isSetupDraft(value) ? value : null;
}

export async function saveSetupDraft(draft: SetupDraft): Promise<void> {
  await chrome.storage.local.set({ [SETUP_KEY]: draft });
}

export async function clearSetupDraft(): Promise<void> {
  await chrome.storage.local.remove(SETUP_KEY);
}
