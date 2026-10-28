import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import {
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
import type { City } from '../core/cities';
import { firstSettings } from '../settings/create';
import { MAKKAH, placeFromCity, placeFromGeolocation } from '../settings/place';
import { clearSettings, loadSettings, saveSettings, watchSettings } from '../settings/storage';
import type { Place, Settings } from '../settings/types';
import { applyTheme, watchSystemTheme } from './theme';
import { CitySearch } from './CitySearch';
import { Brand } from './Brand';
import { LocationFound } from './LocationFound';
import { Settings as SettingsScreen } from './Settings';

const HIJRI_MONTHS = [
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
];

const LABELS: Record<PrayerSlot, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

function formatHijri(date: string, offset: number): string | null {
  const day = hijriFor(date, offset);
  if (!day) return null;
  const month = HIJRI_MONTHS[day.month - 1];
  return month ? `${day.day} ${month} ${day.year}` : null;
}

function formatCountdown(target: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} h`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes} m`);
  parts.push(`${String(rest).padStart(2, '0')} s`);
  return parts.join(' ');
}

/** The label a prayer slot shows during Ramadan, when the Ramadan card is on. */
function slotLabel(slot: PrayerSlot, inRamadan: boolean): string {
  if (inRamadan && slot === 'fajr') return 'Suhoor ends';
  if (inRamadan && slot === 'maghrib') return 'Iftar';
  return LABELS[slot];
}

