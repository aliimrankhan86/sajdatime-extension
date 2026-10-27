# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `6647c96` on `main`, plus the Step 1 commit on top of it, which is the one to review. A commit cannot contain its own hash, so the hash named here is the commit the diff starts from, and Step 1 is the only commit after it. Step 1 of [`docs/BUILD-NEXT.md`](BUILD-NEXT.md) names a place the browser located, from the bundled city list and with no network, and confirms it with a "Location found" panel before the user goes on.
**Previous reviews:** `fab4abb`; then `eeac1ad`, which fixed the three P1s from the first pass; then `cb92544`, which did the P2s; then `ebcc4e0`, which applied Ali's ruling on the open P1; then the true-angle build and its third-pass fixes; then `f964ee8`, which reversed the true-angle ruling and was judged READY with two P2 fixes to the notes; then `515731e`, which applied those two note fixes; then `7de9d3f`, which added the School choice and the first popup width fix and was judged NOT READY with one P1: the real popup now opened 25 pixels wide; then `5c29e83` and `9f9ec0d`, which fixed that P1 and were judged READY with two P2s: the screenshots dirty the checkout and zoom above 210 percent is untested. This commit applies both P2s. The School choice is unchanged and accepted; do not reopen it. The commits under review now are Step 1 of `docs/BUILD-NEXT.md`, on top of it the security foundation that `docs/SECURITY.md` asks the first step to add, and on top of those the three P2 fixes below, applied after those two were judged READY with three P2s.
**Date:** 27 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

A Manifest V3 browser extension, Chrome first and Edge later. It shows today's six prayer times for a saved place, the next prayer with a countdown, the Hijri date, and a small Settings screen. It is a separate product from the Android app. Do not review it as a port of `SajdaTime` and do not copy phone release notes or store copy into it.

There is no account, no ad, no analytics, no host permission, no content script and no runtime network request. Location is handled on the computer. The full intent is in [`docs/PLAN.md`](PLAN.md). Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md). If the plan and a decision disagree, the decision wins. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this commit changed

This is Step 1 of [`docs/BUILD-NEXT.md`](BUILD-NEXT.md): "Use my location" names the place and says so before going on.

- **The place is named offline.** `nearestCity` in `src/core/cities.ts` picks the closest row of the bundled `public/data/cities.json` by great circle distance. The list is still loaded only after the browser returns a position, exactly as the city search loads it. `placeFromBrowser` in `src/settings/place.ts` takes that city and uses its name and country, while the coordinates and the time zone stay the browser's, rounded as before, because the times are for where the user is and not for the town centre. Past 50 kilometres the name becomes "Near <town>".
- **A confirmation replaces the location buttons.** A green tick, **Location found**, **Leeds, United Kingdom**, **Your prayer times are now for this place.**, and one solid button: **Continue** on first run, **Done** in the Settings Location sheet. `src/popup/LocationFound.tsx` is the one panel both screens use. The whole panel is a `role="status"` region and keyboard focus moves to its button.
- **The country now drives the first-run method.** A located place is saved with a real country code, so `suggestMethod` suggests for GB, PK or SA instead of falling back to Muslim World League everywhere. That removes the cause of the recorded P2 "the default method survives a place change" for located users.
- **A city list that will not load still works.** The place stays "My location" with `ZZ` and the user goes on, which is today's behaviour.
- **A searched town does not show the panel.** Only "Use my location" does. A searched town already says which town was chosen.
- **Saving moved to the button, not to the position.** Saving earlier fires the storage watcher, and the popup would swap to Times and destroy the panel before anyone read it.
- **The mark is on every screen, including Location.** `src/popup/Brand.tsx` is now the one place the launcher mark and the word mark are drawn. It is used by the first run, Times, Settings and both Location states, so the Settings Location sheet and its confirmation carry the mark that used to appear only on the other screens.

### The security commit on top

`docs/SECURITY.md` arrived on `main` while Step 1 was being built, and it says the next started step also adds the checks every later step depends on. They are in their own commit so they can be read apart from Step 1.

