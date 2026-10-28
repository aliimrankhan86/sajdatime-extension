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
import { FULL_DISCLAIMER, SHORT_DISCLAIMER } from './disclaimer';
import { CheckMark, GlobeIcon, PlayIcon } from './icons';
import {
  browserName,
  countryInSentence,
  METHOD_HINTS,
  METHOD_NAMES,
  methodGroupsFor,
  SOUND_HINTS,
  SOUND_LABELS,
} from './meta';

const MADHABS: Array<{ value: Madhab; title: string; hint: string }> = [
  { value: 'hanafi', title: 'Hanafi', hint: 'Asr begins when a shadow is twice its height.' },
  {
    value: 'shafii',
    title: "Shafi'i, Maliki or Hanbali",
    hint: 'Asr begins when a shadow equals its height.',
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
  const [language, setLanguage] = useState<'system' | 'english'>('system');
  const [playing, setPlaying] = useState(false);
  const main = useRef<HTMLDivElement>(null);

  const browser = browserName();
  const locale = navigator.language || 'en-GB';
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
        setError('Your settings could not be saved. Try again.');
      });
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('This browser cannot read your location. Find a place below instead.');
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
        setError('We could not read your location. Allow location for this browser, then try again, or type a place below.');
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
        <p class="welcome-note">Loading SajdaTime...</p>
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
              <span>English</span>
            </button>
          </header>
          <div class="first-run-welcome-body">
            <Brand />
            <h1 class="welcome-title" data-autofocus tabIndex={-1}>
              Prayer times and a gentle alert, right here on your computer.
            </h1>
            <p class="welcome-lead">Free, with no ads and no account. Your times are worked out on this computer.</p>
          </div>
          <div class="first-run-welcome-foot">
            <button class="action first-run-primary" type="button" onClick={continueTo}>
              Begin
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
              Back
            </button>
            <button
              class="action"
              type="button"
              onClick={continueTo}
              disabled={busy || (step === 3 && !madhabChosen) || (step === 4 && !found)}
            >
              {step === 6 ? 'Finish' : 'Continue'}
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
            Before you begin
          </h1>
          <p class="disclaimer-text">{SHORT_DISCLAIMER}</p>
          <div class="first-run-actions">
            <button class="action first-run-primary" type="button" onClick={continueTo}>
              I understand
            </button>
            <button class="action" type="button" onClick={() => setSub('full')}>
              Read in full
            </button>
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            Which school do you follow?
          </h1>
          <p class="field-hint">
            This picks the calculation method for you. You can change it later in Settings.
          </p>
          <div class="choice-cards">
            <ChoiceCard
              selected={draft.sect === 'sunni'}
              title="Sunni"
              onSelect={() => chooseSect('sunni')}
            />
            <ChoiceCard
              selected={draft.sect === 'shia'}
              title="Shia"
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
            Which madhab do you follow?
          </h1>
          <p class="field-hint">It only changes when Asr begins. Every other time stays the same.</p>
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
              Where are you?
            </h1>
            <div class="first-run-place">
              <CheckMark size={32} />
              <p class="first-run-place-name">{found.name}</p>
              <p class="first-run-place-meta">
                {found.countryCode === 'ZZ'
                  ? 'From this computer'
                  : countryName(found.countryCode, locale)}
              </p>
            </div>
            <p class="field-hint">Your prayer times will be for this place.</p>
          </section>
        );
      }
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            Where are you?
          </h1>
          <p class="field-hint">
            Your times are worked out on this computer from where you are.
          </p>
          <button class="action first-run-primary" type="button" onClick={useMyLocation} disabled={busy}>
            {busy ? 'Finding your place...' : 'Allow location'}
          </button>
          <p class="field-hint">
            {browser === 'Chrome'
              ? 'Chrome asks Google to estimate where you are. SajdaTime never receives it.'
              : 'Edge asks Microsoft to estimate where you are. SajdaTime never receives it.'}
          </p>
          <CitySearch
            label="Or type a place"
            onPick={(city) => choosePlace(placeFromCity(city))}
            disabled={busy}
          />
          <div class="first-run-skip">
            <button class="action" type="button" onClick={useMakkah} disabled={busy}>
              Skip for now and use Makkah
            </button>
            <p class="field-hint">Prayer times will be for Makkah until you set your location.</p>
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
          Prayer alerts
        </h1>
        <p class="field-hint">At each prayer you hear a sound and see a message. The message closes after 1 minute.</p>
        <div class="first-run-sound-row">
          <span class="field-label">Sound</span>
          <button
            class="action action-small"
            type="button"
            aria-disabled={draft.alerts.sound === 'silent'}
            onClick={togglePlay}
          >
            <PlayIcon size={16} />
            <span>{playing ? 'Stop' : 'Play'}</span>
          </button>
        </div>
        <div class="choices" role="group" aria-label="Sound">
          {SOUNDS.map((sound) => (
            <ChoiceRow
              key={sound}
              selected={draft.alerts.sound === sound}
              title={SOUND_LABELS[sound]}
              hint={SOUND_HINTS[sound]}
              disabled={busy}
              onSelect={() => chooseSound(sound)}
            />
          ))}
        </div>
        <Notice
          tone="quiet"
          title={`${browser} needs to be open`}
          line={`If ${browser} is closed or the computer is asleep, no alert can sound.`}
          mark={<CheckMark />}
        />
      </>
    );
  }

  function renderMethodStep() {
    const isSingle = suggestion.alternatives.length === 0;
    if (isSingle) {
      const times = todayFor(draft.method);
      return (
        <>
          <h1 class="first-run-title" data-autofocus tabIndex={-1}>
            Calculation method
          </h1>
          <div class="method-row is-selected first-run-method-card">
            <span class="method-copy">
              <span class="method-name">{METHOD_NAMES[draft.method]}</span>
              <span class="method-hint">Suggested for {placeValue}</span>
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
              Match my mosque
            </button>
            <button class="action" type="button" onClick={() => setSub('methods')}>
              Other methods
            </button>
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
          Calculation method
        </h1>
        <p class="field-hint">Mosques in {placeValue} work out Fajr and Isha differently.</p>
        <div class="choices" role="radiogroup" aria-label="Calculation method">
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
                  <span class="method-name">{METHOD_NAMES[method]}</span>
                  {index === 0 ? (
                    <span class="method-hint">Suggested for {placeValue}</span>
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
            Match my mosque
          </button>
          <button class="action" type="button" onClick={() => setSub('methods')}>
            Other methods
          </button>
        </div>
      </>
    );
  }

  function renderOtherMethods() {
    return (
      <div class="first-run-sheet">
        <header class="first-run-sheet-head">
          <BackArrow label="Back" onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            Other methods
          </h1>
        </header>
        <div class="first-run-sheet-body method-body">
          <p class="field-hint">
            Today's Fajr and Isha in {draft.place.name} are shown for each one, so you can compare
            with your mosque.
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
          <BackArrow label="Back" onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            Match my mosque
          </h1>
        </header>
        <div class="first-run-sheet-body">
          <p class="field-hint">Type the Fajr start time your mosque shows.</p>
          <p class="field-hint">Use the start time, not the jamaat time.</p>
          <label class="field-label" for="match-fajr-time">
            Fajr time
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
              <div class="choices" role="radiogroup" aria-label="Closest methods">
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
                        <span class="method-name">{METHOD_NAMES[entry.method]}</span>
                        <span class="method-times">
                          <span class="method-time">Fajr {clock.format(entry.fajr)}</span>
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
                  None of the methods is close to your mosque. Your mosque could be following
                  its own timetable. Pick the closest, then use Match your mosque in Settings to
                  adjust each prayer by minutes.
                </p>
              ) : null}

              {selectedMatch ? (
                <button
                  class="action first-run-primary"
                  type="button"
                  onClick={() => useMatchedMethod(selectedMatch)}
                >
                  Use {METHOD_NAMES[selectedMatch]}
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
          <BackArrow label="Back" onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            Disclaimer
          </h1>
        </header>
        <div class="first-run-sheet-body">
          <div class="disclaimer-full">
            {FULL_DISCLAIMER.map((paragraph, index) => (
              <p class="disclaimer-text" key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderLanguage() {
    return (
      <div class="first-run-sheet">
        <header class="first-run-sheet-head">
          <BackArrow label="Back" onClick={closeSub} />
          <h1 class="first-run-sheet-title" data-autofocus tabIndex={-1}>
            Language
          </h1>
        </header>
        <div class="first-run-sheet-body">
          <div class="choices" role="radiogroup" aria-label="Language">
            <ChoiceRow
              selected={language === 'system'}
              title="Computer language"
              disabled={false}
              onSelect={() => setLanguage('system')}
            />
            <ChoiceRow
              selected={language === 'english'}
              title="English"
              disabled={false}
              onSelect={() => setLanguage('english')}
            />
          </div>
        </div>
      </div>
    );
  }
}
