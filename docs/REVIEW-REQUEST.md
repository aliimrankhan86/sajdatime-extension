# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `b71fd98` on `main`, plus this Step 6 commit on top of it, which is the one to review. Step 6 first landed as `5e3c71a` and came back **not ready**; this commit carries the fix and is the one to look at, and it is the first commit made after `5e3c71a`, so `5e3c71a` is the diff base. `b71fd98` is the accepted Step 5 (the Times screen re-plan: U4, U5, U6, U7 with `Glyph`, `TownChip` and two-tone `Notice`). Step 6 of [`docs/UX-PLAN.md`](UX-PLAN.md) is the Settings restructure: U8, U9, U10, U11, U13 with the `Row`, `Sheet`, `ChoiceRow`, `Segmented` and `Notice` components.

**Previous reviews:** Step 1 (`ca39f1a`) READY with three P2 fixes; Step 2 (`cf60111`) NOT READY for a missing notification icon, a Play button that did not return and a cleared self-clear alarm, all repaired in `fd002ba` and judged READY; a P3 fix in `a534306`; Step 3a (`432223b`) READY with its P2 fix in `7debc97`; Step 3b (`4082931`) READY; Step 4 (`c712b14`) READY; Step 5 (`b71fd98`) READY. The security foundation is `docs/SECURITY.md`, enforced by code. All of that is history for this review.

**Date:** 28 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

A Manifest V3 browser extension, Chrome first and Edge later. It shows today's six prayer times for a saved place, the next prayer with a countdown, the Hijri date, a small Settings screen, optional prayer alerts, Ramadan labels for Suhoor and Iftar, a coming-Ramadan notice, an Eid notice, an iftar alert, and now a System, Light or Dark theme. It is a separate product from the Android app. Do not review it as a port of `SajdaTime`.

There is no account, no ad, no analytics, no host permission, no content script and no runtime network request. Location is handled on the computer. Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md); if the plan and a decision disagree, the decision wins. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this commit changed

This is Step 6 of [`docs/UX-PLAN.md`](UX-PLAN.md): the Settings restructure (U8, U9, U10, U11, U13). Settings becomes one screen of rows grouped into cards, every row opens a sheet that works by keyboard, and the card surfaces are unified behind the section 1.2 light and dark split.

- **One screen of rows.** Settings is a list grouped into cards: Disclaimer, Place, Prayer times, Ramadan, Alerts, Appearance and About. Each row is a whole-row button, one line of layout at 56 to 64 pixels tall, with a 36 pixel icon tile, the title over the value 4 pixels apart, and a chevron that mirrors in right to left. The Disclaimer is the first row, untouched.
- **A sheet for every choice.** `Row`, `Sheet`, `ChoiceRow`, `Segmented` and `Notice` are new components. School, Asr school, Calculation method, Hijri date, Sound, Theme, Credits and the full Disclaimer text each open a `Sheet` with a title, a close X, focus moved in on open, and a Done or Close foot. Escape closes, and focus returns to the row that opened it.
- **U9, U10, the method and Asr sheets.** The Calculation method sheet lists the methods grouped (Suggested for the country, then Europe, Middle East and Africa, South and East Asia, and Shia), each with its own description and today's Fajr and Isha for the saved place so the user can compare with their mosque. Asr school is Shafi'i or Hanafi and only shows for Sunni methods.
- **U11, Hijri shift.** A Hijri date sheet holds a stepper, one day earlier or later, with the resulting shift read out, for a mosque whose Hijri date differs by a day or two.
- **U8, U13, alerts and theme.** The Alerts group keeps the master switch, five prayer switches, the sound choice, Play, Stop and a test alert, with the blocked and the browser-needs-to-be-open notices. The theme choice lives in an Appearance group as System, Light or Dark.
- **About.** Privacy policy opens the published page in a new tab; Credits and Version are rows.
- **Every card surface unified.** `.group-card` now uses the section 1.2 split: a level 1 shadow and no border in light, a one pixel outline and no shadow in dark.
- **Measured, not eyeballed.** `tests/e2e/settings-sheets.test.ts` opens every sheet by keyboard and checks Escape closes and focus returns. axe reports no WCAG 2.2 AA violation on Settings in both themes, with and without the Alerts group open. `npm run test:e2e` runs 77 tests, four of them new in `tests/e2e/settings-rows.test.ts`.