- **The manifest is locked (R1, R2).** `tests/unit/manifest.test.ts` asserts the exact top level key set, the exact permissions (`storage` and `geolocation`), the exact content security policy, and that no host permission, content script, web accessible resource, external messaging key or `optional_permissions` exists. Any addition fails the build until the test is changed on purpose, with a decision in `DECISIONS.md`.
- **The build is scanned (R3, R6, R7, R8).** `tools/check-bundle.mjs` runs at the end of `npm run check`, after the build. It fails on `eval`, `new Function`, `document.write`, `importScripts`, external messaging, `console.log`, `storage.sync`, `localStorage`, `sessionStorage`, `indexedDB`, the HTML insertion family in `src/`, and any URL outside the four link allowlist entries. The three `www.w3.org` XML namespace names are allowed because Preact writes them into elements as identifiers, never as requests.
- **Links open safely (R6).** Both About links now carry `rel="noopener noreferrer"`.
- **Keys cannot be committed (R10).** `.gitignore` now covers `*.pem` and `*.crx` beside the existing `.env*` and `dist/`.
- **Stored names are measured (R8).** `isSettings` rejects a stored place name longer than 200 characters, so damaged storage returns to the first run instead of rendering it. `tests/unit/settings.test.ts` pins 201 rejected and 200 accepted.
- **Text is text (R7).** A new end to end test stores a place named `<img src=x onerror=alert(1)>` and asserts it renders as those exact characters, with no `img` element inside the place and no dialog.
- **Deferred on purpose.** `SECURITY.md` says the sender checked message handler tests (R4), the wide no network test (R6) and the alarm name parser (R11) arrive with Step 2, which adds the messages and alarms they protect. This commit does not pretend to have them.

### The P2 fixes on top

The READY review of the Step 1 and security commits left three P2s, fixed in one commit:

- **A located point is named by the city, not its district.** `placeFromGeolocation` now takes the most populous bundled city within 15 kilometres (`largestCityWithin`), falling back to `nearestCity` when none is inside the radius. Central Paris was being named "Paris 04 Hôtel-de-Ville" and central Dubai "Dubai International Financial Centre". `tests/unit/place.test.ts` pins Paris, Dubai, London and Leeds from the shipped list, plus the nearest fallback.
- **The dead, inaccurate error branch is gone.** `placeFromGeolocation` never rejects, so the `.catch` that said "We could not read your location" after a position had been read was unreachable and its wording was wrong. It is removed from both `Popup.tsx` and `LocationSheet.tsx`.
- **Close commits the found place.** On the "Location found" panel, the header's close control and Escape now save the place exactly as Done does, instead of discarding it. `tests/e2e/location-found.test.ts` drives the Settings sheet, presses Close and asserts the stored place is Leeds.

### What the two commits before it changed

`873198b` put the phone app's logo in the popup header. `27d37b0` applied the two P2 fixes from the READY review of `5c29e83`: screenshots are written only when `SAJDATIME_SCREENSHOTS=1`, so a plain test run leaves the checkout clean, and zoom above 210 percent is recorded as a stated limit.

`7de9d3f` set the body to `width: 380px` with `max-width: 100vw`. That collapsed the real action popup to 25 pixels, because Chrome sizes an action popup while its viewport is still tiny, so `100vw` shrank the body to match. The earlier `width: 100%` body collapsed it to 147 pixels. The School choice from that commit is unchanged and accepted.

- **Popup width.** The `html` width rule is gone and the body is a fixed 380 pixels with no `max-width`, the only value that holds in a real popup.
- **Real popup measurement.** `tests/e2e/popup-width.test.ts` now opens the real toolbar popup in headful Chrome for Testing over a remote debugging port and reads the window, body width and Settings button from the DevTools protocol. It fails at 147 pixels against the `width: 100%` body and at 25 pixels against the `max-width: 100vw` body, so it cannot pass for the wrong reason.
- **Zoom tests.** The two zoom tests used to fake zoom by shrinking the viewport to 253 and 190 pixels. Chrome does not shrink a popup viewport on zoom. They now set `deviceScaleFactor: 2` on a 380 by 600 viewport and check that nothing clips, the countdown stays on one line and every control keeps a 44 CSS pixel target.
- **Docs.** `DECISIONS.md` D-013 is corrected to the fixed 380 pixel width and the real-zoom testing. `HANDOVER.md` records the lesson that `100vw` collapses a popup and only a real-popup measurement catches it.

## Why the width bug got through

Every end-to-end test except the new one opens the popup as a 380 by 600 tab, so a real Chrome action popup sizing itself to the document's intrinsic width was never exercised. The first fix added `max-width: 100vw` and a fit-content regression test; that test passed for the wrong reason, because in a 380 pixel tab `100vw` is still 380 pixels. Only a real popup reveals that Chrome measures `100vw` while the popup is still tiny. `tests/e2e/popup-width.test.ts` now opens the real popup headful over a remote debugging port, and it fails against both earlier CSS states.

## What to run

Node 24 and npm 11 were used. Chrome for Testing is needed because branded Chrome refuses an unpacked extension in this setup.

```bash
git clone https://github.com/aliimrankhan86/sajdatime-extension.git
cd sajdatime-extension
npm ci
npm run check
npm run test:e2e
```

