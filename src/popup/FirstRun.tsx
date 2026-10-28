import { useEffect, useRef, useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { clockFormatter } from '../core/clock';
import { computeDay, dateInZone } from '../core/engine';
import { matchLabel, matchMethods } from '../core/match';
import { methodsOfferedTo } from '../core/methods';
import { parseAlertMessage, soundMessageType } from '../core/messages';
import { suggestMethod } from '../core/suggestions';
import type { Madhab, MethodId, Sect } from '../core/types';
import { firstSettings } from '../settings/create';
import { MAKKAH, placeFromCity, placeFromGeolocation } from '../settings/place';
import { clearSetupDraft, loadSetupDraft, saveSetupDraft } from '../settings/setup';
import { saveSettings } from '../settings/storage';
import type { AlertSound, Place, Settings } from '../settings/types';
import { Brand } from './Brand';
import { CitySearch } from './CitySearch';
import { ChoiceRow } from './components/ChoiceRow';
import { Notice } from './components/Notice';
import { fullDisclaimer, shortDisclaimer } from './disclaimer';
import { CheckMark, GlobeIcon, PlayIcon } from './icons';
import {
  applyLanguage,
  LANGUAGE_CHOICES,
  LANGUAGE_NAMES,
  localeTag,
  resolveChoice,
  t,
  type LanguageChoice,
} from '../i18n';
import {
  browserName,
  countryInSentence,
  methodGroupsFor,
  methodHint,
  methodName,
  soundHint,
  soundLabel,
} from './meta';

const MADHABS: Array<{ value: Madhab; title: string; hint: string }> = [
  { value: 'hanafi', title: t('madhab.hanafi'), hint: t('madhab.hanafiHint') },
  {
    value: 'shafii',
    title: "Shafi'i, Maliki or Hanbali",
    hint: t('madhab.shafiiHint'),
  },
];

const SOUNDS: ReadonlyArray<AlertSound> = ['beep', 'adhan', 'silent'];

/** The sunni step positions are 1..6; Shia skips the madhab step, so 1,2,4,5,6. */
function stepPosition(step: number, sect: Sect): number {
  if (step <= 2) return step;
  if (step === 3) return sect === 'sunni' ? 3 : 0;
  if (step === 4) return sect === 'sunni' ? 4 : 3;
  if (step === 5) return sect === 'sunni' ? 5 : 4;
  return sect === 'sunni' ? 6 : 5;
}

function stepTotal(sect: Sect): number {
  return sect === 'sunni' ? 6 : 5;
}

function stepLabel(step: number, sect: Sect): string | null {
  if (step === 0) return null;
  return `Step ${stepPosition(step, sect)} of ${stepTotal(sect)}`;
}

/** The step after this one, or null when the flow is done. */
function nextStep(step: number, sect: Sect): number | null {
  if (step === 0) return 1;
  if (step === 1) return 2;
  if (step === 2) return sect === 'sunni' ? 3 : 4;
  if (step === 3) return 4;
  if (step === 4) return 5;
  if (step === 5) return 6;
  return null;
}

function backStep(step: number, sect: Sect): number {
  if (step <= 1) return 0;
  if (step === 2) return 1;
  if (step === 3) return 2;
  if (step === 4) return sect === 'sunni' ? 3 : 2;
  return 5;
}

/** An <input type="time"> always yields HH:MM in 24 hours, whatever the display style. */
function minutesFromTimeInput(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function StepProgress({ step, sect }: { step: number; sect: Sect }) {
  const label = stepLabel(step, sect);
  if (!label) return null;
  const total = stepTotal(sect);
  const position = stepPosition(step, sect);
  return (
    <div class="first-run-progress">
      <p class="step-line">{label}</p>
      <div class="progress" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span class={index < position ? 'progress-part is-done' : 'progress-part'} key={index} />
        ))}
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  title,
  hint,
  onSelect,
}: {
  selected: boolean;
  title: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <button
      class={selected ? 'choice-card is-selected' : 'choice-card'}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span class="choice-card-copy">
        <span class="choice-card-title">{title}</span>
        {hint ? <span class="choice-card-hint">{hint}</span> : null}
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
}

function BackArrow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button class="icon-button back-button" type="button" aria-label={label} onClick={onClick}>
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
  );
}