### What the review changed

The Step 6 review of `5e3c71a` measured rows at about 120 pixels, found the group headings repeating the only row under them, and found the method sheet naming Moonsighting Committee, ISNA and University of Karachi twice and showing a Shia heading to a Sunni user. All of that is fixed here.

- **A row is one line of layout.** A zero-width space rendered as its own flex item inside the row's column was adding a line and two gaps to every row that showed a value. It now sits inside the title span, so the text, the accessible name and the axe result are unchanged and the row draws at 60.4 pixels with a value and 56 without. `.row` is `min-height: 56px; padding: 8px 12px; gap: 14px`.
- **A heading only over two or more rows.** A local `Group` component renders the `h2` and the `aria-labelledby` only when the card holds two or more rows, so nothing points at a heading it does not have. The count is passed in, because the Alerts card has one row with alerts off and seven with them on, so its heading comes and goes with the master switch.
- **Each method once.** The suggested methods form the first group and are removed from the region groups below, an emptied group is dropped, and the Shia group is never appended for a Sunni user. A Sunni list is 11 methods; a Shia list is exactly Jafari and Tehran under one Shia heading.
- **Play beside the Sound title.** `Sheet` gained an optional action slot in its header, between the title and the close X, which is where `BUILD-NEXT.md` Step 2 puts the compact Play button.

**One deviation to weigh:** a row may not exceed 64 pixels, so a row's title and value are each one line and clip with an ellipsis. The Credits value and the Disclaimer value are wider than the 228 pixels a row has, so those two end in an ellipsis on screen. Every word stays in the text, in the accessible name and in the sheet the row opens, and the Disclaimer row stays first. The alternative, letting them wrap, puts those rows near 85 pixels and fails the review's own height test. D-035 records this.

## What to run

Node 24 and npm 11 were used. Chrome for Testing is installed by Playwright.

```bash
npm ci
npm run check        # typecheck, 250 unit tests, build, bundle scan
npm run test:e2e     # 77 Playwright tests
SAJDATIME_SCREENSHOTS=1 npm run test:e2e   # refresh docs/images
```

Results on this commit: `npm run check` passed with 250 unit tests in 14 files and `check-bundle: 7 bundle files and the source are clean`; `npm run test:e2e` passed 77 of 77. The screenshots in `docs/images/` were refreshed by the third command.

## Evidence, measured rather than looked at

| Test | What it proves |
| --- | --- |
| `tests/unit/tokens.test.ts` | 37 tests: all 32 roles, both themes, equal to the fixture; brand, CTA and hero values resolve; both blocks hold the same names; `color-scheme` present; no `!important`, no `text-transform` |
| `tests/unit/contrast.test.ts` | 74 tests: 22 text pairs at 4.5:1, 6 UI pairs at 3:1, and 18 hero ink/stop pairs at 4.5:1, in both themes |
| `tests/unit/settings.test.ts` | The theme migration keeps an explicit choice; `firstSettings` is System; an unknown theme is rejected |
| `tests/e2e/theme.test.ts` | System follows the operating system without a reload; Light and Dark beat the opposite operating system; the first content appears with the stored theme (MutationObserver); the selector writes `theme` to storage; an old setting becomes System |
| `tests/e2e/design-foundation.test.ts` | In both themes: body, brand, place, Hijri, card, list, next row, pill and footer colours equal the exact token values; light card has a shadow, dark card has none and a `#2a312e` hairline; the card is above the list and the list above the footer; the gaps are 8 px; Times fits 600 px; nothing crosses the 380 px edge |
| `tests/e2e/words.test.ts` | No em dash, en dash, semicolon, spaced hyphen or section 6.3 banned word on first run, location found, Times, Settings, the Location sheet or a notice, in both themes; the detector fires on a bad sample |
| `tests/e2e/a11y.test.ts` | axe clean on Times, Settings, Location, first run and location found, light and dark; dark is now painted with `data-theme` instead of `emulateMedia` |
| `tests/e2e/design.test.ts` | 44 px targets on Times and Settings in dark, flat dark card, 200 percent zoom, no sideways scroll |

