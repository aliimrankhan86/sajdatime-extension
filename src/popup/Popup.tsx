import { useEffect, useState } from 'preact/hooks';
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
import { firstSettings } from '../settings/create';
import { loadSettings, saveSettings, watchSettings } from '../settings/storage';
import type { Place, Settings } from '../settings/types';

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

  return <Times settings={settings} />;
}

function FirstRun({ onSaved }: { onSaved: (settings: Settings) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('This browser cannot read your location. Try a newer version of Chrome or Edge.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place: Place = {
          name: 'My location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          countryCode: 'ZZ',
        };
        const next = firstSettings(place, navigator.language);
        saveSettings(next)
          .then(() => {
            setBusy(false);
            onSaved(next);
          })
          .catch(() => {
            setBusy(false);
            setError('Your place could not be saved. Try again.');
          });
      },
      () => {
        setBusy(false);
        setError('We could not read your location. Allow location for this browser, then try again.');
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  }

  return (
    <main class="welcome">
      <p class="brand">SajdaTime</p>
      <h1 class="welcome-title">Prayer times, quietly in your browser.</h1>
      <p class="welcome-lead">
        Fajr to Isha, a calm countdown, and the Hijri date. Worked out on your computer.
      </p>
      <button class="action" type="button" onClick={useMyLocation} disabled={busy}>
        {busy ? 'Finding your place...' : 'Use my location'}
      </button>
      <p class="welcome-note">
        SajdaTime does not send your location anywhere. There is no account and no ads.
      </p>
      {error ? (
        <p class="error" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  );
}

function Times({ settings }: { settings: Settings }) {
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
      </main>
    );
  }

  const hijri = formatHijri(today, settings.hijriOffsetDays);
  const nextLabel = next.isTomorrow ? 'Next prayer, tomorrow' : 'Next prayer';
  const countdown = formatCountdown(next.at, now);

  return (
    <main>
      <header class="hero">
        <p class="brand">SajdaTime</p>
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
          The sun does not rise or set here today. These times come from the nearest ordinary day.
        </p>
      ) : null}

      <ul class="times" aria-label="Today's prayer times">
        {SLOTS.map((slot) => {
          const isNext = slot === next.slot;
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
              aria-current={isNext ? 'true' : undefined}
            >
              <span class="time-label">{LABELS[slot]}</span>
              <span class="time-value">{clock.format(day.times[slot])}</span>
            </li>
          );
        })}
      </ul>

      <p class="footer">Worked out on this computer. No ads.</p>
    </main>
  );
}

