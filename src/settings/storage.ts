import { setLanguage } from '../i18n';
import { isSettings, migrateSettings, SETTINGS_KEY, type Settings } from './types';

export async function loadSettings(): Promise<Settings | null> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const value: unknown = migrateSettings(stored[SETTINGS_KEY]);
  const settings = isSettings(value) ? value : null;
  // Every screen reads its settings through here, so one call keeps the language right:
  // the popup, the printable page and the background workers all build their words after.
  if (settings) setLanguage(settings.language);
  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function clearSettings(): Promise<void> {
  await chrome.storage.local.remove(SETTINGS_KEY);
}

export function watchSettings(onChange: (settings: Settings | null) => void): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== 'local' || !(SETTINGS_KEY in changes)) return;
    const value: unknown = migrateSettings(changes[SETTINGS_KEY]?.newValue);
    const settings = isSettings(value) ? value : null;
    if (settings) setLanguage(settings.language);
    onChange(settings);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
