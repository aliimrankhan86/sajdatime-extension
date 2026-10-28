# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `fc79dae` on `main`. `78a5179` is the Step 7 commit made before it, so `git diff 78a5179..HEAD` is the whole of Step 8. `fc79dae` is the commit to review. Step 8 of [`docs/UX-PLAN.md`](UX-PLAN.md) and [`docs/PLAN.md`](PLAN.md) §6.3 is the rest of the first-run journey: the school and madhab steps, a language choice and the six-step sequence.

**Previous reviews:** Step 1 (`ca39f1a`) READY with three P2 fixes; Step 2 (`cf60111`) NOT READY for a missing notification icon, a Play button that did not return and a cleared self-clear alarm, all repaired in `fd002ba` and judged READY; a P3 fix in `a534306`; Step 3a (`432223b`) READY with its P2 fix in `7debc97`; Step 3b (`[[PHONE_b931147a]]`) READY; Step 4 (`c712b14`) READY; Step 5 (`b71fd98`) READY; Step 6 (`69e1f84`) READY after its first landing was not ready; Step 7 (`78a5179`) is committed and is this review's diff base. The security foundation is `docs/SECURITY.md`, enforced by code. All of that is history for this review.

**Date:** 28 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

A Manifest V3 browser extension, Chrome first and Edge later. It shows today's six prayer times for a saved place, the next prayer with a countdown, the Hijri date, a small Settings screen, optional prayer alerts, Ramadan labels for Suhoor and Iftar, a coming-Ramadan notice, an Eid notice, an iftar alert, a System, Light or Dark theme, a toolbar badge showing the time to the next prayer, a quiet reminder before each prayer and a suhoor reminder in Ramadan. First run now asks the questions below before the Times screen appears. It is a separate product from the Android app. Do not review it as a port of `SajdaTime`.

There is no account, no ad, no analytics, no host permission, no content script and no runtime network request. Location is handled on the computer. Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md); if the plan and a decision disagree, the decision wins. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this commit changed

This is Step 8 of [`docs/UX-PLAN.md`](UX-PLAN.md): the rest of the first-run journey.

- **Six steps plus a language choice, in `src/popup/FirstRun.tsx`.** Welcome, Disclaimer, School (Sunni or Shia), Madhab (Sunni only), Location and Method, then Alerts. The progress reads "Step N of 6", and "Step N of 5" when Shia skips the madhab step. Welcome carries the language button, the brand and "Begin". The Disclaimer step reads the short form before anything else and offers "Read in full" for the complete text. The School step resets the method suggestion, the madhab and the madhab-chosen flag when the school changes.
- **Resume where the user left off, in `src/settings/setup.ts`.** Progress is saved after each step to a new `sajdatime.setup.v1` key, checked by `isSetupDraft` (step integer 0 to 6, a valid settings object, a boolean), and removed the moment setup finishes. `sajdatime.settings.v1` stays the one source of truth for a finished install. D-038 records the key and the R8 and R12 effects.
- **The Method step reuses the Step 6 method sheet, `renderMethodStep()`.** When the country has one official method it shows a read-only card with today's Fajr and Isha; when it has three it shows compact radio rows. Both offer "Match my mosque" and "Other methods".
- **Match my mosque, in `src/core/match.ts`.** The user types the Fajr start time, the code works out today's Fajr for every offered method, sorts them and shows the two closest with "N minutes after your mosque" or "N minutes before your mosque". The closest is preselected. If the closest is more than 15 minutes away it shows a note saying none of the methods is close, in plain words.
- **The Alerts step reuses the Settings `ChoiceRow` and `Notice`.** Sound, a compact Play and Stop, and Soft beep, Adhan or Silent, then a quiet notice that the browser needs to be open. Finish saves, clears the draft and returns to the Times screen.
- **Component extraction.** `FirstRun.tsx`, `disclaimer.ts` (the short and full text), `meta.ts` (the plan's step titles, hints and labels) and new icons in `icons.tsx`. `Popup.tsx` shrinks because the flow moved out of it, and `styles.css` gains a scoped first-run block after the Settings styles. Reused: `.action` button, `Notice`, `Row`, `Sheet`, `ChoiceRow`, `Segmented`.

## What to run

```text
npm run check       typecheck + unit tests + build + bundle scan
npm run test:e2e    build + the Playwright suite in Chrome for Testing
```

`npm run check` must report a strict typecheck, **281 unit tests in 17 files** passing, a successful build, and `check-bundle: 7 bundle files and the source are clean`. `npm run test:e2e` must report **83** tests passing. The screenshots are frozen unless `SAJDATIME_SCREENSHOTS=1` is set, so a clean run leaves `docs/images` untouched; the review screenshots for this commit are `first-run-*` and `location-found-*`, light and dark.

## Evidence, measured rather than looked at

| Claim | Where it is pinned |
| --- | --- |
| Each step and sub sheet fits the 380 by 600 popup with no horizontal clipping and no target under 44 px, in both themes | `tests/e2e/first-run.test.ts` (`checkFits`, `checkSheetFits`, `undersizedControls`) |
| Shia reads "Step 3 of 5" and skips the madhab step | `tests/e2e/first-run.test.ts` |
| The madhab Continue stays disabled until a choice, and focus stays on the pressed choice after the save | `tests/e2e/first-run.test.ts`, `tests/e2e/school.test.ts` |
| The draft validates (step range, settings shape, boolean) and is removed on finish | `tests/unit/setup.test.ts` |
| Match my mosque lists the two closest with minutes after or before, and flags a far time | `tests/unit/match.test.ts`, `tests/e2e/first-run.test.ts` |
| Every step uses plain words in both themes, and the disclaimer is not softened | `tests/e2e/words.test.ts` |
| axe is clean on every first-run step, the language sheet and the full disclaimer, in both themes | `tests/e2e/a11y.test.ts` |
| The first-run CSS uses only tokens, so the bundle scan stays clean | `tools/check-bundle.mjs` |
| The privacy page states what is now stored | `docs/privacy.html`, `docs/SECURITY.md` R8 |

## Known and accepted before you look

- The language choice offers "Computer language" and "English". Both resolve to English until translations land in Step 10. No translation has been invented.
- The first-run steps are measured at the normal size only. The popup and Settings 200% zoom tests pass and the steps reuse the same components, but no dedicated first-run 200% zoom test exists. That is the honest gap in the Step 8 report.
- The geolocation path is exercised with a mocked position in Playwright, because a test cannot grant the real browser permission. The real Chrome permission bubble is not tested.
- Not tested: a real screen reader, Windows, Edge, other window sizes. axe is not a screen reader. Do not treat the green suite as proof of those.
- The alerts step first measured 623 px against the 600 px popup. It fits now through first-run-scoped overrides that trim the reused Settings notice and sound rows; the Times screen and the Settings sheets are unchanged.

## Verdict wanted

Give a verdict in this shape:

- **P0** permanent breakage or a privacy or permission breach.
- **P1** silent wrong result, unusable state, or religious or location content that misleads.
- **P2** quality, maintainability, test gap or design polish.

For each finding: file and line, what happens, how you reproduced it, what the user sees, and the smallest fix. If a finding is based only on reading, say so. If you reran a test, paste the command and result. Do not call the work done because the suite is green. The point of this pass is to find what the green suite missed.

State clearly whether the Step 8 requirements are met, whether the six steps and the language choice read and fit correctly, whether the disclaimer stays first and unsoftened, and whether this commit is ready for Ali to look at. If another review round is needed, say what the next smallest set of changes is.
