import { render } from 'preact';
import { dateInZone } from '../core/engine';
import { applyTheme } from '../popup/theme';
import { loadSettings } from '../settings/storage';
import { applyLanguage } from '../i18n';
import type { Settings } from '../settings/types';
import { Print, type TimetableKind } from './Print';
import { monthOfDate } from './timetable';
import { t } from '../i18n';
import '../popup/tokens.css';
import './styles.css';

/**
 * The printable timetable's entry point. Settings are read here rather than passed in
 * the URL, and the URL itself is treated as untrusted input: an unknown month falls back
 * to the current one and an unknown kind to the month table.
 */

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function readSearch(settings: Settings): { month: string; kind: TimetableKind } {
  const params = new URLSearchParams(location.search);
  const requested = params.get('month') ?? '';
  const month = MONTH.test(requested)
    ? requested
    : monthOfDate(dateInZone(new Date(), settings.place.timeZone));
  const kind: TimetableKind = params.get('kind') === 'ramadan' ? 'ramadan' : 'month';
  return { month, kind };
}

function NoSettings() {
  return (
    <main class="print-page">
      <h1 class="print-title">{t('print.setupTitle')}</h1>
      <p class="print-line">
        {t('print.setupNote')}
      </p>
    </main>
  );
}

const mount = document.getElementById('app');

async function start(): Promise<void> {
  const settings = await loadSettings().catch(() => null);
  if (!mount) return;

  if (!settings) {
    applyTheme('system');
    render(<NoSettings />, mount);
    return;
  }

  applyTheme(settings.theme);
  // The sheet speaks the saved language, right to left included.
  applyLanguage(settings.language);
  const { month, kind } = readSearch(settings);
  render(<Print settings={settings} initialMonth={month} initialKind={kind} />, mount);
}

void start();
