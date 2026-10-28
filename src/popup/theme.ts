import type { Theme } from '../settings/types';

/** The theme actually painted. A stored "system" is resolved before it is applied. */
export type ResolvedTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * The operating system's theme. Read synchronously so the first paint is already correct
 * for anyone on System, which is the default. jsdom has no matchMedia, hence the guard.
 */
export function systemTheme(): ResolvedTheme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? systemTheme() : theme;
}

/**
 * Puts the resolved theme on <html data-theme>, which is the one switch tokens.css reads.
 * Also sets `color-scheme`, so scrollbars and native controls follow the same choice.
 */
export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

/**
 * Keeps System live: if the OS flips light or dark while the popup is open, repaint.
 * Returns a remover so the caller can stop listening when it unmounts or the user
 * chooses an explicit theme.
 */
export function watchSystemTheme(onChange: (next: ResolvedTheme) => void): () => void {
  let media: MediaQueryList;
  try {
    media = window.matchMedia(DARK_QUERY);
  } catch {
    return () => undefined;
  }
  const listener = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