export function FirstRun({ onSaved }: { onSaved: (settings: Settings) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Settings>(() => firstSettings(MAKKAH));
  const [madhabChosen, setMadhabChosen] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<null | 'language' | 'full' | 'methods' | 'match'>(null);
  const [found, setFound] = useState<Place | null>(null);
  const [matchInput, setMatchInput] = useState('');
  const [matchChosen, setMatchChosen] = useState<MethodId | null>(null);
  const [playing, setPlaying] = useState(false);
  const main = useRef<HTMLDivElement>(null);

  // The globe in the welcome corner names the language in use, which is the computer's
  // until the user picks one by name.
  const languageName = LANGUAGE_NAMES[resolveChoice(draft.language)];

  const browser = browserName();
  const locale = localeTag();
  const clock = clockFormatter(draft.place.timeZone, locale);
  const today = dateInZone(new Date(), draft.place.timeZone);
  const suggestion = suggestMethod(draft.place.countryCode, draft.sect);
  const offered = methodsOfferedTo(draft.sect);
  // A country inside a sentence takes "the" where English wants it (D-039). A bare line
  // that is only the name, such as the location confirmation, does not.
  const countryText =
    draft.place.countryCode === 'ZZ'
      ? 'your country'
      : countryName(draft.place.countryCode, locale);
  const placeValue = countryInSentence(countryText);
  const methodGroups = methodGroupsFor(
    draft.sect,
    suggestion.suggested,
    suggestion.alternatives,
    offered,
    placeValue,
  );

  // Restore a saved draft once, so a closed popup resumes at the same step.
  useEffect(() => {
    let alive = true;
    loadSetupDraft().then((saved) => {
      if (!alive) return;
      if (saved) {
        setStep(saved.step);
        setDraft(saved.settings);
        setMadhabChosen(saved.madhabChosen);
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // PLAN 6.3: progress is saved after each step, so closing mid way resumes at that step.
  useEffect(() => {
    if (!ready) return;
    void saveSetupDraft({ step, settings: draft, madhabChosen }).catch(() => undefined);
  }, [ready, step, draft, madhabChosen]);

  // The sound sheet's Play tells us when it has finished.
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

  // Move focus to the step or sub-screen heading whenever it changes.
  useEffect(() => {
    if (!ready) return;
    const target = main.current?.querySelector<HTMLElement>('[data-autofocus]');
    target?.focus();
  }, [ready, step, sub, found]);

  function todayFor(method: MethodId): { fajr: string; isha: string } | null {
    try {
      const day = computeDay(draft.place, today, {
        method,
        madhab: draft.madhab,
        timeZone: draft.place.timeZone,
        hijriOffsetDays: draft.hijriOffsetDays,
      });
      return { fajr: clock.format(day.times.fajr), isha: clock.format(day.times.isha) };
    } catch {
      return null;
    }
  }

  function setDraftValue(patch: Partial<Settings>) {
    setDraft((current) => ({ ...current, ...patch, version: 1 }));
  }

  function chooseSect(sect: Sect) {
    setDraft((current) => ({
      ...current,
      sect,
      method: suggestMethod(current.place.countryCode, sect).suggested,
      madhab: 'shafii',
    }));
    setMadhabChosen(false);
  }

  function chooseMadhab(madhab: Madhab) {
    setDraftValue({ madhab });
    setMadhabChosen(true);
  }

  function choosePlace(place: Place) {
    setDraft((current) => ({
      ...current,
      place,
      method: suggestMethod(place.countryCode, current.sect).suggested,
    }));
    setFound(place);
  }

  function chooseMethod(method: MethodId) {
    setDraftValue({ method });
  }

  function chooseSound(sound: AlertSound) {
    setDraft((current) => ({ ...current, alerts: { ...current.alerts, sound } }));
  }

  function continueTo() {
    setError(null);
    const next = nextStep(step, draft.sect);
    if (next === null) {
      finish();
      return;
    }
    setStep(next);
  }

  function goBack() {
    setError(null);
    setSub(null);
    setStep(backStep(step, draft.sect));
  }

  function closeSub() {
    setSub(null);
  }

  function finish() {
    setBusy(true);
    setError(null);
    saveSettings(draft)
      .then(() => clearSetupDraft())
      .then(() => {
        setBusy(false);
        onSaved(draft);
      })
      .catch(() => {
        setBusy(false);
        setError(t('common.saveError'));
      });
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError(t('firstRun.noLocation'));
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        placeFromGeolocation(
          position.coords.latitude,
          position.coords.longitude,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        ).then((place) => {
          setBusy(false);
          choosePlace(place);
        });
      },
      () => {
        setBusy(false);
        setError(t('firstRun.locationDenied'));
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  }

  function useMakkah() {
    setError(null);
    choosePlace(MAKKAH);
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      void chrome.runtime.sendMessage({ type: 'stop' });
      return;
    }
    const type = soundMessageType(draft.alerts.sound, draft.sect);
    if (!type) return;
    setPlaying(true);
    void chrome.runtime.sendMessage({ type });
  }

  function openMatch() {
    setMatchInput('');
    setMatchChosen(null);
    setSub('match');
  }

  function useMatchedMethod(method: MethodId) {
    chooseMethod(method);
    setSub(null);
  }

  if (!ready) {
    return (
      <main class="welcome" aria-busy="true">
        <p class="welcome-note">{t('app.loading')}</p>
      </main>
    );
  }

  let body;
  if (sub === 'language') body = renderLanguage();
  else if (sub === 'full') body = renderFullDisclaimer();
  else if (sub === 'methods') body = renderOtherMethods();
  else if (sub === 'match') body = renderMatch();
  else body = renderStep();

  return (
    <main class="first-run" ref={main}>
      {body}
    </main>
  );

  function renderStep() {
    if (step === 0) {
      return (
        <div class="first-run-welcome">
          <header class="first-run-welcome-head">
            <button class="language-button" type="button" onClick={() => setSub('language')}>
              <GlobeIcon size={18} />
              <span>{languageName}</span>
            </button>
          </header>
          <div class="first-run-welcome-body">
            <Brand />
            <h1 class="welcome-title" data-autofocus tabIndex={-1}>
              {t('firstRun.welcome')}
            </h1>
            <p class="welcome-lead">{t('firstRun.note')}</p>
          </div>
          <div class="first-run-welcome-foot">
            <button class="action first-run-primary" type="button" onClick={continueTo}>
              {t('common.begin')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div class="first-run-step">
        <StepProgress step={step} sect={draft.sect} />
        {error ? (
          <p class="error" role="alert">
            {error}
          </p>
        ) : null}
        <div class="first-run-body">{renderStepBody()}</div>
        {step >= 2 ? (
          <div class="first-run-foot">
            <button class="action" type="button" onClick={goBack} disabled={busy}>
              {t('common.back')}
            </button>
            <button
              class="action"
              type="button"
              onClick={continueTo}
              disabled={busy || (step === 3 && !madhabChosen) || (step === 4 && !found)}
            >
              {step === 6 ? t('common.finish') : t('common.continue')}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderStepBody() {
    if (step === 1) {
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            {t('firstRun.before')}
          </h1>
          <p class="disclaimer-text">{shortDisclaimer()}</p>
          <div class="first-run-actions">
            <button class="action first-run-primary" type="button" onClick={continueTo}>
              {t('firstRun.understand')}
            </button>
            <button class="action" type="button" onClick={() => setSub('full')}>
              {t('common.readInFull')}
            </button>
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            {t('firstRun.schoolQuestion')}
          </h1>
          <p class="field-hint">
            {t('firstRun.schoolNote')}
          </p>
          <div class="choice-cards">
            <ChoiceCard
              selected={draft.sect === 'sunni'}
              title={t('school.sunni')}
              onSelect={() => chooseSect('sunni')}
            />
            <ChoiceCard
              selected={draft.sect === 'shia'}
              title={t('school.shia')}
              onSelect={() => chooseSect('shia')}
            />
          </div>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            {t('firstRun.madhabQuestion')}
          </h1>
          <p class="field-hint">{t('firstRun.madhabNote')}</p>
          <div class="choice-cards">
            {MADHABS.map((madhab) => (
              <ChoiceCard
                key={madhab.value}
                selected={madhabChosen && draft.madhab === madhab.value}
                title={madhab.title}
                hint={madhab.hint}
                onSelect={() => chooseMadhab(madhab.value)}
              />
            ))}
          </div>
        </>
      );
    }

    if (step === 4) {
      if (found) {
        return (
          <section class="location-found" role="status">
            <h1 class="first-run-title" data-autofocus tabIndex={-1}>
              {t('firstRun.locationQuestion')}
            </h1>
            <div class="first-run-place">
              <CheckMark size={32} />
              <p class="first-run-place-name">{found.name}</p>
              <p class="first-run-place-meta">
                {found.countryCode === 'ZZ'
                  ? t('settings.fromThisComputer')
                  : countryName(found.countryCode, locale)}
              </p>
            </div>
            <p class="field-hint">{t('firstRun.willBeFor')}</p>
          </section>
        );
      }
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            {t('firstRun.locationQuestion')}
          </h1>
          <p class="field-hint">
            {t('firstRun.locationNote')}
          </p>
          <button class="action first-run-primary" type="button" onClick={useMyLocation} disabled={busy}>
            {busy ? t('firstRun.finding') : t('firstRun.allowLocation')}
          </button>
          <p class="field-hint">
            {browser === 'Chrome'
              ? t('firstRun.chromeNote')
              : t('firstRun.edgeNote')}
          </p>
          <CitySearch
            label={t('firstRun.orTypePlace')}
            onPick={(city) => choosePlace(placeFromCity(city))}
            disabled={busy}
          />
          <div class="first-run-skip">
            <button class="action" type="button" onClick={useMakkah} disabled={busy}>
              {t('firstRun.skip')}
            </button>
            <p class="field-hint">{t('firstRun.defaultMakkah')}</p>
          </div>
        </>
      );
    }

    if (step === 5) {
      return renderMethodStep();
    }

    return (
      <>
        <h1 class="first-run-title" data-autofocus tabIndex={-1}>
          {t('settings.prayerAlerts')}
        </h1>
        <p class="field-hint">{t('firstRun.alertsNote')}</p>
        <div class="first-run-sound-row">
          <span class="field-label">{t('settings.sound')}</span>
          <button
            class="action action-small"
            type="button"
            aria-disabled={draft.alerts.sound === 'silent'}
            onClick={togglePlay}
          >
            <PlayIcon size={16} />
            <span>{playing ? t('common.stop') : t('common.play')}</span>
          </button>
        </div>
        <div class="choices" role="group" aria-label={t('settings.sound')}>
          {SOUNDS.map((sound) => (
            <ChoiceRow
              key={sound}
              selected={draft.alerts.sound === sound}
              title={soundLabel(sound)}
              hint={soundHint(sound)}
              disabled={busy}
              onSelect={() => chooseSound(sound)}
            />
          ))}
        </div>
        <Notice
          tone="quiet"
          title={t('notice.offlineTitle', { browser })}
          line={t('notice.offlineLine', { browser })}
          mark={<CheckMark />}
        />
      </>
    );
  }

  /**
   * The full method list opens from a select, not from a second solid action: the
   * screen already has one action (Match my mosque), and a field beside it reads as
   * "the list of methods" rather than as a competing choice. The count is spoken in
   * the label so a screen reader knows how many options the list holds.
   */
  function renderMethodChooser() {
    return (
      <button
        class="method-chooser"
        type="button"
        aria-label={`${t('method.chooseAnother')}, ${t('method.count', { n: offered.length })}`}
        onClick={() => setSub('methods')}
      >
        <span class="method-chooser-label">{t('method.chooseAnother')}</span>
        <svg
          class="method-chooser-chevron"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    );
  }

  function renderMethodStep() {
    const isSingle = suggestion.alternatives.length === 0;
    if (isSingle) {
      const times = todayFor(draft.method);
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            {t('firstRun.methodTitle')}
          </h1>
          <div class="method-row is-selected first-run-method-card">
            <span class="method-copy">
              <span class="method-name">{methodName(draft.method)}</span>
              <span class="method-hint">
                {t('method.suggestedFor', { country: placeValue })}
              </span>
              {times ? (
                <span class="method-times method-times-large">
                  <span class="method-time">Fajr {times.fajr}</span>
                  <span class="method-time">Isha {times.isha}</span>
                </span>
              ) : null}
            </span>
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
          </div>
          <div class="first-run-method-actions">
            <button class="action" type="button" onClick={openMatch}>
              {t('firstRun.matchTitle')}
            </button>
            {renderMethodChooser()}
          </div>
        </>
      );
    }

    const methods = [suggestion.suggested, ...suggestion.alternatives].filter((method) =>
      offered.includes(method),
    );
    return (
      <>
        <h1 class="first-run-title" data-autofocus tabIndex={-1}>
          {t('firstRun.methodTitle')}
        </h1>
        <p class="field-hint">{t('firstRun.methodNote', { place: placeValue })}</p>
        <div class="choices" role="radiogroup" aria-label={t('firstRun.methodTitle')}>
          {methods.map((method, index) => {
            const times = todayFor(method);
            const selected = method === draft.method;
            return (
              <button
                class={selected ? 'first-run-method-row is-selected' : 'first-run-method-row'}
                type="button"
                role="radio"
                aria-checked={selected}
                key={method}
                onClick={() => chooseMethod(method)}
              >
                <span class="method-copy">
                  <span class="method-name">{methodName(method)}</span>
                  {index === 0 ? (
                    <span class="method-hint">
                      {t('method.suggestedFor', { country: placeValue })}
                    </span>
                  ) : null}
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
        <div class="first-run-method-actions">
          <button class="action" type="button" onClick={openMatch}>
            {t('firstRun.matchTitle')}
          </button>
          {renderMethodChooser()}
        </div>
      </>
    );
  }

  function renderOtherMethods() {
    return (
      <div class="first-run-sheet">
        <header class="first-run-sheet-head">
          <BackArrow label={t('common.back')} onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            {t('method.all')}
          </h1>
        </header>
        <div class="first-run-sheet-body method-body">
          <p class="field-hint">
            {t('settings.methodHintTimes', { place: draft.place.name })}
          </p>
          {methodGroups.map((group) => (
            <div class="method-group" key={group.title}>
              <h3 class="method-group-title">{group.title}</h3>
              <div class="method-list" role="group" aria-label={group.title}>
                {group.methods.map((method) => {
                  const times = todayFor(method);
                  const selected = method === draft.method;
                  return (
                    <button
                      class={selected ? 'method-row is-selected' : 'method-row'}
                      type="button"
                      aria-pressed={selected}
                      key={method}
                      onClick={() => {
                        chooseMethod(method);
                        setSub(null);
                      }}
                    >
                      <span class="method-copy">
                        <span class="method-name">{methodName(method)}</span>
                        <span class="method-hint">{methodHint(method)}</span>
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
      </div>
    );
  }

  function renderMatch() {
    const target = minutesFromTimeInput(matchInput);
    const results =
      target === null
        ? []
        : matchMethods(
            draft.place,
            draft.place.timeZone,
            draft.sect,
            draft.madhab,
            draft.hijriOffsetDays,
            target,
            new Date(),
          ).slice(0, 2);
    const closest = results[0] ?? null;
    const farAway = closest !== null && Math.abs(closest.diffMinutes) > 15;
    const selectedMatch = matchChosen ?? closest?.method ?? null;

    return (
      <div class="first-run-sheet">
        <header class="first-run-sheet-head">
          <BackArrow label={t('common.back')} onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            {t('firstRun.matchTitle')}
          </h1>
        </header>
        <div class="first-run-sheet-body">
          <p class="field-hint">{t('firstRun.matchNote')}</p>
          <p class="field-hint">{t('firstRun.matchStart')}</p>
          <label class="field-label" for="match-fajr-time">
            {t('firstRun.matchTime')}
          </label>
          <input
            class="search-input"
            id="match-fajr-time"
            type="time"
            value={matchInput}
            onInput={(event) => setMatchInput(event.currentTarget.value)}
          />

          {results.length > 0 ? (
            <>
              <div class="choices" role="radiogroup" aria-label={t('method.closest')}>
                {results.map((entry) => {
                  const selected = entry.method === selectedMatch;
                  return (
                    <button
                      class={selected ? 'first-run-method-row is-selected' : 'first-run-method-row'}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={entry.method}
                      onClick={() => setMatchChosen(entry.method)}
                    >
                      <span class="method-copy">
                        <span class="method-name">{methodName(entry.method)}</span>
                        <span class="method-times">
                          <span class="method-time">
                            <bdi>
                              {t('slot.fajr')} {clock.format(entry.fajr)}
                            </bdi>
                          </span>
                          <span class="method-time">{matchLabel(entry.diffMinutes)}</span>
                        </span>
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

              {farAway ? (
                <p class="field-hint" role="note">
                  {t('firstRun.farAway')}
                </p>
              ) : null}

              {selectedMatch ? (
                <button
                  class="action first-run-primary"
                  type="button"
                  onClick={() => useMatchedMethod(selectedMatch)}
                >
                  Use {methodName(selectedMatch)}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    );
  }

  function renderFullDisclaimer() {
    return (
      <div class="first-run-sheet">
        <header class="first-run-sheet-head">
          <BackArrow label={t('common.back')} onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            {t('settings.disclaimer')}
          </h1>
        </header>
        <div class="first-run-sheet-body">
          <div class="disclaimer-full">
            {fullDisclaimer().map((paragraph, index) => (
              <p class="disclaimer-text" key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Picking a language at once, because the sheet behind it is showing this screen's
   * words. The choice is kept in the draft and saved with the rest at the end.
   */
  function chooseLanguage(choice: LanguageChoice) {
    setDraft((value) => ({ ...value, language: choice }));
    applyLanguage(choice);
  }

  function renderLanguage() {
    return (
      <div class="first-run-sheet">
        <header class="first-run-sheet-head">
          <BackArrow label={t('common.back')} onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            {t('common.language')}
          </h1>
        </header>
        <div class="first-run-sheet-body">
          <div class="choices" role="radiogroup" aria-label={t('common.language')}>
            {LANGUAGE_CHOICES.map((choice) => (
              <ChoiceRow
                key={choice}
                selected={draft.language === choice}
                title={choice === 'auto' ? t('common.computerLanguage') : LANGUAGE_NAMES[choice]}
                disabled={false}
                onSelect={() => chooseLanguage(choice)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
