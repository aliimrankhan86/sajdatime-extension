import { useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { METHOD_IDS, isShiaMethod } from '../core/methods';
import { suggestMethod } from '../core/suggestions';
import type { MethodId } from '../core/types';
import { saveSettings } from '../settings/storage';
import type { Settings as SettingsValue } from '../settings/types';
import { LocationSheet } from './LocationSheet';

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

interface Props {
  settings: SettingsValue;
  onClose: () => void;
  onSaved: (settings: SettingsValue) => void;
}

export function Settings({ settings, onClose, onSaved }: Props) {
  const [changingPlace, setChangingPlace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = navigator.language || 'en-GB';

  function update(patch: Partial<Omit<SettingsValue, 'version'>>) {
    setError(null);
    setBusy(true);
    const next: SettingsValue = { ...settings, ...patch, version: 1 };
    saveSettings(next)
      .then(() => {
        setBusy(false);
        onSaved(next);
      })
      .catch(() => {
        setBusy(false);
        setError('Your settings could not be saved. Try again.');
      });
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
        <h1 class="sheet-title">Settings</h1>
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
            onClick={() => setChangingPlace(true)}
            disabled={busy}
          >
            Change
          </button>
        </div>
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
          disabled={busy}
          onChange={(event) => update({ method: event.currentTarget.value as MethodId })}
        >
          {METHOD_IDS.map((method) => (
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
              disabled={busy}
              onClick={() => update({ madhab: 'shafii' })}
            >
              Shafi'i
            </button>
            <button
              class={settings.madhab === 'hanafi' ? 'segment is-selected' : 'segment'}
              type="button"
              aria-pressed={settings.madhab === 'hanafi'}
              disabled={busy}
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
            disabled={busy || settings.hijriOffsetDays <= -2}
            onClick={() => update({ hijriOffsetDays: settings.hijriOffsetDays - 1 })}
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
            disabled={busy || settings.hijriOffsetDays >= 2}
            onClick={() => update({ hijriOffsetDays: settings.hijriOffsetDays + 1 })}
          >
            +
          </button>
        </div>
        <p class="field-hint">Use this if your mosque's Hijri date differs by a day or two.</p>
      </section>

      <section class="settings-group" aria-labelledby="about-heading">
        <h2 class="group-title" id="about-heading">
          About
        </h2>
        <a
          class="link"
          href="https://aliimrankhan86.github.io/sajdatime-extension/privacy.html"
          target="_blank"
          rel="noreferrer"
        >
          Privacy policy
        </a>
        <p class="field-hint">SajdaTime 0.1.0</p>
        <p class="field-hint">
          City data from{' '}
          <a class="link" href="https://www.geonames.org/" target="_blank" rel="noreferrer">
            GeoNames
          </a>
          , CC BY 4.0.
        </p>
      </section>
    </main>
  );
}
