# Handover

**Updated:** 28 October 2026, Europe/London.

This file says what is true now. It is written for the next person or AI who opens the repository. Read it before the plan. The plan describes the whole build. This file describes the part that exists.

## Where this is

The repository was empty on 27 October 2026. It now has a working scaffold, a tested prayer engine, a Times popup, city search, a six-step first run that ends on the Times screen, a Settings screen, a location step that names the town it found and confirms it, optional prayer alerts from a background worker, a toolbar badge showing the time to the next prayer, a quiet reminder before each prayer, a Ramadan suhoor reminder, Ramadan labels for Suhoor and Iftar, and one brand mark on every screen including both Location states. It is **not in any store**. Version 0.1.0 in the manifest is a development version.

The Chrome Web Store developer account is open. The Edge Partner Center account is not. Ali opens accounts and presses Submit. Nobody else handles his credentials or payment.

An independent review brief for this commit is in [`docs/REVIEW-REQUEST.md`](REVIEW-REQUEST.md). It lists the commands, the screenshots, the open design questions and the gaps that are already known. Give it to a reviewer before asking for a verdict.

## What works, with evidence

| Area | State | Evidence |
| --- | --- | --- |
| Manifest V3 extension | Loads in Chrome for Testing | Playwright launches it with `--load-extension=dist` and finds the popup |
| Prayer engine | 13 methods, both Asr schools, polar projection and correction clamp, Shia Maghrib from the Twilight Angle cap exactly as the phone does it, so a normal Shia day above 60 degrees is not projected | `npm test`: 287 unit tests pass |
| Golden values | Six phone fixtures pinned, plus 13 broad Aladhan sanity fixtures | `tests/unit/engine.test.ts`, `tests/unit/aladhan.test.ts` |
| Hijri calendar | Umm al-Qura, shift, Ramadan windows, Eids | `tests/unit/hijri.test.ts` |
| Ramadan card | Inside Ramadan, Fajr reads "Suhoor ends" and Maghrib "Iftar", the hero and countdown follow ("until suhoor ends", "until you break your fast"), and the Hijri date already names the day; a "Ramadan" group in Settings holds one switch, on by default | `tests/e2e/ramadan.test.ts`, `docs/images/times-ramadan-light.png`, `docs/images/times-ramadan-dark.png` |
| Notices | A closable coming notice shows the one, two and three days before Ramadan, and an Eid notice on the two Eids, one at a time between the header and the hero; closing persists per Ramadan or Eid | `tests/e2e/notices.test.ts`, `docs/images/times-coming-light.png`, `docs/images/times-coming-dark.png`, `docs/images/times-eid-light.png`, `docs/images/times-eid-dark.png` |
| Method suggestion | Country table and Shia rule | `tests/unit/suggestions.test.ts` |
| City search | Offline GeoNames city list, search and pick; the most populous city within 15 kilometres names a place the browser located, with "Near" past 50 kilometres | `tests/unit/cities.test.ts`, `tests/unit/place.test.ts`, Playwright first-run test |
| Popup | Place chip, Hijri date, next prayer on the fixed hero-gradient card, countdown with its note on one line, five day bars, six time rows with a glyph each, a two-tone Notice between the header and the hero, the footer Settings button and the worked-out line, a fixed 380 pixel width, the real toolbar popup measured at 380 by 600, 200 percent zoom, and no scroll in any state in either theme | Playwright screenshots and 86 end-to-end tests |
| First run | Six steps plus a language choice: welcome, the short disclaimer before anything else (full text on request), School, Madhab for Sunni, Location with city search and a confirmed town, Method with today's Fajr and Isha on each row, then Alerts. Progress reads Step N of 6, or of 5 when Shia skips the madhab step. Answers are saved to `sajdatime.setup.v1` after each step, so closing the popup resumes there, and the last Continue saves and shows Times. Every step fits 380 by 600 with no target under 44 pixels, in both themes (D-038) | `tests/e2e/first-run.test.ts`, `tests/unit/setup.test.ts`, `tests/unit/match.test.ts`, `docs/images/first-run-light.png`, `docs/images/first-run-dark.png` |
| Settings | One screen of rows grouped into cards: Disclaimer, Place, Prayer times (School, Asr school, Calculation method, Hijri date), Ramadan card (the switch and a Suhoor reminder row), Alerts (master switch, five prayer switches, a Reminder before prayer row, the Sound row and a test alert), Appearance (Theme) and About (Privacy policy, Credits, Version). A row is one line of layout at 56 to 64 pixels: a 36 pixel tile, the title over the value 4 apart, the chevron, all centred. A group heading shows only when the group holds two or more rows. The method sheet names each method once and obeys the saved School: a Sunni list has no Shia method or heading, a Shia list is the two Shia methods. The Sound sheet's Play sits beside its title. Every row opens a sheet; each sheet works by keyboard, focus returns to its row, and Escape closes it. The Disclaimer value is the short "A helper, not a religious authority." | `tests/e2e/settings-sheets.test.ts`, `tests/e2e/settings-rows.test.ts`, `tests/e2e/a11y.test.ts`, `tests/e2e/audit.test.ts`, `tests/e2e/school.test.ts`, `tests/e2e/theme.test.ts` |
| Alerts | Off by default; a background worker schedules one alarm per prayer plus a daily refresh, fires a notification, and plays the beep or the adhan through one offscreen page; five-minute late drop; Stop sound; test alert; blocked notice when the browser denies notifications; the Play button returns to Play when a sound ends and a replaced sound never reports its end; the worker owns only prayer and refresh alarms, so the 60 second self-clear survives a rebuild; a Reminder before prayer row fires a silent notification 5, 10, 15, 20 or 30 minutes ahead, and a Suhoor reminder row fires 15, 30, 45 or 60 minutes before Fajr on Ramadan days, independent of the master switch; the daily refresh is scheduled whenever any alarm exists, so a Suhoor reminder keeps going past the two days planned ahead with prayer alerts off (D-037) | `tests/unit/alerts.test.ts`, `tests/unit/messages.test.ts`, `tests/e2e/alerts.test.ts` |
| Badge | The toolbar badge shows the time to the next prayer, rounded up to the minute: "54m", "1h54", "9h05", "11h", never "0m" and never more than four characters, on a deep green background with white text; the tooltip reads "SajdaTime: Maghrib in 1 hour 54 minutes (5:59 pm)"; before setup the text clears and the tooltip reads "SajdaTime: set up your prayer times"; a repeating one minute alarm keeps it current even when alerts are off | `tests/unit/badge.test.ts`, `tests/e2e/alerts.test.ts` |
| Light and dark | Both themes from `tokens.css`, WCAG AA contrast pairs | `tests/unit/contrast.test.ts`, `docs/images/times-dark.png`, `docs/images/settings-dark.png` |
| Accessibility | Keyboard focus moves into full screens and returns, every control has a 44 pixel target, axe finds no WCAG 2.2 AA violation | `tests/e2e/a11y.test.ts`, `tests/e2e/design.test.ts` |
| No network | No request leaves the extension while it shows times | Playwright request listener |
| Security | Manifest locked to `alarms`, `notifications`, `storage`, `offscreen` and `geolocation` with a strict content security policy, a checked message handler that ignores non-extension senders, no `eval`, no remote URL, no HTML insertion, no `console.log` in the bundle, every new tab link `noopener noreferrer` | `tests/unit/manifest.test.ts`, `tests/unit/messages.test.ts`, `tools/check-bundle.mjs`, `tests/e2e/alerts.test.ts` |
| Build | Production bundle in `dist/` | `npm run build` |
| TypeScript | Strict, no errors | `npm run typecheck` |

