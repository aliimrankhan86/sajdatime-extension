import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { isMethodOfferedTo, isShiaMethod, methodsOfferedTo } from '../core/methods';
import { suggestMethod } from '../core/suggestions';
import { prayerName } from '../core/alerts';
import { parseAlertMessage, soundMessageType } from '../core/messages';
import { PRAYERS, type MethodId, type Sect } from '../core/types';
import { computeDay, dateInZone, ramadanInfo, showsSettings } from '../core';
import { clockFormatter } from '../core/clock';
import { saveSettings } from '../settings/storage';
import {
  REMINDER_MINUTES,
  SUHOOR_MINUTES,
  THEMES,
  type Settings as SettingsValue,
  type Theme,
} from '../settings/types';
import {
  browserName,
  methodGroupsFor,
  methodHint,
  methodName,
  soundHint,
  soundLabel,
} from './meta';
import { shortDisclaimer } from './disclaimer';
import { applyTheme } from './theme';
import { LocationSheet } from './LocationSheet';
import { Row } from './components/Row';
import { Sheet } from './components/Sheet';
import { ChoiceRow } from './components/ChoiceRow';
import { Segmented } from './components/Segmented';
import { Notice } from './components/Notice';
import { applyLanguage, LANGUAGE_CHOICES, LANGUAGE_NAMES, LANGUAGE_NAMES_EN, t, type LanguageChoice, localeTag } from '../i18n';
import { CalendarIcon, CheckMark, ClockIcon, ContrastIcon, InfoIcon, LockIcon, NoteIcon, PersonIcon, PhoneIcon, PinIcon, SchoolIcon, TuneIcon, WarningMark, GlobeIcon } from './icons';

/**
 * One Settings group. A group of two or more rows carries a heading; a group of one
 * row does not, because a heading over a single row only repeats it (Disclaimer
 * over Disclaimer, Place over "London"). `rows` is that count, passed in rather
 * than derived from children so a conditional row cannot silently change the rule.
 */