Verified ratios include: light `onSurface/background` 15.05, `onSurfaceVariant/background` 5.92, `onCta/cta` 8.21; dark `onSurface/background` 15.42, `onSurfaceVariant/background` 8.60, `onCta/cta` 4.92. All hero ink/stop pairs pass 4.5:1.

## Screenshots

Review evidence at 380 by 600, not the final store set. They are rewritten only when `SAJDATIME_SCREENSHOTS=1` is set.

![Times, light](images/times-light.png)
![Times, dark](images/times-dark.png)
![Times in Ramadan, light](images/times-ramadan-light.png)
![Times in Ramadan, dark](images/times-ramadan-dark.png)
![Settings, light](images/settings-light.png)
![Settings, dark](images/settings-dark.png)
![First run, light](images/first-run-light.png)
![First run, dark](images/first-run-dark.png)
![Location found, light](images/location-found-light.png)
![Location found, dark](images/location-found-dark.png)
![Location found in Settings, light](images/location-found-settings-light.png)
![Location found in Settings, dark](images/location-found-settings-dark.png)
![Times at 200 percent zoom](images/zoom-200.png)
![Settings at 200 percent zoom](images/settings-zoom-200.png)

The notices show only on the three days before Ramadan and on the two Eids, so no notice screenshot is in this set; the e2e tests assert the notice text and layout instead. The 200 percent Settings screenshot is deliberately tall: judge it as a zoom case, not as the normal layout.

## Known gaps, do not report as new

- **Step 4 intentionally changes no layout.** The Times header is still the scaffold version, the next card is still the compact 28 px card accepted earlier, and the footer is still one line. Step 5 re-plans Times; Step 6 re-plans Settings.
- **Only `.next-card` gets the section 1.2 split** (light shadow and no border, dark hairline and no shadow). The other card-like surfaces keep their hairline in both themes until Step 5 or 6 unify them.
- **The hero tokens are defined but unused.** Nothing paints the hero card until Step 5.
- **A notice still pushes the popup past 600 px** and it scrolls; this is D-030 and Step 5.
- **The notices are the functional form**, not the full `Notice` component (round mark and solid buttons), which is Step 5 or 6.
- **The Theme selector has no hint line.** The brief gives no words for one, and inventing user-facing words is not allowed.
- **An explicit Light or Dark choice on the opposite operating system** can show the operating system's window background for the few milliseconds the storage read takes. The CSP forbids an inline script and `localStorage` is banned, so there is no synchronous cache. Content never paints in the wrong theme, and `theme.test.ts` proves the first content appears with the stored theme; System is exact from the first frame.
- **The word check is an e2e scan of rendered text**, not the literal "unit test" wording of UX-PLAN 5.4, because a raw source scan counts code semicolons and class names as prose and misses runtime strings. The reason and the self-test are recorded in D-031.
- The full first run is not built; the school, madhab, language and six-step sequence are later milestones. English only, no right-to-left layout yet.
- City search matches Latin names only; a located place is named by the nearest city; after midnight the Isha row still shows tonight's time with a "Now" pill; the polar note does not name the latitude it borrowed; the default method survives a searched-town change if the user never chose one.
- No Edge run, no Windows run and no real screen reader run. Zoom is tested at 200 percent only. No GitHub Actions workflow (`gh` lacks the `workflow` scope), so the local checks are the evidence.
- The real geolocation bubble is mocked in the tests because the extension origin cannot be granted a permission from Playwright. The store listing, privacy URL and zip are not final.

## Verdict wanted

Give a verdict in this shape:

- **P0** permanent breakage or a privacy or permission breach.
- **P1** silent wrong result, unusable state, or religious or location content that misleads.
- **P2** quality, maintainability, test gap or design polish.

For each finding: file and line, what happens, how you reproduced it, what the user sees, and the smallest fix. If a finding is based only on reading, say so. If you reran a test, paste the command and result. Do not call the work done because the suite is green. The point of this pass is to find what the green suite missed.

State clearly whether the Step 6 requirements are met, whether the layout is unchanged, and whether this commit is ready for Ali to look at. If another review round is needed, say what the next smallest set of changes is.
