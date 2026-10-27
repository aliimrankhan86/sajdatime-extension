import { useEffect, useRef, useState } from 'preact/hooks';
import {
  SLOTS,
  computeDay,
  currentPrayer,
  dateInZone,
  hijriFor,
  nextPrayer,
  type DayTimes,
  type NextPrayer,
  type Prayer,
  type PrayerSlot,
} from '../core';
import type { City } from '../core/cities';
import { firstSettings } from '../settings/create';
import { MAKKAH, placeFromCity, placeFromGeolocation } from '../settings/place';
import { clearSettings, loadSettings, saveSettings, watchSettings } from '../settings/storage';
import type { Place, Settings } from '../settings/types';
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

export function Popup() {
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined);
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
        placeFromGeolocation(
          position.coords.latitude,
          position.coords.longitude,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        )
          .then((place) => {
            setBusy(false);
            setFound(place);
          })
          .catch(() => {
            setBusy(false);
            setError('We could not read your location. Allow location for this browser, then try again.');
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

  let today: string;
  let day: DayTimes;
  let next: NextPrayer;
  let current: Prayer | null;
  let clock: Intl.DateTimeFormat;
  try {
    today = dateInZone(now, prefs.timeZone);
    day = computeDay(settings.place, today, prefs);
    next = nextPrayer(settings.place, prefs, now);
    current = currentPrayer(settings.place, prefs, now);
    // The browser's own 12 or 24 hour style for its language. A stored language
    // will take over when the language screen lands. In 24 hour style the hour
    // keeps its leading zero, so the column of times lines up.
    const locale = navigator.language || 'en-GB';
    const hourCycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
    const hour12 = hourCycle === 'h11' || hourCycle === 'h12';
    clock = new Intl.DateTimeFormat(locale, {
      timeZone: prefs.timeZone,
      hour: hour12 ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12,
    });
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
  const nextLabel = next.isTomorrow ? 'Next prayer, tomorrow' : 'Next prayer';
  const countdown = formatCountdown(next.at, now);

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

      <section class="next-card" aria-labelledby="next-label">
        <p class="next-label" id="next-label">
          {nextLabel}
        </p>
        <div class="next-row">
          <p class="next-name">{LABELS[next.slot]}</p>
          <p class="next-time">{clock.format(next.at)}</p>
        </div>
        <p
          class="countdown"
          role="timer"
          aria-live="off"
          aria-label={`Time until ${LABELS[next.slot]}: ${countdown}`}
        >
          {countdown}
        </p>
        <p class="countdown-note">until {LABELS[next.slot]}</p>
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
                {LABELS[slot]}
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