function Group({
  title,
  id,
  rows,
  children,
}: {
  title: string;
  id: string;
  rows: number;
  children: ComponentChildren;
}) {
  if (rows < 2) return <div class="group-card">{children}</div>;
  return (
    <section class="group-card" aria-labelledby={id}>
      <h2 class="group-title" id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

const THEME_LABELS: Record<Theme, string> = {
  system: t('settings.themeSystem'),
  light: t('settings.themeLight'),
  dark: t('settings.themeDark'),
};

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

type SheetKind =
  | 'disclaimer'
  | 'school'
  | 'asr'
  | 'method'
  | 'hijri'
  | 'sound'
  | 'reminder'
  | 'suhoor'
  | 'theme'
  | 'language'
  | 'credits';

interface Props {
  settings: SettingsValue;
  onClose: () => void;
  onSaved: (settings: SettingsValue) => void;
}

export function Settings({ settings, onClose, onSaved }: Props) {
  // The manifest is the one place the version is written, so About cannot drift from it.
  const version = chrome.runtime.getManifest().version;
  const [changingPlace, setChangingPlace] = useState(false);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const browser = browserName();
  const locale = localeTag();
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

  /**
   * A language is applied before it is saved, so the sheet the user is looking at answers
   * in the language they just picked. The saved value is what the next screen starts with.
   */
  function languageLabel(choice: LanguageChoice): string {
    return choice === 'auto' ? t('common.computerLanguage') : LANGUAGE_NAMES[choice];
  }

  function changeLanguage(choice: LanguageChoice) {
    applyLanguage(choice);
    update({ language: choice });
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
        setError(t('common.saveError'));
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
  // The Place row is only the name, so it stays bare. The method sheet puts the country
  // inside a sentence, so it takes "the" where English wants it (D-039, meta.ts).
  const countryText =
    settings.place.countryCode === 'ZZ'
      ? t('settings.yourCountry')
      : countryName(settings.place.countryCode, locale);
  const placeValue = settings.place.countryCode === 'ZZ' ? t('settings.fromThisComputer') : countryText;
  const offset = settings.hijriOffsetDays;
  const hijriValue =
    offset === 0
      ? t('settings.noChange')
      : Math.abs(offset) === 1
        ? offset > 0
          ? t('settings.oneDayLater')
          : t('settings.oneDayEarlier')
        : offset > 0
          ? t('settings.daysLater', { count: Math.abs(offset) })
          : t('settings.daysEarlier', { count: Math.abs(offset) });
  const soundValue = soundLabel(settings.alerts.sound);
  const reminderValue = settings.alerts.reminder.enabled
    ? t('settings.minutesBefore', { count: settings.alerts.reminder.minutes })
    : t('common.off');
  const suhoorValue = settings.suhoorReminder.enabled
    ? t('settings.minutesBeforeFajr', { count: settings.suhoorReminder.minutes })
    : t('common.off');

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
  const methodGroups = methodGroupsFor(
    settings.sect,
    suggestion.suggested,
    suggestion.alternatives,
    offeredMethods,
    countryText,
  );

  if (sheet) {
    return renderSheet();
  }

  return (
    <main class="settings">
      <header class="settings-head">
        <button class="icon-button back-button" type="button" aria-label={t('settings.backToTimes')} onClick={onClose}>
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
          {t('common.settings')}
        </h1>
      </header>

      {error ? (
        <p class="error" role="alert">
          {error}
        </p>
      ) : null}

      <div class="settings-scroll">
        <Group title={t('settings.disclaimer')} id="disclaimer-heading" rows={1}>
          <Row
            icon={<InfoIcon />}
            title={t('settings.disclaimer')}
            value={t('settings.disclaimerHint')}
            rowId="disclaimer"
            onClick={() => openSheet('disclaimer')}
          />
        </Group>

        <Group title={t('settings.place')} id="place-heading" rows={1}>
          <Row
            icon={<PinIcon />}
            title={settings.place.name}
            value={placeValue}
            rowId="place"
            onClick={() => setChangingPlace(true)}
          />
        </Group>

        <Group title={t('settings.prayerTimes')} id="prayer-times-heading" rows={shiaMethod ? 3 : 4}>
          <Row
            icon={<SchoolIcon />}
            title={t('firstRun.schoolTitle')}
            value={settings.sect === 'sunni' ? t('school.sunni') : t('school.shia')}
            rowId="school"
            onClick={() => openSheet('school')}
          />
          {!shiaMethod ? (
            <Row
              icon={<ClockIcon />}
              title={t('firstRun.madhabTitle')}
              value={settings.madhab === 'shafii' ? t('madhab.shafii') : t('madhab.hanafi')}
              rowId="asr"
              onClick={() => openSheet('asr')}
            />
          ) : null}
          <Row
            icon={<TuneIcon />}
            title={t('firstRun.methodTitle')}
            value={methodName(settings.method)}
            rowId="method"
            onClick={() => openSheet('method')}
          />
          <Row
            icon={<CalendarIcon />}
            title={t('settings.hijriDate')}
            value={hijriValue}
            rowId="hijri"
            onClick={() => openSheet('hijri')}
          />
        </Group>

        {showRamadan ? (
          <Group title={t('hijri.9')} id="ramadan-heading" rows={2}>
            <div class="switch-row">
              <div class="switch-copy">
                <p class="switch-title">{t('settings.ramadanCard')}</p>
              </div>
              <Switch
                label={t('settings.ramadanCard')}
                checked={settings.ramadanCard}
                disabled={busy}
                onToggle={() => update({ ramadanCard: !settings.ramadanCard })}
              />
            </div>
            <Row
              icon={<NoteIcon />}
              title={t('settings.suhoorReminder')}
              value={suhoorValue}
              rowId="suhoor"
              onClick={() => openSheet('suhoor')}
            />
          </Group>
        ) : null}

        <Group title={t('firstRun.alertsTitle')} id="alerts-heading" rows={settings.alerts.enabled ? 8 : 1}>

          {blocked ? (
            <Notice
              tone="warning"
              title={t('settings.alertsBlocked')}
              line={t('settings.blockedLine', { browser })}
              mark={<WarningMark />}
            />
          ) : null}

          <div class="switch-row">
            <div class="switch-copy">
              <p class="switch-title">{t('settings.prayerAlerts')}</p>
              <p class="switch-hint">{t('settings.alertsNote')}</p>
            </div>
            <Switch
              label={t('settings.prayerAlerts')}
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
                    <p class="switch-title">{prayerName(prayer)}</p>
                  </div>
                  <Switch
                    label={prayerName(prayer)}
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
                icon={<ClockIcon />}
                title={t('settings.reminder')}
                value={reminderValue}
                rowId="reminder"
                onClick={() => openSheet('reminder')}
              />

              <Row
                icon={<NoteIcon />}
                title="Sound"
                value={soundValue}
                rowId="sound"
                onClick={() => openSheet('sound')}
              />

              <button class="action action-small" type="button" aria-disabled={busy} onClick={sendTestAlert}>
                {t('settings.testAlert')}
              </button>
              <p class="field-hint">
                {t('settings.testNote')}
              </p>

              <Notice
                tone="quiet"
                title={t('notice.offlineTitle', { browser })}
                line={t('notice.offlineLine', { browser })}
                mark={<CheckMark />}
              />
            </>
          ) : null}
        </Group>

        <Group title={t('settings.appearance')} id="appearance-heading" rows={2}>
          <Row
            icon={<ContrastIcon />}
            title={t('settings.theme')}
            value={THEME_LABELS[settings.theme]}
            rowId="theme"
            onClick={() => openSheet('theme')}
          />
          <Row
            icon={<GlobeIcon />}
            title={t('settings.language')}
            value={languageLabel(settings.language)}
            rowId="language"
            onClick={() => openSheet('language')}
          />
        </Group>

        <Group title={t('settings.about')} id="about-heading" rows={3}>
          <Row
            icon={<LockIcon />}
            title={t('settings.privacy')}
            rowId="privacy"
            onClick={() => {
              window.open('https://aliimrankhan86.github.io/sajdatime-extension/privacy.html', '_blank', 'noopener,noreferrer');
            }}
          />
          <Row
            icon={<PersonIcon />}
            title={t('settings.credits')}
            value={t('settings.creditsEngines')}
            rowId="credits"
            onClick={() => openSheet('credits')}
          />
          <Row
            icon={<PhoneIcon />}
            title={t('settings.version')}
            value={t('settings.versionLine', { version })}
            chevron={false}
          />
        </Group>
      </div>
    </main>
  );

  function renderSheet() {
    switch (sheet) {
      case 'disclaimer':
        return (
          <Sheet title={t('settings.disclaimer')} onClose={() => closeSheet('disclaimer')}>
            <div class="sheet-body">
              <p class="disclaimer-text">{shortDisclaimer()}</p>
            </div>
          </Sheet>
        );

      case 'school':
        return (
          <Sheet title={t('firstRun.schoolTitle')} onClose={() => closeSheet('school')}>
            <div class="sheet-body">
              <Segmented
                options={[
                  { value: 'sunni', label: t('school.sunni') },
                  { value: 'shia', label: t('school.shia') },
                ]}
                value={settings.sect}
                onChange={changeSect}
                disabled={busy}
                labelledBy="sheet-title"
              />
              <p class="field-hint">{t('settings.methodNote')}</p>
            </div>
          </Sheet>
        );

      case 'asr':
        return (
          <Sheet title={t('firstRun.madhabTitle')} onClose={() => closeSheet('asr')}>
            <div class="sheet-body">
              <Segmented
                options={[
                  { value: 'shafii', label: t('madhab.shafii') },
                  { value: 'hanafi', label: t('madhab.hanafi') },
                ]}
                value={settings.madhab}
                onChange={(madhab) => update({ madhab })}
                disabled={busy}
                labelledBy="sheet-title"
              />
              <p class="field-hint">{t('settings.madhabNote')}</p>
            </div>
          </Sheet>
        );

      case 'method':
        return (
          <Sheet title={t('firstRun.methodTitle')} onClose={() => closeSheet('method')} noFoot>
            <div class="sheet-body method-body">
              <p class="field-hint">{t('settings.methodHintTimes', { place: settings.place.name })}</p>
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
                              <span class="method-name">{methodName(method)}</span>
                              <span class="method-hint">{methodHint(method)}</span>
                              {times ? (
                                <span class="method-times">
                                  <span class="method-time">
                                    <bdi>
                                      {t('slot.fajr')} {times.fajr}
                                    </bdi>
                                  </span>
                                  <span class="method-time">
                                    <bdi>
                                      {t('slot.isha')} {times.isha}
                                    </bdi>
                                  </span>
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
          <Sheet title={t('settings.hijriDate')} onClose={() => closeSheet('hijri')}>
            <div class="sheet-body">
              <div class="stepper">
                <button
                  class="step-button"
                  type="button"
                  aria-label={t('settings.oneDayEarlier')}
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
                  aria-label={t('settings.oneDayLater')}
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
          <Sheet
            title="Sound"
            onClose={() => closeSheet('sound')}
            action={
              settings.alerts.sound !== 'silent' ? (
                <button class="compact-button" type="button" aria-disabled={busy} onClick={togglePlay}>
                  {playing ? t('common.stop') : t('common.play')}
                </button>
              ) : null
            }
          >
            <div class="sheet-body">
              <div class="choices" role="group" aria-labelledby="sheet-title">
                <ChoiceRow
                  selected={settings.alerts.sound === 'beep'}
                  title={soundLabel('beep')}
                  hint={soundHint('beep')}
                  disabled={busy}
                  onSelect={() => update({ alerts: { ...settings.alerts, sound: 'beep' } })}
                />
                <ChoiceRow
                  selected={settings.alerts.sound === 'adhan'}
                  title={soundLabel('adhan')}
                  hint={soundHint('adhan')}
                  disabled={busy}
                  onSelect={() => update({ alerts: { ...settings.alerts, sound: 'adhan' } })}
                />
                <ChoiceRow
                  selected={settings.alerts.sound === 'silent'}
                  title={soundLabel('silent')}
                  hint={soundHint('silent')}
                  disabled={busy}
                  onSelect={() => update({ alerts: { ...settings.alerts, sound: 'silent' } })}
                />
              </div>
            </div>
          </Sheet>
        );

      case 'reminder':
        return (
          <Sheet title={t('settings.reminder')} onClose={() => closeSheet('reminder')}>
            <div class="sheet-body">
              <div class="choices" role="group" aria-labelledby="sheet-title">
                <ChoiceRow
                  selected={!settings.alerts.reminder.enabled}
                  title={t('common.off')}
                  disabled={busy}
                  onSelect={() =>
                    update({
                      alerts: {
                        ...settings.alerts,
                        reminder: { ...settings.alerts.reminder, enabled: false },
                      },
                    })
                  }
                />
                {REMINDER_MINUTES.map((minutes) => (
                  <ChoiceRow
                    key={minutes}
                    selected={settings.alerts.reminder.enabled && settings.alerts.reminder.minutes === minutes}
                    title={t('settings.minutesBefore', { count: minutes })}
                    disabled={busy}
                    onSelect={() =>
                      update({
                        alerts: { ...settings.alerts, reminder: { enabled: true, minutes } },
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </Sheet>
        );

      case 'suhoor':
        return (
          <Sheet title={t('settings.suhoorReminder')} onClose={() => closeSheet('suhoor')}>
            <div class="sheet-body">
              <div class="choices" role="group" aria-labelledby="sheet-title">
                <ChoiceRow
                  selected={!settings.suhoorReminder.enabled}
                  title={t('common.off')}
                  disabled={busy}
                  onSelect={() => update({ suhoorReminder: { ...settings.suhoorReminder, enabled: false } })}
                />
                {SUHOOR_MINUTES.map((minutes) => (
                  <ChoiceRow
                    key={minutes}
                    selected={settings.suhoorReminder.enabled && settings.suhoorReminder.minutes === minutes}
                    title={t('settings.minutesBeforeFajr', { count: minutes })}
                    disabled={busy}
                    onSelect={() => update({ suhoorReminder: { enabled: true, minutes } })}
                  />
                ))}
              </div>
            </div>
          </Sheet>
        );

      case 'theme':
        return (
          <Sheet title={t('settings.theme')} onClose={() => closeSheet('theme')}>
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

      case 'language':
        return (
          <Sheet title={t('settings.language')} onClose={() => closeSheet('language')}>
            <div class="sheet-body">
              <div class="choices is-inline" role="radiogroup" aria-labelledby="sheet-title">
                {LANGUAGE_CHOICES.map((choice) => (
                  <ChoiceRow
                    key={choice}
                    selected={settings.language === choice}
                    title={languageLabel(choice)}
                    // English needs no second English line, and Computer language is not a language.
                    hint={choice === 'auto' || choice === 'en' ? undefined : LANGUAGE_NAMES_EN[choice]}
                    disabled={busy}
                    onSelect={() => changeLanguage(choice)}
                  />
                ))}
              </div>
            </div>
          </Sheet>
        );

      case 'credits':
        return (
          <Sheet title={t('settings.credits')} onClose={() => closeSheet('credits')}>
            <div class="sheet-body">
              <p class="credit-line">
                <a class="link" href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">
                  {t('settings.creditCity')}
                </a>
              </p>
              <p class="credit-line">{t('settings.creditAdhan')}</p>
              <p class="credit-line">{t('settings.creditRecording')}</p>
              <p class="credit-line">{t('settings.creditShia')}</p>
              <p class="credit-line">{t('settings.creditCommons')}</p>
            </div>
          </Sheet>
        );

      default:
        return null;
    }
  }
}
