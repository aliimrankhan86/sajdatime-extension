import { render } from 'preact';
import { Popup } from './Popup';
import { startFitting } from './fit';
import { applyTheme } from './theme';
import { loadSettings } from '../settings/storage';
import { applyDocumentLanguage, getLanguage, setLanguage } from '../i18n';
import './tokens.css';
import './styles.css';

// docs/SECURITY.md R2 forbids inline script, so the theme is set by this bundle instead.
// System is resolved synchronously, so the default already paints correctly. A stored
// Light or Dark is applied when the settings load, before any content renders, so the
// popup never paints the wrong theme. Only the bare window background can use the
// system colour for the few milliseconds the storage read takes.
applyTheme('system');

void loadSettings()
  .catch(() => null)
  .then((settings) => {
    applyTheme(settings?.theme ?? 'system');
    // The document attributes follow the stored language before the first paint.
    setLanguage(settings?.language);
    applyDocumentLanguage(getLanguage());
    const app = document.getElementById('app') as HTMLElement;
    render(<Popup initial={settings} />, app);
    startFitting(app);
  });