`npm run check` runs strict TypeScript, Vitest, a production build and then `tools/check-bundle.mjs`, the `docs/SECURITY.md` bundle scan. `npm run test:e2e` builds `dist` and drives the loaded extension with Playwright. It finds Chrome for Testing through `SAJATIME_CHROME` or Playwright's cache. If neither exists, set `SAJATIME_CHROME` to a Chrome for Testing binary.

To look by hand, open `chrome://extensions`, enable Developer mode, choose **Load unpacked** and pick `dist/`. The popup is 380 by 600. Settings is the green button in the header.

## What to judge

1. **The location step and its confirmation.** Read `nearestCity` and `placeFromBrowser` and confirm the naming is offline, that the coordinates and the time zone are still the browser's, that 50 kilometres is where "Near" starts, and that a city list which will not load still saves "My location" with `ZZ`. Read `src/popup/LocationFound.tsx` and confirm the words from the brief, one solid button, `role="status"` and focus on the button. Check that `tests/e2e/popup.test.ts` now proves Leeds, `GB` and the UK method, that `tests/e2e/location-found.test.ts` covers the sheet and the aborted city list, and that every new test was shown failing before the change. The popup width fix, the School choice and the Shia Maghrib rule are accepted; do not reopen them.
2. **Design against the brief.** Quiet Glass tokens, 380 by 600 popup, spacing, type hierarchy, the solid green action button with bold white text, no two icon buttons side by side, a close control on every dismissable screen, times in tabular numerals, nothing below 14 pixels, targets at least 44 pixels. The plan's section 3 and section 6 are the written brief.
3. **The Times screen in every state.** First open, next prayer today, next prayer tomorrow after Isha, a current prayer that is not the next one, sunrise as a quieter row, a polar estimate, a very long place name, 12-hour and 24-hour browser languages, 200 percent zoom, light and dark.
4. **First run and Settings.** Whether the words are plain and true, whether the location flow is understandable without a manual, whether Settings preserves a deliberately chosen method when the place changes, and whether the disclaimer is intact and readable. The disclaimer must never be removed, softened or hidden.
5. **Accessibility.** axe is not a screen reader. Check the tab order, the heading focus, Escape, the `aria-current` value, the live city hint and whether the visible pills match what is announced. Check the new `aria-disabled` controls still behave for keyboard and pointer, and that focus does not move during a save.
6. **Correctness and privacy in the code.** The engine mirrors the phone's high-latitude rule, the projection to the signed reference latitude, the Ramadan Isha adjustment, manual corrections last and the ascending clamp. The manifest should still ask only for `storage` and `geolocation`, with the strict content security policy that `tests/unit/manifest.test.ts` asserts. There should be no `fetch` to a remote host, no remote code and no content script, and `tools/check-bundle.mjs` is the scan that fails the build if one appears.
7. **Test quality.** Look for tests that only assert the code's own output, tests that pass for the wrong reason, and state that is not covered. The engine fixtures are the phone's values, not Aladhan's, except the broad sanity fixtures. The high-latitude Shia values were produced with the phone's Java adhan library, not by running the extension.
8. **Documentation accuracy.** If a claim in `HANDOVER.md` is not true of this commit, that is a finding.

## Evidence in this commit

`npm run check`: 10 unit files, 105 tests passed, strict typecheck passed, production build passed, then the bundle scan passed.
`npm run test:e2e`: 34 tests passed.

| Test file | What it covers |
| --- | --- |
| `tests/unit/engine.test.ts` | Phone fixtures, including the five high-latitude Shia cases, polar projection and correction clamp |
| `tests/unit/aladhan.test.ts` | 13 broad independent sanity fixtures |
| `tests/unit/methods.test.ts` | The Sunni and Shia method split and the offered list |
| `tests/unit/settings.test.ts` | Validators: unknown method, coordinates outside the world, unknown time zone, a place name over 200 characters |
| `tests/unit/manifest.test.ts` | The manifest lock: exact keys, exact permissions, the content security policy, no route from a web page |
| `tools/check-bundle.mjs` | `docs/SECURITY.md` R3, R6, R7 and R8 over `dist/` and `src/` |
| `tests/unit/cities.test.ts` | City file parsing, search, country names, the nearest city for Leeds and Karachi, and great circle distance |
| `tests/unit/place.test.ts` | A place from a browser fix: the city name and country with the browser coordinates, "Near" past 50 kilometres, and the fallback when there is no city |
| `tests/e2e/popup.test.ts` | Times, 200 percent zoom, countdown tick, 12-hour language, tomorrow Fajr, first run with the location confirmation, a stored name that is markup shown as text, Makkah fallback, Settings, city search, method persistence |
| `tests/e2e/location-found.test.ts` | The confirmation in the Settings Location sheet with Done, and a city list aborted in the browser, which still saves My location |
| `tests/e2e/audit.test.ts` | Asr school, method change, place change, dark link contrast, keyboard focus and Escape, focus after a save |
| `tests/e2e/design.test.ts` | Now and Next pills, Next row has no `aria-current`, 44 pixel controls, 200 percent zoom, dark flat card, no network request |
| `tests/e2e/a11y.test.ts` | axe 4.14, WCAG 2.2 AA tags, Times, Settings, Location, first run and the location found panel, light and dark |
| `tests/e2e/school.test.ts` | School set, both reset directions, the keep case, focus after a save |
| `tests/e2e/popup-width.test.ts` | The real action popup opens at 380 by 600 with the Settings button visible |
| `tests/unit/contrast.test.ts` | 14 token pairs, including the hero gradient stops and the focus ring |

