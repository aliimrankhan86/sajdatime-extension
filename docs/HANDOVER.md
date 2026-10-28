# Handover

**Updated:** 28 October 2026, Europe/London.

This file says what is true now. It is written for the next person or AI who opens the repository. Read it before the plan. The plan describes the whole build. This file describes the part that exists.

## Where this is

The repository was empty on 27 October 2026. It now has a working scaffold, a tested prayer engine, a Times popup, city search, a Settings screen, a location step that names the town it found and confirms it, optional prayer alerts from a background worker, Ramadan labels for Suhoor and Iftar, and one brand mark on every screen including both Location states. It is **not in any store**. Version 0.1.0 in the manifest is a development version.

The Chrome Web Store developer account is open. The Edge Partner Center account is not. Ali opens accounts and presses Submit. Nobody else handles his credentials or payment.

An independent review brief for this commit is in [`docs/REVIEW-REQUEST.md`](REVIEW-REQUEST.md). It lists the commands, the screenshots, the open design questions and the gaps that are already known. Give it to a reviewer before asking for a verdict.

## What works, with evidence

| Area | State | Evidence |
| --- | --- | --- |
| Manifest V3 extension | Loads in Chrome for Testing | Playwright launches it with `--load-extension=dist` and finds the popup |
| Prayer engine | 13 methods, both Asr schools, polar projection and correction clamp, Shia Maghrib from the Twilight Angle cap exactly as the phone does it, so a normal Shia day above 60 degrees is not projected | `npm test`: 250 unit tests pass |
| Golden values | Six phone fixtures pinned, plus 13 broad Aladhan sanity fixtures | `tests/unit/engine.test.ts`, `tests/unit/aladhan.test.ts` |
| Hijri calendar | Umm al-Qura, shift, Ramadan windows, Eids | `tests/unit/hijri.test.ts` |
| Ramadan card | Inside Ramadan, Fajr reads "Suhoor ends" and Maghrib "Iftar", the hero and countdown follow ("until suhoor ends", "until you break your fast"), and the Hijri date already names the day; a "Ramadan" group in Settings holds one switch, on by default | `tests/e2e/ramadan.test.ts`, `docs/images/times-ramadan-light.png`, `docs/images/times-ramadan-dark.png` |
| Notices | A closable coming notice shows the one, two and three days before Ramadan, and an Eid notice on the two Eids, one at a time between the header and the hero; closing persists per Ramadan or Eid | `tests/e2e/notices.test.ts`, `docs/images/times-coming-light.png`, `docs/images/times-coming-dark.png`, `docs/images/times-eid-light.png`, `docs/images/times-eid-dark.png` |
| Method suggestion | Country table and Shia rule | `tests/unit/suggestions.test.ts` |
| City search | Offline GeoNames city list, search and pick; the most populous city within 15 kilometres names a place the browser located, with "Near" past 50 kilometres | `tests/unit/cities.test.ts`, `tests/unit/place.test.ts`, Playwright first-run test |
| Popup | Place chip, Hijri date, next prayer on the fixed hero-gradient card, countdown with its note on one line, five day bars, six time rows with a glyph each, a two-tone Notice between the header and the hero, the footer Settings button and the worked-out line, a fixed 380 pixel width, the real toolbar popup measured at 380 by 600, 200 percent zoom, and no scroll in any state in either theme | Playwright screenshots and 70 end-to-end tests |
| First run | Use my location names the town and confirms it before going on, city search, method suggestion from the country, save on Continue, show times | Playwright tests with a supplied geolocation fix |
| Settings | Place change, School (Sunni or Shia), method, Asr school, Hijri shift, Ramadan card, disclaimer, privacy link, keyboard focus and Escape | Playwright tests |
| Alerts | Off by default; a background worker schedules one alarm per prayer plus a daily refresh, fires a notification, and plays the beep or the adhan through one offscreen page; five-minute late drop; Stop sound; test alert; blocked notice when the browser denies notifications; the Play button returns to Play when a sound ends and a replaced sound never reports its end; the worker owns only prayer and refresh alarms, so the 60 second self-clear survives a rebuild | `tests/unit/alerts.test.ts`, `tests/unit/messages.test.ts`, `tests/e2e/alerts.test.ts` |
| Light and dark | Both themes from `tokens.css`, WCAG AA contrast pairs | `tests/unit/contrast.test.ts`, `docs/images/times-dark.png`, `docs/images/settings-dark.png` |
| Accessibility | Keyboard focus moves into full screens and returns, every control has a 44 pixel target, axe finds no WCAG 2.2 AA violation | `tests/e2e/a11y.test.ts`, `tests/e2e/design.test.ts` |
| No network | No request leaves the extension while it shows times | Playwright request listener |
| Security | Manifest locked to `alarms`, `notifications`, `storage`, `offscreen` and `geolocation` with a strict content security policy, a checked message handler that ignores non-extension senders, no `eval`, no remote URL, no HTML insertion, no `console.log` in the bundle, every new tab link `noopener noreferrer` | `tests/unit/manifest.test.ts`, `tests/unit/messages.test.ts`, `tools/check-bundle.mjs`, `tests/e2e/alerts.test.ts` |
| Build | Production bundle in `dist/` | `npm run build` |
| TypeScript | Strict, no errors | `npm run typecheck` |

