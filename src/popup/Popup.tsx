import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import {
  PRAYERS,
  SLOTS,
  computeDay,
  contains,
  currentPrayer,
  dateInZone,
  dismissNotice,
  eidNoticeKey,
  eidOn,
  formatNoticeDate,
  hijriFor,
  isNoticeDismissed,
  nextPrayer,
  ramadanInfo,
  ramadanNoticeKey,
  showsComingNotice,
  type DayTimes,
  type NextPrayer,
  type Prayer,
  type PrayerSlot,
} from '../core';
import { clockFormatter, type ClockFormat } from '../core/clock';
import { monthOfDate } from '../print/timetable';
import { hijriMonthName, slotLabel as plainSlotLabel } from '../core/labels';
import { clearSettings, loadSettings, saveSettings, watchSettings } from '../settings/storage';
import { applyLanguage, localeTag } from '../i18n';
import type { Settings } from '../settings/types';
import { applyTheme, watchSystemTheme } from './theme';
import { Brand } from './Brand';
import { FirstRun } from './FirstRun';
import { Glyph } from './Glyph';
import { LocationSheet } from './LocationSheet';
import { Notice } from './Notice';
import { Settings as SettingsScreen } from './Settings';
import { TownChip } from './TownChip';
import { t } from '../i18n';

function formatHijri(date: string, offset: number): string | null {
  const day = hijriFor(date, offset);
  if (!day) return null;
  const month = hijriMonthName(day.month);
  return month ? `${day.day} ${month} ${day.year}` : null;
}

/**
 * The countdown as a clock, zero padded to h:mm:ss. This is the shape the phone draws
 * (TimeFormat.countdownClock, "%02d:%02d:%02d"), and UX-PLAN U5 asks for a masked
 * literal rather than words, so the digits never reflow while they count.
 */
function formatCountdown(target: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
}

/**
 * The same time in words, for a screen reader. "00:44:59" is read out digit by digit,
 * so the timer's aria-label says "44 minutes 59 seconds" instead. Hours and minutes are
 * left out when they are zero, which only happens in the last minute before a prayer.
 */
function countdownWords(target: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(t(hours === 1 ? 'unit.hour' : 'unit.hours', { count: hours }));
  if (minutes > 0) parts.push(t(minutes === 1 ? 'unit.minute' : 'unit.minutes', { count: minutes }));
  parts.push(t(rest === 1 ? 'unit.second' : 'unit.seconds', { count: rest }));
  return parts.join(' ');
}

/** The label a prayer slot shows during Ramadan, when the Ramadan card is on. */
function slotLabel(slot: PrayerSlot, inRamadan: boolean): string {
  if (inRamadan && slot === 'fajr') return t('slot.suhoor');
  if (inRamadan && slot === 'maghrib') return t('slot.iftar');
  return plainSlotLabel(slot);
}

/** The words under the countdown during Ramadan, when the Ramadan card is on. */
function countdownNote(slot: Prayer, inRamadan: boolean): string {
  if (inRamadan && slot === 'fajr') return t('times.untilSuhoor');
  if (inRamadan && slot === 'maghrib') return t('times.untilIftar');
  return t('times.untilBegins');
}

export function Popup({ initial }: { initial?: Settings | null }) {
  // main.tsx preloads the settings so the first paint already has the stored theme.
  const [settings, setSettings] = useState<Settings | null | undefined>(initial);
  const [screen, setScreen] = useState<'times' | 'settings'>('times');
  const previousScreen = useRef(screen);

  // A full screen replaces Settings, so the button that opened it is unmounted.
  // Put focus back when it returns, instead of dropping the keyboard user on <body>.
  useEffect(() => {
    if (previousScreen.current === 'settings' && screen === 'times') {
      document.querySelector<HTMLButtonElement>('.footer-settings')?.focus();
    }
    previousScreen.current = screen;
  }, [screen]);

  // data-theme lives on <html>, so it is set before paint, not after. A System choice
  // also follows the computer while the popup stays open.
  useLayoutEffect(() => {
    const theme = settings?.theme ?? 'system';
    applyTheme(theme);
    if (theme !== 'system') return undefined;
    return watchSystemTheme(() => applyTheme('system'));
  }, [settings?.theme]);

  // The language, its direction and the font stack follow the setting without a reload.
  // `lang` and `dir` go on <html> so a sheet rendering in a portal reads the same way.
  useLayoutEffect(() => {
    applyLanguage(settings?.language ?? 'auto');
  }, [settings?.language]);

  useEffect(() => {
    let alive = true;
    loadSettings()
      .then((value) => {
        if (alive) setSettings(value);
      })
      .catch(() => {
        if (alive) setSettings(null);
      });
    const stop = watchSettings((value) => {
      if (alive) setSettings(value);
    });
    return () => {
      alive = false;
      stop();
    };
  }, []);

  if (settings === undefined) {
    return (
      <main class="welcome" aria-busy="true">
        <p class="welcome-note">{t('app.loading')}</p>
      </main>
    );
  }

  if (settings === null) {
    return <FirstRun onSaved={setSettings} />;
  }

  function resetPlace() {
    void clearSettings()
      .catch(() => undefined)
      .then(() => setSettings(null));
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        settings={settings}
        onClose={() => setScreen('times')}
        onSaved={setSettings}
      />
    );
  }

  return <Times settings={settings} onReset={resetPlace} onOpenSettings={() => setScreen('settings')} />;
}