## Screenshots

These are review evidence at 380 by 600, not the final store set. They are refreshed only when `SAJDATIME_SCREENSHOTS=1` is set, so a plain test run does not rewrite them.

![Times, light](images/times-light.png)
![Times, dark](images/times-dark.png)
![Settings, light](images/settings-light.png)
![Settings, dark](images/settings-dark.png)
![First run, light](images/first-run-light.png)
![Location found, first run](images/location-found-light.png)
![Location found in the Settings sheet](images/location-found-settings-light.png)
![Times at 200 percent zoom](images/zoom-200.png)
![Settings at 200 percent zoom](images/settings-zoom-200.png)

The 200 percent zoom Settings screenshot is deliberately tall. It shows the stacked school and Hijri controls, and the native select truncating the longest method name. Judge whether that is acceptable at that zoom, not as the normal layout.

## Known gaps, do not report as new

- The Times header is the scaffold version: the phone app logo (about 38 pixels, larger than the plan's 32 at Ali's request) with the word mark and a Settings pill, but not the plan's Gregorian date over the Hijri date, and town chip with pin and refresh. The footer is one line, not the two solid buttons. The next card has no glyph and no five prayer bars.
- The next card uses a 28 pixel name and time with a 22 pixel countdown. The plan's type table says a 46 pixel countdown. The previous review accepted the compact card; Ali also accepted it. Do not reopen it unless it causes a real usability fault.
- The full first run is not built. There is one location step and a city search. The school, madhab, language and six-step sequence are later milestones. The first-run pick always starts Sunni and suggests a method from the country.
- No alarms, badge, notifications, offscreen audio, Ramadan notices, suhoor, Eid, PDF timetable, Qibla or full About page.
- English only. No language switcher and no right-to-left layout yet. A remaining recorded P2: an Arabic browser shows Arabic meridian words beside the English labels. The digits are not yet forced to Latin.
- City search matches Latin names only. The nearest-city label for a located place is the same Latin name from the same file, so a town whose only name is Urdu or Arabic is shown in Latin or omitted.
- A located place is named by the nearest city, not by the town the user is in. Someone between towns sees the nearest town's name, or "Near" and that town past 50 kilometres, and the header says that name rather than a street address.
- A remaining recorded P2: after midnight the Isha row still shows tonight's time with a "Now" pill.
- A remaining recorded P2: the default method survives a place change if the user never chose one. Step 1 removed the cause for a place found by the browser, which now carries a real country. A place changed to a searched town still keeps the method.
- A remaining recorded P2: the polar note does not name the latitude it borrowed.
- No Edge run, no Windows run and no real screen reader run. These are stated limits.
- `tests/e2e/popup-width.test.ts` runs headful, because `chrome.action.openPopup()` never surfaces a measurable target under headless Chrome. On a machine without a display, only that test cannot run; the other 29 run headless.
- Zoom is tested at 200 percent only. Above about 210 percent, 380 CSS pixels at that zoom is more than the 800 pixel width Chrome allows an action popup, so the page may need sideways scrolling. This is a stated limit, not a layout change.
- No GitHub Actions workflow. This Mac's `gh` login lacks the `workflow` scope. Local checks are the evidence.
- The real browser geolocation bubble is mocked in the tests because the extension origin cannot be granted a permission from Playwright.
- The store listing, privacy URL and zip are not final.
- The service worker is nearly empty by design. Its presence is not evidence that alarms work.

## Verdict wanted

Give a verdict in this shape:

- **P0** permanent breakage or a privacy or permission breach.
- **P1** silent wrong result, unusable state, or religious or location content that misleads.
- **P2** quality, maintainability, test gap or design polish.

For each finding: file and line, what happens, how you reproduced it, what the user sees, and the smallest fix. If a finding is based only on reading, say so. If you reran a test, paste the command and result. Do not call the work done because the suite is green. The point of this pass is to find what the green suite missed.

State clearly whether the previous P1s are actually fixed, and whether this commit is ready for Ali to look at. If another review round is needed, say what the next smallest set of changes is.
