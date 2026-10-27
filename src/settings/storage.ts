import { isSettings, SETTINGS_KEY, type Settings } from './types';

export async function loadSettings(): Promise<Settings | null> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const value: unknown = stored[SETTINGS_KEY];
  return isSettings(value) ? value : null;
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
    const value: unknown = changes[SETTINGS_KEY]?.newValue;
    onChange(isSettings(value) ? value : null);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