/** The words under the countdown during Ramadan, when the Ramadan card is on. */
function countdownNote(slot: Prayer, inRamadan: boolean): string {
  if (inRamadan && slot === 'fajr') return 'until suhoor ends';
  if (inRamadan && slot === 'maghrib') return 'until you break your fast';
  return `until ${LABELS[slot]}`;
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
      document.querySelector<HTMLButtonElement>('.header-button')?.focus();
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
        <p class="welcome-note">Loading SajdaTime...</p>
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

function FirstRun({ onSaved }: { onSaved: (settings: Settings) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Place | null>(null);

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('This browser cannot read your location. Try a newer version of Chrome or Edge.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // placeFromGeolocation never rejects: when the city list will not load it falls
        // back to "My location" itself, so there is no error branch to show here.
        placeFromGeolocation(
          position.coords.latitude,
          position.coords.longitude,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        ).then((place) => {
          setBusy(false);
          setFound(place);
        });
      },
      () => {
        setBusy(false);
        setError('We could not read your location. Allow location for this browser, then try again.');
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  }

  /**
   * The panel's Continue. The place is saved here rather than when the position arrives,
   * because saving earlier would switch the popup to Times before the user has read the
   * confirmation or pressed anything.
   */
  function continueWithFound() {
    if (!found) return;
    setError(null);
    setBusy(true);
    const next = firstSettings(found);
    saveSettings(next)
      .then(() => {
        setBusy(false);
        onSaved(next);
      })
      .catch(() => {
        setBusy(false);
        setError('Your place could not be saved. Try again.');
      });
  }

  function useCity(city: City) {
    setError(null);
    setBusy(true);
    const next = firstSettings(placeFromCity(city));
    saveSettings(next)
      .then(() => {
        setBusy(false);
        onSaved(next);
      })
      .catch(() => {
        setBusy(false);
        setError('Your place could not be saved. Try again.');
      });
  }

  function useMakkah() {
    setError(null);
    setBusy(true);
    const next = firstSettings(MAKKAH);
    saveSettings(next)
      .then(() => {
        setBusy(false);
        onSaved(next);
      })
      .catch(() => {
        setBusy(false);
        setError('Your place could not be saved. Try again.');
      });
  }

  // The location controls are replaced by the confirmation, so there is one thing to read
  // and one thing to press. Searching by name never comes through here.
  if (found) {
    return (
      <main class="welcome">
        <Brand />
        <h1 class="welcome-title">Prayer times, quietly in your browser.</h1>
        <LocationFound place={found} action="Continue" onAction={continueWithFound} />
        {error ? (
          <p class="error" role="alert">
            {error}
          </p>
        ) : null}
      </main>
    );
  }

  return (
    <main class="welcome">
      <Brand />
      <h1 class="welcome-title">Prayer times, quietly in your browser.</h1>
      <p class="welcome-lead">
        Fajr to Isha, a calm countdown, and the Hijri date. Worked out on your computer.
      </p>
      <button class="action" type="button" onClick={useMyLocation} disabled={busy}>
        {busy ? 'Finding your place...' : 'Use my location'}
      </button>
      <p class="welcome-note">
        SajdaTime does not send your location anywhere. Your browser's location service finds it.
        There is no account and no ads.
      </p>
      <CitySearch onPick={useCity} disabled={busy} />
      {error ? (
        <>
          <p class="error" role="alert">
            {error}
          </p>
          <button class="action" type="button" onClick={useMakkah} disabled={busy}>
            Use Makkah for now
          </button>
          <p class="welcome-note">Times will be for Makkah until you set your place.</p>
        </>
      ) : null}
    </main>
  );
}

function DismissableNotice({
  title,
  line,
  storageKey,
}: {
  title: string;
  line: string;
  storageKey: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    void isNoticeDismissed(storageKey)
      .then((value) => {
        if (alive) setDismissed(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [storageKey]);

  function close(): void {
    void dismissNotice(storageKey).catch(() => undefined);
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <section class="notice">
      <h2 class="notice-title">{title}</h2>
      <p class="notice-line">{line}</p>
      <button class="notice-close" type="button" onClick={close}>
        Close
      </button>
    </section>
  );
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
  const locale = navigator.language || 'en-GB';

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
        <h1 class="welcome-title">Times are not available for this place.</h1>
        <p class="welcome-lead">The location saved for SajdaTime cannot be used. Set your place again.</p>
        <button class="action" type="button" onClick={onReset}>
          Set your place again
        </button>
      </main>
    );
  }

  const hijri = formatHijri(today, settings.hijriOffsetDays);
  const ramadan = ramadanInfo(today, settings.hijriOffsetDays);
  const inRamadan = settings.ramadanCard && ramadan !== null && contains(ramadan, today);
  const nextLabel = next.isTomorrow ? 'Next prayer, tomorrow' : 'Next prayer';
  const countdown = formatCountdown(next.at, now);
  const nextName = slotLabel(next.slot, inRamadan);
  const nextNote = countdownNote(next.slot, inRamadan);

  const eid = eidOn(today, settings.hijriOffsetDays);
  const comingKey =
    ramadan !== null && showsComingNotice(ramadan, today) ? ramadanNoticeKey(ramadan.hijriYear) : null;
  const eidKey = eid !== null ? eidNoticeKey(eid.eid, eid.hijriYear) : null;

  return (
    <main>
      <header class="hero">
        <div class="hero-top">
          <Brand />
          <button class="header-button" type="button" onClick={onOpenSettings}>
            Settings
          </button>
        </div>
        <h1 class="place">{settings.place.name}</h1>
        {hijri ? <p class="hijri">{hijri}</p> : null}
      </header>

      {comingKey !== null && ramadan !== null ? (
        <DismissableNotice
          title={`Ramadan begins on ${formatNoticeDate(ramadan.firstDay, locale)}`}
          line="From the first day, the Ramadan card shows suhoor and iftar times here. You can turn it off in Settings."
          storageKey={comingKey}
        />
      ) : null}
      {eidKey !== null ? (
        <DismissableNotice
          title="Eid Mubarak"
          line="Follow your mosque for the date of Eid."
          storageKey={eidKey}
        />
      ) : null}

      <section class="next-card" aria-labelledby="next-label">
        <p class="next-label" id="next-label">
          {nextLabel}
        </p>
        <div class="next-row">
          <p class="next-name">{nextName}</p>
          <p class="next-time">{clock.format(next.at)}</p>
        </div>
        <p
          class="countdown"
          role="timer"
          aria-live="off"
          aria-label={`Time until ${nextName}: ${countdown}`}
        >
          {countdown}
        </p>
        <p class="countdown-note">{nextNote}</p>
      </section>

      {day.isPolar ? (
        <p class="polar-note">
          These times are estimated from a place where the sun rises and sets, because they
          cannot be worked out directly here.
        </p>
      ) : null}

      <ul class="times" aria-label="Today's prayer times">
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
              <span class="time-label">
                {slotLabel(slot, inRamadan)}
                {isNext || isNow ? ' ' : null}
                {isNext ? <span class="state-pill next-pill">Next</span> : null}
                {isNow ? <span class="state-pill now-pill">Now</span> : null}
              </span>{' '}
              <span class="time-value">{clock.format(day.times[slot])}</span>
            </li>
          );
        })}
      </ul>

      <p class="footer">Worked out on this computer. No ads.</p>
    </main>
  );
}

