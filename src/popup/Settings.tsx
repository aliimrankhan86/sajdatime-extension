import { useEffect, useRef, useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { isMethodOfferedTo, isShiaMethod, methodsOfferedTo } from '../core/methods';
import { suggestMethod } from '../core/suggestions';
import { PRAYER_NAMES } from '../core/alerts';
import { parseAlertMessage, soundMessageType } from '../core/messages';
import { PRAYERS, type MethodId, type Sect } from '../core/types';
import { dateInZone, ramadanInfo, showsSettings } from '../core';
import { saveSettings } from '../settings/storage';
import { THEMES, type Settings as SettingsValue, type Theme } from '../settings/types';
import { applyTheme } from './theme';
import { LocationSheet } from './LocationSheet';

const THEME_LABELS: Record<Theme, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const METHOD_LABELS: Record<MethodId, string> = {
  moonsighting: 'Moonsighting Committee',
  'north-america': 'ISNA (North America)',
  karachi: 'Karachi',
  mwl: 'Muslim World League',
  'umm-al-qura': 'Umm al-Qura, Makkah',
  egyptian: 'Egyptian General Authority',
  dubai: 'Dubai',
  kuwait: 'Kuwait',
  qatar: 'Qatar',
  turkey: 'Turkey (Diyanet)',
  singapore: 'Singapore',
  jafari: 'Jafari',
  tehran: 'Tehran',
};

function browserName(): 'Edge' | 'Chrome' {
  const data = (navigator as unknown as { userAgentData?: { brands?: Array<{ brand: string }> } }).userAgentData;
  return data?.brands?.some((entry) => entry.brand === 'Microsoft Edge') ? 'Edge' : 'Chrome';
}

function Switch(props: { label: string; checked: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <button
      class="switch"
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-disabled={props.disabled}
      aria-label={props.label}
      onClick={props.onToggle}
    >
      <span class="switch-track" aria-hidden="true">
        <span class="switch-thumb" />
      </span>
    </button>
  );
}

function ChoiceRow(props: {
  selected: boolean;
  title: string;
  hint: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      class={props.selected ? 'choice-row is-selected' : 'choice-row'}
      type="button"
      aria-pressed={props.selected}
      aria-disabled={props.disabled}
      onClick={props.onSelect}
    >
      <span class="choice-title">{props.title}</span>
      <span class="choice-hint">{props.hint}</span>
    </button>
  );
}

interface Props {
  settings: SettingsValue;
  onClose: () => void;
  onSaved: (settings: SettingsValue) => void;
}

export function Settings({ settings, onClose, onSaved }: Props) {
  const [changingPlace, setChangingPlace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const browser = browserName();
  const locale = navigator.language || 'en-GB';
  const title = useRef<HTMLHeadingElement>(null);
  const wasChangingPlace = useRef(false);
  const saving = useRef(false);

  const today = dateInZone(new Date(), settings.place.timeZone);
  const ramadan = ramadanInfo(today, settings.hijriOffsetDays);
  const showRamadan = ramadan !== null && showsSettings(ramadan, today);

  useEffect(() => {
    title.current?.focus();
  }, []);

  useEffect(() => {
    void chrome.notifications.getPermissionLevel().then((level) => setBlocked(level === 'denied'));
  }, []);

  useEffect(() => {
    const onMessage = (message: unknown, sender: chrome.runtime.MessageSender | undefined) => {
      const type = parseAlertMessage(
        message,
        sender,
        chrome.runtime.id,
        chrome.runtime.getURL('offscreen/index.html'),
      );
      if (type === 'sound-ended') setPlaying(false);
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  useEffect(() => {
    if (changingPlace) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changingPlace, onClose]);

  useEffect(() => {
    if (wasChangingPlace.current && !changingPlace) {
      document.querySelector<HTMLButtonElement>('.compact-button')?.focus();
    }
    wasChangingPlace.current = changingPlace;
  }, [changingPlace]);

  // Paint the chosen theme at once, then save it. The save is what survives a reopen.
  function changeTheme(theme: Theme) {
    if (busy) return;
    applyTheme(theme);
    update({ theme });
  }

  function update(patch: Partial<Omit<SettingsValue, 'version'>>) {
    if (saving.current) return;
    saving.current = true;
    setError(null);
    setBusy(true);
    const next: SettingsValue = { ...settings, ...patch, version: 1 };
    saveSettings(next)
      .then(() => {
        saving.current = false;
        setBusy(false);
        onSaved(next);
      })
      .catch(() => {
        saving.current = false;
        setBusy(false);
        setError('Your settings could not be saved. Try again.');
      });
  }

  function changeSect(sect: Sect) {
    const patch: Partial<Omit<SettingsValue, 'version'>> = { sect };
    // A method the new school was never offered goes back to the school's suggestion,
    // not silently kept: a Sunni convention on a Shia user loses the Jafari Maghrib,
    // and a Shia one on a Sunni user gains it. Mirrors the phone's setSect.
    if (!isMethodOfferedTo(settings.method, sect)) {
      patch.method = suggestMethod(settings.place.countryCode, sect).suggested;
    }
    update(patch);
  }

  function togglePlay() {
    if (busy) return;
    if (playing) {
      setPlaying(false);
      void chrome.runtime.sendMessage({ type: 'stop' });
      return;
    }
    const type = soundMessageType(settings.alerts.sound, settings.sect);
    if (!type) return;
    setPlaying(true);
    void chrome.runtime.sendMessage({ type });
  }

  function sendTestAlert() {
    if (busy) return;
    void chrome.runtime.sendMessage({ type: 'test-alert' });
  }

  if (changingPlace) {
    return (
      <LocationSheet
        current={settings.place}
        onClose={() => setChangingPlace(false)}
        onSaved={(place) => {
          setChangingPlace(false);
          update({ place });
        }}
      />
    );
  }

  const suggestion = suggestMethod(settings.place.countryCode, settings.sect);
  const shiaMethod = isShiaMethod(settings.method);

  return (
    <main class="sheet">
      <header class="sheet-head">
        <h1 class="sheet-title" ref={title} tabIndex={-1}>
          Settings
        </h1>
        <button class="icon-button" type="button" aria-label="Close settings" onClick={onClose}>
          ×
        </button>
      </header>

      {error ? (
        <p class="error" role="alert">
          {error}
        </p>
      ) : null}

      <details class="settings-group disclaimer">
        <summary class="disclaimer-summary">
          <span class="group-title">Disclaimer</span>
          <span class="field-hint">A helper, not a religious authority. Worth reading.</span>
        </summary>
        <p class="disclaimer-text">
          SajdaTime is a helper, not a religious authority. These times are worked out on this
          computer from the position of the sun, using published calculation methods. They are
          not given by a mosque, a scholar, or any authority. I am not a Mufti, an Aalim, or an
          expert in fiqh, and this extension was built with the help of artificial intelligence.
          Software can carry faults, the computer can hold the wrong place or the wrong clock,
          and I can be wrong. Take what you see as a calculation, not a ruling. Where SajdaTime
          and your mosque disagree, follow your mosque. If something looks wrong or you are
          unsure, ask someone qualified. SajdaTime is free and given as it is, with no warranty
          and no promise of accuracy. Please remember me, my family, and my parents in your duas.
        </p>
      </details>

      <section class="settings-group" aria-labelledby="place-heading">
        <h2 class="group-title" id="place-heading">
          Place
        </h2>
        <div class="setting-row">
          <div class="setting-copy">
            <p class="setting-title">{settings.place.name}</p>
            <p class="setting-value">
              {settings.place.countryCode === 'ZZ'
                ? 'From this computer'
                : countryName(settings.place.countryCode, locale)}
            </p>
          </div>
          <button
            class="compact-button"
            type="button"
            aria-disabled={busy}
            onClick={() => {
              if (!busy) setChangingPlace(true);
            }}
          >
            Change
          </button>
        </div>
      </section>

      <section class="settings-group" aria-labelledby="theme-heading">
        <h2 class="group-title" id="theme-heading">
          Theme
        </h2>
        <div class="segmented" role="group" aria-labelledby="theme-heading">
          {THEMES.map((theme) => (
            <button
              class={settings.theme === theme ? 'segment is-selected' : 'segment'}
              type="button"
              key={theme}
              aria-pressed={settings.theme === theme}
              aria-disabled={busy}
              onClick={() => changeTheme(theme)}
            >
              {THEME_LABELS[theme]}
            </button>
          ))}
        </div>
      </section>

      <section class="settings-group" aria-labelledby="school-heading">
        <h2 class="group-title" id="school-heading">
          School
        </h2>
        <div class="segmented" role="group" aria-labelledby="school-heading">
          <button
            class={settings.sect === 'sunni' ? 'segment is-selected' : 'segment'}
            type="button"
            aria-pressed={settings.sect === 'sunni'}
            aria-disabled={busy}
            onClick={() => changeSect('sunni')}
          >
            Sunni
          </button>
          <button
            class={settings.sect === 'shia' ? 'segment is-selected' : 'segment'}
            type="button"
            aria-pressed={settings.sect === 'shia'}
            aria-disabled={busy}
            onClick={() => changeSect('shia')}
          >
            Shia
          </button>
        </div>
        <p class="field-hint">This sets which calculation methods are offered.</p>
      </section>

      <section class="settings-group" aria-labelledby="method-heading">
        <h2 class="group-title" id="method-heading">
          Calculation method
        </h2>
        <label class="sr-only" for="method">
          Calculation method
        </label>
        <select
          class="select"
          id="method"
          value={settings.method}
          aria-disabled={busy}
          onChange={(event) => update({ method: event.currentTarget.value as MethodId })}
        >
          {methodsOfferedTo(settings.sect).map((method) => (
            <option value={method} key={method}>
              {METHOD_LABELS[method]}
            </option>
          ))}
        </select>
        <p class="field-hint">
          Suggested for this place: {METHOD_LABELS[suggestion.suggested]}. You can choose another.
        </p>
      </section>

      <section class="settings-group" aria-labelledby="asr-heading">
        <h2 class="group-title" id="asr-heading">
          Asr school
        </h2>
        {shiaMethod ? (
          <p class="field-hint">This method sets its own Asr rule, so there is nothing to choose here.</p>
        ) : (
          <div class="segmented" role="group" aria-labelledby="asr-heading">
            <button
              class={settings.madhab === 'shafii' ? 'segment is-selected' : 'segment'}
              type="button"
              aria-pressed={settings.madhab === 'shafii'}
              aria-disabled={busy}
              onClick={() => update({ madhab: 'shafii' })}
            >
              Shafi'i
            </button>
            <button
              class={settings.madhab === 'hanafi' ? 'segment is-selected' : 'segment'}
              type="button"
              aria-pressed={settings.madhab === 'hanafi'}
              aria-disabled={busy}
              onClick={() => update({ madhab: 'hanafi' })}
            >
              Hanafi
            </button>
          </div>
        )}
        <p class="field-hint">This only changes when Asr begins.</p>
      </section>

      <section class="settings-group" aria-labelledby="hijri-heading">
        <h2 class="group-title" id="hijri-heading">
          Hijri date
        </h2>
        <div class="stepper">
          <button
            class="step-button"
            type="button"
            aria-label="One day earlier"
            aria-disabled={busy || settings.hijriOffsetDays <= -2}
            onClick={() => {
              if (!busy && settings.hijriOffsetDays > -2) {
                update({ hijriOffsetDays: settings.hijriOffsetDays - 1 });
              }
            }}
          >
            −
          </button>
          <output class="step-value" aria-live="polite">
            {settings.hijriOffsetDays === 0
              ? 'No change'
              : `${settings.hijriOffsetDays > 0 ? '+' : ''}${settings.hijriOffsetDays} ${Math.abs(settings.hijriOffsetDays) === 1 ? 'day' : 'days'}`}
          </output>
          <button
            class="step-button"
            type="button"
            aria-label="One day later"
            aria-disabled={busy || settings.hijriOffsetDays >= 2}
            onClick={() => {
              if (!busy && settings.hijriOffsetDays < 2) {
                update({ hijriOffsetDays: settings.hijriOffsetDays + 1 });
              }
            }}
          >
            +
          </button>
        </div>
        <p class="field-hint">Use this if your mosque's Hijri date differs by a day or two.</p>
      </section>

      {showRamadan ? (
        <section class="settings-group" aria-labelledby="ramadan-heading">
          <h2 class="group-title" id="ramadan-heading">
            Ramadan
          </h2>
          <div class="switch-row">
            <div class="switch-copy">
              <p class="switch-title">Ramadan card</p>
            </div>
            <Switch
              label="Ramadan card"
              checked={settings.ramadanCard}
              disabled={busy}
              onToggle={() => update({ ramadanCard: !settings.ramadanCard })}
            />
          </div>
        </section>
      ) : null}

      <section class="settings-group" aria-labelledby="alerts-heading">
        <h2 class="group-title" id="alerts-heading">
          Alerts
        </h2>

        {blocked ? (
          <div class="blocked-notice" role="alert">
            <p class="blocked-title">Prayer alerts are blocked</p>
            <p class="blocked-text">
              {browser} is not allowed to show notifications for SajdaTime, so the alert cannot appear.
            </p>
          </div>
        ) : null}

        <div class="switch-row">
          <div class="switch-copy">
            <p class="switch-title">Prayer alerts</p>
            <p class="switch-hint">A message and a sound at each prayer.</p>
          </div>
          <Switch
            label="Prayer alerts"
            checked={settings.alerts.enabled}
            disabled={busy}
            onToggle={() => update({ alerts: { ...settings.alerts, enabled: !settings.alerts.enabled } })}
          />
        </div>

        {settings.alerts.enabled ? (
          <>
            {PRAYERS.map((prayer) => (
              <div class="switch-row" key={prayer}>
                <div class="switch-copy">
                  <p class="switch-title">{PRAYER_NAMES[prayer]}</p>
                </div>
                <Switch
                  label={PRAYER_NAMES[prayer]}
                  checked={settings.alerts.prayers[prayer]}
                  disabled={busy}
                  onToggle={() =>
                    update({
                      alerts: {
                        ...settings.alerts,
                        prayers: { ...settings.alerts.prayers, [prayer]: !settings.alerts.prayers[prayer] },
                      },
                    })
                  }
                />
              </div>
            ))}

            <div class="sound-head">
              <h3 class="group-title" id="sound-heading">
                Sound
              </h3>
              {settings.alerts.sound !== 'silent' ? (
                <button class="compact-button" type="button" aria-disabled={busy} onClick={togglePlay}>
                  {playing ? 'Stop' : 'Play'}
                </button>
              ) : null}
            </div>

            <div class="choices" role="group" aria-labelledby="sound-heading">
              <ChoiceRow
                selected={settings.alerts.sound === 'beep'}
                title="Soft beep"
                hint="Short and gentle"
                disabled={busy}
                onSelect={() => update({ alerts: { ...settings.alerts, sound: 'beep' } })}
              />
              <ChoiceRow
                selected={settings.alerts.sound === 'adhan'}
                title="Adhan"
                hint="The full call to prayer"
                disabled={busy}
                onSelect={() => update({ alerts: { ...settings.alerts, sound: 'adhan' } })}
              />
              <ChoiceRow
                selected={settings.alerts.sound === 'silent'}
                title="Silent"
                hint="The message only"
                disabled={busy}
                onSelect={() => update({ alerts: { ...settings.alerts, sound: 'silent' } })}
              />
            </div>

            <button class="action action-small" type="button" aria-disabled={busy} onClick={sendTestAlert}>
              Send a test alert
            </button>
            <p class="field-hint">If nothing appears, check your computer's notification and Focus settings.</p>

            <p class="alerts-note">{browser} needs to be open.</p>
            <p class="alerts-note">If {browser} is closed or the computer is asleep, no alert can sound.</p>
          </>
        ) : null}
      </section>

      <section class="settings-group" aria-labelledby="about-heading">
        <h2 class="group-title" id="about-heading">
          About
        </h2>
        <a
          class="link"
          href="https://aliimrankhan86.github.io/sajdatime-extension/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy policy
        </a>
        <p class="field-hint">SajdaTime 0.1.0</p>
        <p class="field-hint">
          City data from{' '}
          <a class="link" href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">
            GeoNames
          </a>
          , CC BY 4.0.
        </p>
        <details class="credits">
          <summary class="credits-summary">Adhan recordings</summary>
          <p class="field-hint">Sunni adhan: recorded by Adam-synagda, CC0.</p>
          <p class="field-hint">
            Shia adhan: sung by Saeed Hatamzadeh-Varmazyar,{' '}
            <a
              class="link"
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-SA 4.0
            </a>
            .
          </p>
          <p class="field-hint">Both via Wikimedia Commons.</p>
        </details>
      </section>
    </main>
  );
}