/**
 * A notice that stays closed once it has been closed. `onHidden` tells Times when the
 * notice is no longer on screen, either because it was already closed or because the
 * close button was pressed, so the hero card can go back to its full form.
 */
function DismissableNotice({
  title,
  line,
  storageKey,
  onHidden,
}: {
  title: string;
  line: string;
  storageKey: string;
  onHidden: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    void isNoticeDismissed(storageKey)
      .then((value) => {
        if (alive) setDismissed(value);
        if (alive && value) onHidden();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [storageKey, onHidden]);

  function close(): void {
    void dismissNotice(storageKey).catch(() => undefined);
    setDismissed(true);
    onHidden();
  }

  if (dismissed) return null;

  return <Notice tone="quiet" title={title} line={line} onClose={close} />;
}

function Times({
  settings,
  onReset,
  onOpenSettings,
}: {
  settings: Settings;
  onReset: () => void;
  onOpenSettings: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [showLocation, setShowLocation] = useState(false);
  const [noticeHidden, setNoticeHidden] = useState(false);
  const hideNotice = useCallback(() => setNoticeHidden(true), []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const prefs = {
    method: settings.method,
    madhab: settings.madhab,
    timeZone: settings.place.timeZone,
    hijriOffsetDays: settings.hijriOffsetDays,
  };
  const locale = localeTag();

  let today: string;
  let day: DayTimes;
  let next: NextPrayer;
  let current: Prayer | null;
  let clock: ClockFormat;
  try {
    today = dateInZone(now, prefs.timeZone);
    day = computeDay(settings.place, today, prefs);
    next = nextPrayer(settings.place, prefs, now);
    current = currentPrayer(settings.place, prefs, now);
    // The browser's own 12 or 24 hour style for its language. A stored language
    // will take over when the language screen lands. In 24 hour style the hour
    // keeps its leading zero, so the column of times lines up.
    clock = clockFormatter(prefs.timeZone, locale);
  } catch {
    return (
      <main class="welcome">
        <h1 class="welcome-title">{t('times.unavailable')}</h1>
        <p class="welcome-lead">{t('times.badPlace')}</p>
        <button class="action" type="button" onClick={onReset}>
          {t('times.setPlace')}
        </button>
      </main>
    );
  }

  // The printable timetable opens in its own tab, because a month of times will not fit in
  // a 380 pixel popup. The URL carries the month and the kind and nothing else: the place
  // is read from saved settings by the page itself, so no coordinate leaves the storage
  // (docs/SECURITY.md R5).
  const onOpenPrint = () => {
    const url = chrome.runtime.getURL(`print/index.html?month=${monthOfDate(today)}&kind=month`);
    void chrome.tabs.create({ url });
  };

  const hijri = formatHijri(today, settings.hijriOffsetDays);
  const ramadan = ramadanInfo(today, settings.hijriOffsetDays);
  const inRamadan = settings.ramadanCard && ramadan !== null && contains(ramadan, today);
  const nextLabel = next.isTomorrow ? t('times.nextPrayerTomorrow') : t('times.nextPrayer');
  const countdown = formatCountdown(next.at, now);
  const words = countdownWords(next.at, now);
  const nextName = slotLabel(next.slot, inRamadan);
  const nextNote = countdownNote(next.slot, inRamadan);
  const nextTime = clock.format(next.at);

  const eid = eidOn(today, settings.hijriOffsetDays);
  const comingKey =
    ramadan !== null && showsComingNotice(ramadan, today) ? ramadanNoticeKey(ramadan.hijriYear) : null;
  const eidKey = eid !== null ? eidNoticeKey(eid.eid, eid.hijriYear) : null;

  // A notice day shows the hero card in its compact form (one row instead of the label,
  // the countdown note and the five bars) so the notice and all six times still fit 600
  // pixels. Dismissing the notice brings the full card back, because the room is free
  // again. The state is declared here, above the early return for a broken place, so the
  // hooks run in the same order on every render.
  const compactHero = (comingKey !== null || eidKey !== null) && !noticeHidden;

  // The bold Gregorian date over the Hijri date, in the place's own zone.
  // "Tuesday 27 October" for en-GB, exactly as U4 names it.
  const gregorian = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: prefs.timeZone,
  }).format(new Date(`${today}T12:00:00`));

  // The five prayer bars on the hero: done filled, next outlined, the rest in the
  // divider colour. After Isha the next prayer is tomorrow, so all five read as done.
  const nextSlotToday = next.isTomorrow ? null : next.slot;
  const bars = PRAYERS.map((prayer) => {
    const at = day.times[prayer].getTime();
    if (prayer === nextSlotToday) return 'next' as const;
    return at <= now.getTime() ? ('done' as const) : ('todo' as const);
  });

  if (showLocation) {
    return (
      <LocationSheet
        current={settings.place}
        onClose={() => setShowLocation(false)}
        onSaved={(place) => {
          setShowLocation(false);
          void saveSettings({ ...settings, place });
        }}
      />
    );
  }

  return (
    <main>
      <header class="hero">
        <div class="hero-top">
          <Brand compact />
          <div class="hero-dates">
            <h1 class="date">
              <bdi>{gregorian}</bdi>
            </h1>
            {hijri ? (
              <p class="hijri">
                <bdi>{hijri}</bdi>
              </p>
            ) : null}
          </div>
        </div>
        <div class="hero-place">
          <TownChip name={settings.place.name} onChange={() => setShowLocation(true)} />
        </div>
      </header>

      {comingKey !== null && ramadan !== null ? (
        <DismissableNotice
          key={comingKey}
          title={t('times.ramadanBegins', { date: formatNoticeDate(ramadan.firstDay, locale) })}
          line={t('times.ramadanComing')}
          storageKey={comingKey}
          onHidden={hideNotice}
        />
      ) : null}
      {eidKey !== null ? (
        <DismissableNotice
          key={eidKey}
          title={t('times.eid')}
          line={t('times.eidNote')}
          storageKey={eidKey}
          onHidden={hideNotice}
        />
      ) : null}

      {compactHero ? (
        <section class="next-card is-compact">
          <p
            class="next-compact"
            role="timer"
            aria-live="off"
            aria-label={t('times.nextAria', { prayer: nextName, time: nextTime, wait: words })}
          >
            <Glyph slot={next.slot} size={20} />
            <span class="next-compact-name" aria-hidden="true">
              {nextName}
            </span>
            <span class="next-compact-time" aria-hidden="true">
              <bdi>{nextTime}</bdi>
            </span>
            <span class="next-compact-count" aria-hidden="true">
              <bdi>{countdown}</bdi>
            </span>
          </p>
        </section>
      ) : (
        <section class="next-card" aria-labelledby="next-label">
          <p class="next-label" id="next-label">
            {nextLabel}
          </p>
          <div class="next-row">
            <Glyph slot={next.slot} size={20} />
            <p class="next-name">{nextName}</p>
            <p class="next-time">
              <bdi>{nextTime}</bdi>
            </p>
          </div>
          <p
            class="countdown"
            role="timer"
            aria-live="off"
            aria-label={t('times.countdownAria', { wait: words, prayer: nextName })}
          >
            <bdi>{countdown}</bdi>
          </p>
          <p class="countdown-note" aria-hidden="true">
            {nextNote}
          </p>
          <div class="day-bars" aria-hidden="true">
            {bars.map((state, index) => (
              <span class={`day-bar day-bar-${state}`} key={index} />
            ))}
          </div>
        </section>
      )}

      {day.isPolar ? (
        <p class="polar-note">
          {t('times.polar')}
        </p>
      ) : null}

      <ul class="times" aria-label={t('times.today')}>
        {SLOTS.map((slot) => {
          const isNext = slot === next.slot && !next.isTomorrow;
          const isNow = slot === current;
          const classes = [
            'time-row',
            slot === 'sunrise' ? 'is-sunrise' : '',
            isNext ? 'is-next' : '',
            isNow ? 'is-now' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li
              class={classes}
              key={slot}
              data-slot={slot}
              data-testid={`time-${slot}`}
              aria-current={isNow ? 'time' : undefined}
            >
              <Glyph slot={slot} size={20} />
              <span class="time-label">
                {slotLabel(slot, inRamadan)}
                {isNext || isNow ? ' ' : null}
                {isNext ? <span class="state-pill next-pill">{t('common.next')}</span> : null}
                {isNow ? <span class="state-pill now-pill">{t('common.now')}</span> : null}
              </span>{' '}
              <span class="time-value">
                <bdi>{clock.format(day.times[slot])}</bdi>
              </span>
            </li>
          );
        })}
      </ul>

      <footer class="footer">
        <div class="footer-actions">
          <button class="action footer-settings" type="button" onClick={onOpenSettings}>
            {t('common.settings')}
          </button>
          <button class="action footer-pdf" type="button" onClick={onOpenPrint}>
            {t('times.savePdf')}
          </button>
        </div>
        <p class="footer-note">{t('times.footerNote')}</p>
      </footer>
    </main>
  );
}