Commands actually run on 27 October 2026:

```text
npm run typecheck    pass
npm test             14 files, 250 tests passed
npm run build        pass, dist/manifest.json, the popup bundle, the background worker and the offscreen page written
npm run test:e2e     72 tests passed
node tools/check-bundle.mjs  pass, 7 bundle files and the source clean
```

The 72 end-to-end tests cover the popup, Settings and Location, the design foundation, the notices and their fit, Ramadan, axe accessibility in both themes, School suggestions, theme choice, the word check, alerts, city search, one real action popup measurement, and the Step 5 review fixes measured in `tests/e2e/hero.test.ts` (header, hero paint order, bars, countdown shape, hierarchy, compact hero and the 600 px fit in all four states). They run in Chrome for Testing at:

```text
/Users/aliimrankhan/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
```

That path is one example of where Playwright keeps Chrome for Testing. `tests/e2e/extension.ts` resolves the browser itself from `SAJATIME_CHROME`, `chromium.executablePath()` or the Playwright cache, so a fresh machine needs no edit.


## What is not built

- The full first run journey: the school and madhab steps, a language choice and the six-step sequence in the plan.
- The countdown badge and a reminder before each prayer.
- The suhoor timer and the timetable page.
- Urdu, Arabic, Turkish and Indonesian, with right-to-left layout and the Arabic Western-digit rule.
- Store screenshots, the final listing, and the zipped builds. Review screenshots exist in `docs/images/` but are not the store set.
- A second browser test for Edge. Playwright cannot load an extension into Edge, so Edge gets a manual load and a short check later.
- An automated GitHub Actions workflow. The file exists locally at `.github/workflows/ci.yml` but is not in the repository: this Mac's GitHub login lacks the `workflow` scope, and the keyring refused the refresh. The local checks above are the evidence for now. After `gh auth refresh -s workflow` succeeds in a normal Terminal, remove the path from `.git/info/exclude`, commit the workflow and push it. Do not claim CI is green before it has actually run.

## Known gaps in what was tested