Commands actually run on 28 October 2026:

```text
npm run typecheck    pass
npm test             18 files, 287 tests passed
npm run build        pass, dist/manifest.json, the popup bundle, the background worker and the offscreen page written
npm run test:e2e     86 tests passed, three runs in a row
node tools/check-bundle.mjs  pass, 7 bundle files and the source clean
```

The 86 end-to-end tests cover the popup, the six first-run steps and their two sub sheets (fit, focus, method titles, the two stacked buttons), Settings and Location, every Settings row opening its sheet by keyboard and returning focus on Escape (including the Reminder before prayer and Suhoor reminder sheets), the row geometry and the group heading rule (`tests/e2e/settings-rows.test.ts`), the method list naming each method once, the design foundation, the notices and their fit, Ramadan, axe accessibility in both themes, School suggestions, theme choice, the word check, alerts, the badge staying present when alerts are off, city search, one real action popup measurement, and the Step 5 review fixes measured in `tests/e2e/hero.test.ts` (header, hero paint order, bars, countdown shape, hierarchy, compact hero and the 600 px fit in all four states). They run in Chrome for Testing at:

```text
/Users/aliimrankhan/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
```

That path is one example of where Playwright keeps Chrome for Testing. `tests/e2e/extension.ts` resolves the browser itself from `SAJATIME_CHROME`, `chromium.executablePath()` or the Playwright cache, so a fresh machine needs no edit.


