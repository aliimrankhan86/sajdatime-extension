import { useEffect, useRef, useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { isMethodOfferedTo, isShiaMethod, methodsOfferedTo } from '../core/methods';
import { suggestMethod } from '../core/suggestions';
import { PRAYER_NAMES } from '../core/alerts';
import { parseAlertMessage, soundMessageType } from '../core/messages';
import { PRAYERS, type MethodId, type Sect } from '../core/types';
import { computeDay, dateInZone, ramadanInfo, showsSettings } from '../core';
import { clockFormatter } from '../core/clock';
import { saveSettings } from '../settings/storage';
import { THEMES, type Settings as SettingsValue, type Theme } from '../settings/types';
import { applyTheme } from './theme';
import { LocationSheet } from './LocationSheet';
import { Row } from './components/Row';
import { Sheet } from './components/Sheet';
import { ChoiceRow } from './components/ChoiceRow';
import { Segmented } from './components/Segmented';
import { Notice } from './components/Notice';
import {
  CalendarIcon,
  CheckMark,
  ClockIcon,
  ContrastIcon,
  InfoIcon,
  LockIcon,
  NoteIcon,
  PersonIcon,
  PhoneIcon,
  PinIcon,
  SchoolIcon,
  TuneIcon,
  WarningMark,
} from './icons';

const THEME_LABELS: Record<Theme, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

// The method names and hints are the phone's own strings (Ali's words), kept verbatim.
const METHOD_NAMES: Record<MethodId, string> = {
  moonsighting: 'Moonsighting Committee',
  'north-america': 'ISNA, North America',
  karachi: 'University of Karachi',
  mwl: 'Muslim World League',
  'umm-al-qura': 'Umm al-Qura, Makkah',
  egyptian: 'Egyptian General Authority',
  dubai: 'Dubai',
  kuwait: 'Kuwait',
  qatar: 'Qatar',
  turkey: 'Diyanet, Turkey',
  singapore: 'Kemenag & MUIS, Indonesia and Singapore',
  jafari: 'Jafari (Ithna Ashari)',
  tehran: 'Institute of Geophysics, Tehran',
};

const METHOD_HINTS: Record<MethodId, string> = {
  mwl: 'A general convention used in many countries. The standard here.',
  egyptian: "Egypt's official method.",
  karachi: 'Common across Pakistan and South Asia.',
  'umm-al-qura': 'The official method in Saudi Arabia. Isha is set at a fixed time after Maghrib.',
  dubai: 'A convention used in the Gulf.',
  moonsighting: 'A seasonal rule made for places far from the equator. Followed by some mosques in Britain.',
  'north-america':
    'The Islamic Society of North America. Used by many mosques in the United States and Canada.',
  kuwait: 'The convention used in Kuwait.',
  qatar: 'The convention used in Qatar.',
  singapore: 'The official bodies of Indonesia and Singapore.',
  turkey: "Turkey's Presidency of Religious Affairs, with its precaution minutes.",
  jafari: "The usual Shia convention. Maghrib is a little after sunset, once the redness has left the sky.",
  tehran: "The University of Tehran, whose calendar Iran's official times follow.",
};

// PLAN 6.3 "Other methods": the region groups that the method sheet shows below the
// "Suggested for <country>" group. North America has no group of its own in the plan, so
// ISNA sits with the other western far-from-the-equator methods under Europe (D-034).
const REGION_GROUPS: ReadonlyArray<{ title: string; methods: ReadonlyArray<MethodId> }> = [
  { title: 'Europe', methods: ['moonsighting', 'mwl', 'north-america', 'turkey'] },
  {
    title: 'Middle East and Africa',
    methods: ['umm-al-qura', 'egyptian', 'dubai', 'kuwait', 'qatar'],
  },
  { title: 'South and East Asia', methods: ['karachi', 'singapore'] },
  { title: 'Shia', methods: ['jafari', 'tehran'] },
];

const SOUND_LABELS: Record<SettingsValue['alerts']['sound'], string> = {
  beep: 'Soft beep',
  adhan: 'Adhan',
  silent: 'Silent',
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

type SheetKind = 'disclaimer' | 'school' | 'asr' | 'method' | 'hijri' | 'sound' | 'theme' | 'credits';

interface Props {
  settings: SettingsValue;
  onClose: () => void;
  onSaved: (settings: SettingsValue) => void;
}

export function Settings({ settings, onClose, onSaved }: Props) {
  const [changingPlace, setChangingPlace] = useState(false);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const browser = browserName();
  const locale = navigator.language || 'en-GB';
  const title = useRef<HTMLHeadingElement>(null);
  const wasChangingPlace = useRef(false);
  const focusTarget = useRef<SheetKind | null>(null);
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
    if (changingPlace || sheet) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changingPlace, sheet, onClose]);

  useEffect(() => {
    if (wasChangingPlace.current && !changingPlace) {
      document.querySelector<HTMLButtonElement>('[data-row="place"]')?.focus();
    }
    wasChangingPlace.current = changingPlace;
  }, [changingPlace]);

  // A sheet replaces the list, so the row that opened it is unmounted. Put focus back
  // once the sheet closes, instead of dropping a keyboard user on <body>.
  useEffect(() => {
    if (sheet === null && focusTarget.current) {
      const target = focusTarget.current;
      focusTarget.current = null;
      document.querySelector<HTMLButtonElement>(`[data-row="${target}"]`)?.focus();
    }
  }, [sheet]);

  function openSheet(kind: SheetKind) {
    if (busy) return;
    setSheet(kind);
  }

  function closeSheet(kind?: SheetKind) {
    focusTarget.current = kind ?? sheet;
    setSheet(null);
  }

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
    if (!isMethodOfferedTo(settings.method, sect)) {
      patch.method = suggestMethod(settings.place.countryCode, sect).suggested;
    }
    update(patch);
  }

  function chooseMethod(method: MethodId) {
    update({ method });
    closeSheet('method');
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
  const placeValue =
    settings.place.countryCode === 'ZZ'
      ? 'From this computer'
      : countryName(settings.place.countryCode, locale);
  const hijriValue =
    settings.hijriOffsetDays === 0
      ? 'No change'
      : `${settings.hijriOffsetDays > 0 ? '+' : ''}${settings.hijriOffsetDays} ${
          Math.abs(settings.hijriOffsetDays) === 1 ? 'day' : 'days'
        }`;
  const soundValue = SOUND_LABELS[settings.alerts.sound];

  // Today's Fajr and Isha for one method, to put beside each choice in the method sheet.
  const clock = clockFormatter(settings.place.timeZone, locale);
  function methodTimes(method: MethodId): { fajr: string; isha: string } | null {
    try {
      const day = computeDay(settings.place, today, {
        method,
        madhab: settings.madhab,
        timeZone: settings.place.timeZone,
        hijriOffsetDays: settings.hijriOffsetDays,
      });
      return { fajr: clock.format(day.times.fajr), isha: clock.format(day.times.isha) };
    } catch {
      return null;
    }
  }

  const offeredMethods = methodsOfferedTo(settings.sect);
  const methodGroups: ReadonlyArray<{ title: string; methods: ReadonlyArray<MethodId> }> =
    settings.sect === 'shia'
      ? [{ title: 'Shia', methods: ['jafari', 'tehran'] }]
      : [
          {
            title: `Suggested for ${placeValue}`,
            methods: [suggestion.suggested, ...suggestion.alternatives],
          },
          ...REGION_GROUPS.filter((group) => group.title !== 'Shia'),
          { title: 'Shia', methods: ['jafari', 'tehran'] },
        ];

  if (sheet) {
    return renderSheet();
  }

  return (
    <main class="settings">
      <header class="settings-head">
        <button class="icon-button back-button" type="button" aria-label="Back to times" onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="settings-title" ref={title} tabIndex={-1}>
          Settings
        </h1>
      </header>

      {error ? (
        <p class="error" role="alert">
          {error}
        </p>
      ) : null}

      <div class="settings-scroll">
        <section class="group-card" aria-labelledby="disclaimer-heading">
          <h2 class="group-title" id="disclaimer-heading">
            Disclaimer
          </h2>
          <Row
            icon={<InfoIcon />}
            title="Disclaimer"
            value="A helper, not a religious authority. Worth reading."
            rowId="disclaimer"
            onClick={() => openSheet('disclaimer')}
          />
        </section>

        <section class="group-card" aria-labelledby="place-heading">
          <h2 class="group-title" id="place-heading">
            Place
          </h2>
          <Row
            icon={<PinIcon />}
            title={settings.place.name}
            value={placeValue}
            rowId="place"
            onClick={() => setChangingPlace(true)}
          />
        </section>

        <section class="group-card" aria-labelledby="prayer-times-heading">
          <h2 class="group-title" id="prayer-times-heading">
            Prayer times
          </h2>
          <Row
            icon={<SchoolIcon />}
            title="School"
            value={settings.sect === 'sunni' ? 'Sunni' : 'Shia'}
            rowId="school"
            onClick={() => openSheet('school')}
          />
          {!shiaMethod ? (
            <Row
              icon={<ClockIcon />}
              title="Asr school"
              value={settings.madhab === 'shafii' ? "Shafi'i" : 'Hanafi'}
              rowId="asr"
              onClick={() => openSheet('asr')}
            />
          ) : null}
          <Row
            icon={<TuneIcon />}
            title="Calculation method"
            value={METHOD_NAMES[settings.method]}
            rowId="method"
            onClick={() => openSheet('method')}
          />
          <Row
            icon={<CalendarIcon />}
            title="Hijri date"
            value={hijriValue}
            rowId="hijri"
            onClick={() => openSheet('hijri')}
          />
        </section>

        {showRamadan ? (
          <section class="group-card" aria-labelledby="ramadan-heading">
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

        <section class="group-card" aria-labelledby="alerts-heading">
          <h2 class="group-title" id="alerts-heading">
            Alerts
          </h2>

          {blocked ? (
            <Notice
              tone="warning"
              title="Prayer alerts are blocked"
              line={`${browser} is not allowed to show notifications for SajdaTime, so the alert cannot appear.`}
              mark={<WarningMark />}
            />
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

              <Row
                icon={<NoteIcon />}
                title="Sound"
                value={soundValue}
                rowId="sound"
                onClick={() => openSheet('sound')}
              />

              <button class="action action-small" type="button" aria-disabled={busy} onClick={sendTestAlert}>
                Send a test alert
              </button>
              <p class="field-hint">
                If nothing appears, check your computer's notification and Focus settings.
              </p>

              <Notice
                tone="quiet"
                title={`${browser} needs to be open`}
                line={`If ${browser} is closed or the computer is asleep, no alert can sound.`}
                mark={<CheckMark />}
              />
            </>
          ) : null}
        </section>

        <section class="group-card" aria-labelledby="appearance-heading">
          <h2 class="group-title" id="appearance-heading">
            Appearance
          </h2>
          <Row
            icon={<ContrastIcon />}
            title="Theme"
            value={THEME_LABELS[settings.theme]}
            rowId="theme"
            onClick={() => openSheet('theme')}
          />
        </section>

        <section class="group-card" aria-labelledby="about-heading">
          <h2 class="group-title" id="about-heading">
            About
          </h2>
          <Row
            icon={<LockIcon />}
            title="Privacy policy"
            rowId="privacy"
            onClick={() => {
              window.open('https://aliimrankhan86.github.io/sajdatime-extension/privacy.html', '_blank', 'noopener,noreferrer');
            }}
          />
          <Row
            icon={<PersonIcon />}
            title="Credits"
            value="GeoNames, adhan-js, adhan recordings"
            rowId="credits"
            onClick={() => openSheet('credits')}
          />
          <Row icon={<PhoneIcon />} title="Version" value="SajdaTime 0.1.0" chevron={false} />
        </section>
      </div>
    </main>
  );

  function renderSheet() {
    switch (sheet) {
      case 'disclaimer':
        return (
          <Sheet title="Disclaimer" onClose={() => closeSheet('disclaimer')}>
            <div class="sheet-body">
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
            </div>
          </Sheet>
        );

      case 'school':
        return (
          <Sheet title="School" onClose={() => closeSheet('school')}>
            <div class="sheet-body">
              <Segmented
                options={[
                  { value: 'sunni', label: 'Sunni' },
                  { value: 'shia', label: 'Shia' },
                ]}
                value={settings.sect}
                onChange={changeSect}
                disabled={busy}
                labelledBy="sheet-title"
              />
              <p class="field-hint">This sets which calculation methods are offered.</p>
            </div>
          </Sheet>
        );

      case 'asr':
        return (
          <Sheet title="Asr school" onClose={() => closeSheet('asr')}>
            <div class="sheet-body">
              <Segmented
                options={[
                  { value: 'shafii', label: "Shafi'i" },
                  { value: 'hanafi', label: 'Hanafi' },
                ]}
                value={settings.madhab}
                onChange={(madhab) => update({ madhab })}
                disabled={busy}
                labelledBy="sheet-title"
              />
              <p class="field-hint">This only changes when Asr begins.</p>
            </div>
          </Sheet>
        );

      case 'method':
        return (
          <Sheet title="Calculation method" onClose={() => closeSheet('method')} noFoot>
            <div class="sheet-body method-body">
              <p class="field-hint">
                Today's Fajr and Isha in {settings.place.name} are shown for each one, so you can
                compare with your mosque.
              </p>
              {methodGroups.map((group) => (
                <div class="method-group" key={group.title}>
                  <h3 class="method-group-title">{group.title}</h3>
                  <div class="method-list" role="group" aria-label={group.title}>
                    {group.methods
                      .filter((method) => offeredMethods.includes(method))
                      .map((method) => {
                        const times = methodTimes(method);
                        const selected = method === settings.method;
                        return (
                          <button
                            class={selected ? 'method-row is-selected' : 'method-row'}
                            type="button"
                            aria-pressed={selected}
                            data-method={method}
                            key={method}
                            onClick={() => chooseMethod(method)}
                          >
                            <span class="method-copy">
                              <span class="method-name">{METHOD_NAMES[method]}</span>
                              <span class="method-hint">{METHOD_HINTS[method]}</span>
                              {times ? (
                                <span class="method-times">
                                  <span class="method-time">Fajr {times.fajr}</span>
                                  <span class="method-time">Isha {times.isha}</span>
                                </span>
                              ) : null}
                            </span>
                            {selected ? (
                              <svg
                                class="choice-tick"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.4"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            ) : null}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </Sheet>
        );

      case 'hijri':
        return (
          <Sheet title="Hijri date" onClose={() => closeSheet('hijri')}>
            <div class="sheet-body">
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
                  {hijriValue}
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
            </div>
          </Sheet>
        );

      case 'sound':
        return (
          <Sheet title="Sound" onClose={() => closeSheet('sound')}>
            <div class="sheet-body">
              {settings.alerts.sound !== 'silent' ? (
                <button class="compact-button" type="button" aria-disabled={busy} onClick={togglePlay}>
                  {playing ? 'Stop' : 'Play'}
                </button>
              ) : null}
              <div class="choices" role="group" aria-labelledby="sheet-title">
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
            </div>
          </Sheet>
        );

      case 'theme':
        return (
          <Sheet title="Theme" onClose={() => closeSheet('theme')}>
            <div class="sheet-body">
              <Segmented
                options={THEMES.map((theme) => ({ value: theme, label: THEME_LABELS[theme] }))}
                value={settings.theme}
                onChange={changeTheme}
                disabled={busy}
                labelledBy="sheet-title"
              />
            </div>
          </Sheet>
        );

      case 'credits':
        return (
          <Sheet title="Credits" onClose={() => closeSheet('credits')}>
            <div class="sheet-body">
              <p class="credit-line">
                City data from{' '}
                <a class="link" href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">
                  GeoNames
                </a>
                , CC BY 4.0.
              </p>
              <p class="credit-line">Prayer times from adhan-js by Batoul Apps, MIT.</p>
              <p class="credit-line">Sunni adhan: recorded by Adam-synagda, CC0.</p>
              <p class="credit-line">
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
              <p class="credit-line">Both via Wikimedia Commons.</p>
            </div>
          </Sheet>
        );

      default:
        return null;
    }
  }
}