- The real browser permission bubble for geolocation is not automated. The end-to-end test supplies a known fix through `navigator.geolocation` and checks that the extension saves it. The banner and the real prompt still need a manual look.
- The zoom tests used to fake 150 and 200 percent zoom by shrinking the viewport to 253 and 190 pixels. Chrome does not shrink a popup's viewport on zoom; it enlarges the window and keeps 380 CSS pixels. Both zoom tests now set `deviceScaleFactor: 2` on a 380 by 600 viewport and check that nothing clips, the countdown stays on one line and every control keeps its 44 CSS pixel target. Sizes a user could get from a resized window, and Windows display scaling, are not tested yet.
- Zoom is tested at 200 percent only. Above about 210 percent, 380 CSS pixels at that zoom is more than the 800 pixel width Chrome allows an action popup, so the page may need sideways scrolling. The layout is not changed for it, and that range is not tested.
- **Lesson, 27 October 2026: `max-width: 100vw` on a popup collapses it, and only a real-popup measurement catches it.** While Chrome sizes an action popup its viewport starts tiny, so `100vw` shrinks the body to match. The first width fix (`width: 100%` with `max-width: 380px`) opened the real popup at about 147 pixels, and the second (`width: 380px` with `max-width: 100vw`) at about 25 pixels, neither of which any tab-based test could see. `tests/e2e/popup-width.test.ts` now opens the real toolbar popup in headful Chrome for Testing over a remote debugging port and reads the window size, the body width and the Settings button straight from the DevTools protocol. It fails against both earlier CSS states, so it cannot pass for the wrong reason. A tab is not a popup.
- No screen reader was run against the popup. axe reports no WCAG 2.2 AA violation on Times, first run, Settings and Location in light and dark, but axe cannot judge reading order, announcement quality or whether a real screen reader makes sense of the page.
- Windows, Edge and a real user's Chrome profile are not tested. The suite runs on macOS with Chrome for Testing. Edge gets a manual load and a short check later.
- The first run uses the computer's time zone when it reads the browser's location. A city chosen by name uses the city's own time zone.
- City search matches Latin names only, and a place found by the browser is named by the nearest Latin city name in the same file. Urdu and Arabic names, local regions and a street address are not built.
- Only English exists. No language switcher, no right-to-left test.
- The alert end-to-end test asserts the worker schedules and clears alarms, but it does not play sound and assert the audio. The beep and the two adhan recordings play through the offscreen page and are not captured by the test. The worker schedules against the real wall clock while the popup tests use Playwright's faked clock, so the test asserts a refresh alarm and prayer-named alarms exist and clear, not exact counts.
- The Settings screen has a disclaimer, place, method, Asr school, Hijri shift, the Ramadan group and the Alerts group (master switch, five prayer switches, sound choice, Play and a test alert). It does not yet have language, theme or the full About page.
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

Steps 2, 3a, 3b and 4 of [`docs/BUILD-NEXT.md`](BUILD-NEXT.md) and [`docs/UX-PLAN.md`](UX-PLAN.md) are built. Step 5, the Times screen re-plan (U4, U5, U6, U7 and the `Glyph`, `TownChip` and two-tone `Notice` components), is built; the first review of it came back not ready and the fixes landed in D-033, measured in `tests/e2e/hero.test.ts` and recommitted with fresh screenshots. See D-032 for the deliberate deviations from the plan and the phone specs, and D-033 for what the review changed. The brief builds the remaining steps one at a time, with a review between each:

- Step 6: Settings, with the theme selector's final place and any unified card surfaces.
- Then the rest of the first-run journey in `docs/PLAN.md`: the school and madhab steps, a language choice and the six-step sequence. Keep the Times popup unchanged while those screens are built.
- Add the store screenshots and the final listing, then hand Ali the submission checks.

Do not start Step 6 until Step 5 is reviewed again and Ali is happy with the screenshots. The worker is written once, against the stable `alerts` settings shape; the badge, the suhoor timer and reminders stay deferred.

**Known in Step 5, carried forward:** only `.next-card` gets the section 1.2 shadow and border split, and `.times` keeps the hairline in both themes, so the other card surfaces stay un-unified until Step 6. The theme selector still has no hint line, because the brief gives no words for one. With an explicit Light or Dark choice on the opposite operating system, the empty window can show the operating system background for the storage read; content never paints in the wrong theme (see D-031).

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