## What is not built

- The timetable page (Save as PDF).
- Urdu, Arabic, Turkish and Indonesian, with right-to-left layout and the Arabic Western-digit rule.
- Store screenshots, the final listing, and the zipped builds. Review screenshots exist in `docs/images/` but are not the store set.
- A second browser test for Edge. Playwright cannot load an extension into Edge, so Edge gets a manual load and a short check later.
- An automated GitHub Actions workflow. The file exists locally at `.github/workflows/ci.yml` but is not in the repository: this Mac's GitHub login lacks the `workflow` scope, and the keyring refused the refresh. The local checks above are the evidence for now. After `gh auth refresh -s workflow` succeeds in a normal Terminal, remove the path from `.git/info/exclude`, commit the workflow and push it. Do not claim CI is green before it has actually run.

## Known gaps in what was tested

- The real browser permission bubble for geolocation is not automated. The end-to-end test supplies a known fix through `navigator.geolocation` and checks that the extension saves it. The banner and the real prompt still need a manual look.
- The zoom tests used to fake 150 and 200 percent zoom by shrinking the viewport to 253 and 190 pixels. Chrome does not shrink a popup's viewport on zoom; it enlarges the window and keeps 380 CSS pixels. Both zoom tests now set `deviceScaleFactor: 2` on a 380 by 600 viewport and check that nothing clips, the countdown stays on one line and every control keeps its 44 CSS pixel target. Sizes a user could get from a resized window, and Windows display scaling, are not tested yet.
- Zoom is tested at 200 percent only. Above about 210 percent, 380 CSS pixels at that zoom is more than the 800 pixel width Chrome allows an action popup, so the page may need sideways scrolling. The layout is not changed for it, and that range is not tested.
- **Lesson, 27 October 2026: `max-width: 100vw` on a popup collapses it, and only a real-popup measurement catches it.** While Chrome sizes an action popup its viewport starts tiny, so `100vw` shrinks the body to match. The first width fix (`width: 100%` with `max-width: 380px`) opened the real popup at about 147 pixels, and the second (`width: 380px` with `max-width: 100vw`) at about 25 pixels, neither of which any tab-based test could see. `tests/e2e/popup-width.test.ts` now opens the real toolbar popup in headful Chrome for Testing over a remote debugging port and reads the window size, the body width and the Settings button straight from the DevTools protocol. It fails against both earlier CSS states, so it cannot pass for the wrong reason. A tab is not a popup.
- **Lesson, 28 October 2026: that popup measurement still raced the page, so it slept instead of waiting.** It asked for the popup size after a fixed wait, which passed alone and failed inside the full suite, because the popup had not painted when the wait ended. It now asks Chrome for a free port, waits for the popup target, requires `document.readyState` to be `complete` and two identical size reads 150 ms apart, and tries three times before failing. Three consecutive full runs since then: 86 passed, 86 passed, 86 passed (D-039).
- No screen reader was run against the popup. axe reports no WCAG 2.2 AA violation on Times, first run, Settings and Location in light and dark, but axe cannot judge reading order, announcement quality or whether a real screen reader makes sense of the page.
- The heading focus ring is now removed with `outline: none` on `[data-autofocus]`. The heading keeps `tabIndex="-1"` and still takes focus, so a screen reader announces the step and the first Tab lands on a real control with a visible 3 pixel ring, both measured in `tests/e2e/first-run.test.ts`. That no screen reader announces the heading is reasoning, not measurement, because none was listened to.
- The method step fits with 17 pixels to spare in English (583 of the 600). Four longer languages arrive in Step 10, so that step is measured again there.
- Windows, Edge and a real user's Chrome profile are not tested. The suite runs on macOS with Chrome for Testing. Edge gets a manual load and a short check later.
- The first run uses the computer's time zone when it reads the browser's location. A city chosen by name uses the city's own time zone.
- City search matches Latin names only, and a place found by the browser is named by the nearest Latin city name in the same file. Urdu and Arabic names, local regions and a street address are not built.
- Only English exists. No language switcher, no right-to-left test.
- The alert end-to-end test asserts the worker schedules and clears alarms, but it does not play sound and assert the audio. The beep and the two adhan recordings play through the offscreen page and are not captured by the test. The worker schedules against the real wall clock while the popup tests use Playwright's faked clock, so the test asserts a refresh alarm and prayer-named alarms exist and clear, not exact counts.
- The Settings screen is one list of rows grouped into cards. It has the Disclaimer, Place, School, Asr school, Calculation method (all thirteen methods with today's Fajr and Isha), Hijri shift, Ramadan card (the switch and a Suhoor reminder row), Alerts (master switch, five prayer switches, a Reminder before prayer row, sound choice, Play and a test alert), Theme and About (Privacy policy, Credits, Version). A language choice is still not built, and the theme selector still has no hint line because the brief gives no words for one.
- The screenshots are review evidence, not the final store set. `docs/store/` still has placeholders.
- The review also flagged, left for later: the Isha row shows tonight's time with a "Now" pill in the small hours; the default method survives a place change when the user never chose it; an Arabic browser shows Arabic meridian words beside English labels; and the polar note does not name the latitude it borrowed. Each is a known, recorded P2, not a hidden defect. Step 1 removed the cause of the method one for a place found by the browser, which now carries a real country, so the method is suggested for the country the user is in rather than the unknown country fallback. A place changed to a searched town still keeps the method.
- **Shia Maghrib, decided 27 October 2026: the Twilight Angle cap, matching the phone.** The separate Isha-only pass caps Jafari (4 degrees) and Tehran (4.5 degrees) Maghrib at sunset plus `angle / 60` of the night, returning the true twilight when the sun reaches it early. An earlier same-day ruling chose the raw true angle; it was reversed after the review measured it jumping about 45 minutes between neighbouring days, landing one minute before Isha, and putting Jafari after Tehran at Anchorage. The cap the phone ships is smooth, so the two products now agree everywhere except the two small differences listed in `docs/DECISIONS.md`. `tools/adhan-probe` prints the phone's values, and `tests/unit/engine.test.ts` pins Oslo, Trondheim, Tampere, Manchester and Anchorage against them.


## Decisions that must not be undone by accident

Read `docs/DECISIONS.md`. The five that matter most:

1. This is a separate product from the phone. Do not copy the phone's release notes or store listing into this repo.
2. High latitude uses `TwilightAngle`, not `recommended`. The plan's line about `recommended` is older than the phone behaviour and would break the London fixtures.
3. Golden values are the phone engine's values, not the Aladhan numbers in the phone's test file.
4. No network requests. No host permissions. The privacy words must stay true. The manifest asks only for `alarms`, `notifications`, `storage`, `offscreen` and `geolocation`, and `tests/unit/manifest.test.ts` fails the build if anything else appears, including a weaker content security policy.
5. City data is bundled and fetched from the extension, never from the internet. It is GeoNames `cities5000` under CC BY 4.0.

## Next step

Steps 2, 3a, 3b and 4 of [`docs/BUILD-NEXT.md`](BUILD-NEXT.md) and [`docs/UX-PLAN.md`](UX-PLAN.md) are built. Step 5, the Times screen re-plan (U4, U5, U6, U7 and the `Glyph`, `TownChip` and two-tone `Notice` components), is built; the first review of it came back not ready and the fixes landed in D-033, measured in `tests/e2e/hero.test.ts` and recommitted with fresh screenshots. Step 6, the Settings restructure (U8, U9, U10, U11, U13 with `Row`, `Sheet`, `ChoiceRow`, `Segmented` and `Notice`), is built and documented in D-034; the first review of it came back not ready, and D-035 records the fix (one line rows at 56 to 64 pixels, a heading only over two or more rows, each method once, Play beside the Sound title), measured in `tests/e2e/settings-rows.test.ts`. Step 7, the badge and reminders (`PLAN.md` §7), is built and documented in D-036: the toolbar badge, the Reminder before prayer row and sheet, the Suhoor reminder row and sheet, the three new alarm names parsed strictly, and the two P3 fixes from the Step 6 PASS review (the short Disclaimer value, and the switch row padding). Step 8, the rest of the first-run journey (`PLAN.md` §6.3), is built and documented in D-038: the six step sequence (welcome, disclaimer, school, madhab, location, method, alerts), the language choice, and the Step 5 and 6 components reused for the method and alert steps; every step fits the 380 by 600 popup, measured in `tests/e2e/first-run.test.ts`. See D-032 for the deliberate deviations from the plan and the phone specs, D-033 for what the review changed, and D-038 for the `sajdatime.setup.v1` draft key. The review of Step 8 came back with five findings, all fixed in D-039: the focus ring that Chrome drew round every heading a step opened, method rows that were not named after their method, "Suggested for United Kingdom" without its "the", the two method buttons wrapping onto two lines, and the popup width test that failed only inside the full suite. Part A of four is that fix. Save as PDF, five languages with right-to-left layout, and the store preparation follow in the same session as Parts B, C and D. The brief builds the remaining steps one at a time, with a review between each:

- Add the store screenshots and the final listing, then hand Ali the submission checks.

**Resolved in Step 6:** every card surface now uses the section 1.2 shadow and border split through `.group-card` (light shadow and no border, dark one pixel outline and no shadow); `.times` keeps its hairline in both themes. The theme selector still has no hint line, because the brief gives no words for one. With an explicit Light or Dark choice on the opposite operating system, the empty window can show the operating system background for the storage read; content never paints in the wrong theme (see D-031).

## How to pick this up

```bash
git clone https://github.com/aliimrankhan86/sajdatime-extension.git
cd sajdatime-extension
npm ci
npm run check
npm run test:e2e
```

`npm run test:e2e` leaves `docs/images` untouched. To refresh the screenshots, run `SAJDATIME_SCREENSHOTS=1 npm run test:e2e`, then commit the images.

The code lives at `https://github.com/aliimrankhan86/sajdatime-extension` on `main`, public. Do not rebuild it from `/tmp`. `tests/e2e/extension.ts` finds Chrome for Testing by itself through `SAJATIME_CHROME` or Playwright's cache; there is no hard-coded browser path to change.

## What Ali needs to do

1. Look at the screenshots and say whether the popup and Settings feel right.
2. Later: open the Edge Partner Center account when the Chrome build is close to submission.
3. At submission: press Submit and Publish himself, after reading the listing and the privacy answers.

Do not ask him to test by hand. Automated browser checks are the agreed testing method. Bring him screenshots and plain words.
