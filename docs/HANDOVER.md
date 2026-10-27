# Handover

**Updated:** 27 October 2026, late afternoon, Europe/London.

This file says what is true now. It is written for the next person or AI who opens the repository. Read it before the plan. The plan describes the whole build. This file describes the part that exists.

## Where this is

The repository was empty on 27 October 2026. It now has a working scaffold, a tested prayer engine, a Times popup, city search and a Settings screen. It is **not in any store**. Version 0.1.0 in the manifest is a development version.

The Chrome Web Store developer account is open. The Edge Partner Center account is not. Ali opens accounts and presses Submit. Nobody else handles his credentials or payment.

An independent review brief for this commit is in [`docs/REVIEW-REQUEST.md`](REVIEW-REQUEST.md). It lists the commands, the screenshots, the open design questions and the gaps that are already known. Give it to a reviewer before asking for a verdict.

## What works, with evidence

| Area | State | Evidence |
| --- | --- | --- |
| Manifest V3 extension | Loads in Chrome for Testing | Playwright launches it with `--load-extension=dist` and finds the popup |
| Prayer engine | 13 methods, both Asr schools, polar projection and correction clamp, Shia Maghrib from a separate Twilight Angle pass so a normal Shia day above 60 degrees is not projected | `npm test`: 82 unit tests pass |
| Golden values | Four phone fixtures pinned, plus 13 broad Aladhan sanity fixtures | `tests/unit/engine.test.ts`, `tests/unit/aladhan.test.ts` |
| Hijri calendar | Umm al-Qura, shift, Ramadan windows, Eids | `tests/unit/hijri.test.ts` |
| Method suggestion | Country table and Shia rule | `tests/unit/suggestions.test.ts` |
| City search | Offline GeoNames city list, search and pick | `tests/unit/cities.test.ts`, Playwright first-run test |
| Popup | Place, Hijri date, next prayer, countdown, six times, 190 and 253 pixel viewports, visible Settings button, explicit Next and Now pills | Playwright screenshots and 25 end-to-end tests |
| First run | Location, city search, method suggestion, save, show times | Playwright tests with a supplied geolocation fix |
| Settings | Place change, method, Asr school, Hijri shift, disclaimer, privacy link, keyboard focus and Escape | Playwright tests |
| Light and dark | Both themes from `tokens.css`, WCAG AA contrast pairs | `tests/unit/contrast.test.ts`, `docs/images/times-dark.png`, `docs/images/settings-dark.png` |
| Accessibility | Keyboard focus moves into full screens and returns, every control has a 44 pixel target, axe finds no WCAG 2.2 AA violation | `tests/e2e/a11y.test.ts`, `tests/e2e/design.test.ts` |
| No network | No request leaves the extension while it shows times | Playwright request listener |
| Build | Production bundle in `dist/` | `npm run build` |
| TypeScript | Strict, no errors | `npm run typecheck` |

Commands actually run on 27 October 2026:

```text
npm run typecheck    pass
npm test             7 files, 82 tests passed
npm run build        pass, dist/manifest.json and the popup bundle written
npm run test:e2e     25 tests passed
```

The 25 end-to-end tests are six Settings and state tests, six design and responsive tests, three axe tests and ten original popup tests. They run in Chrome for Testing at:

```text
/Users/aliimrankhan/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
```

That path is one example of where Playwright keeps Chrome for Testing. `tests/e2e/extension.ts` resolves the browser itself from `SAJATIME_CHROME`, `chromium.executablePath()` or the Playwright cache, so a fresh machine needs no edit.


## What is not built

- The full first run journey: the school and madhab steps, a language choice and the six-step sequence in the plan.
- Prayer alerts, the countdown badge, offscreen audio and the late-alarm rule.
- Ramadan notices, the suhoor timer, Eid notices and the timetable page.
- Urdu, Arabic, Turkish and Indonesian, with right-to-left layout and the Arabic Western-digit rule.
- Store screenshots, the final listing, and the zipped builds. Review screenshots exist in `docs/images/` but are not the store set.
- A second browser test for Edge. Playwright cannot load an extension into Edge, so Edge gets a manual load and a short check later.
- An automated GitHub Actions workflow. The file exists locally at `.github/workflows/ci.yml` but is not in the repository: this Mac's GitHub login lacks the `workflow` scope, and the keyring refused the refresh. The local checks above are the evidence for now. After `gh auth refresh -s workflow` succeeds in a normal Terminal, remove the path from `.git/info/exclude`, commit the workflow and push it. Do not claim CI is green before it has actually run.

## Known gaps in what was tested

- The real browser permission bubble for geolocation is not automated. The end-to-end test supplies a known fix through `navigator.geolocation` and checks that the extension saves it. The banner and the real prompt still need a manual look.
- The popup was tested at 380 by 600, 253 by 600 (150 percent zoom) and 190 by 600 (200 percent zoom). The 190 pixel test proves no horizontal scroll and no control outside the viewport, but it is a layout emulation, not a real browser zoom. Sizes a user could get from a resized window, and Windows display scaling, are not tested yet.
- No screen reader was run against the popup. axe reports no WCAG 2.2 AA violation on Times, first run, Settings and Location in light and dark, but axe cannot judge reading order, announcement quality or whether a real screen reader makes sense of the page.
- Windows, Edge and a real user's Chrome profile are not tested. The suite runs on macOS with Chrome for Testing. Edge gets a manual load and a short check later.
- The first run uses the computer's time zone when it reads the browser's location. A city chosen by name uses the city's own time zone.
- City search matches Latin names only. Urdu and Arabic names, local regions and a "near" label for remote places are not built.
- Only English exists. No language switcher, no right-to-left test.
- The service worker is nearly empty by design. Do not treat its presence as proof that alarms work.
- The Settings screen has a disclaimer and place, method, Asr school and Hijri shift. It does not yet have language, theme, alert choice or the full About page.
- The screenshots are review evidence, not the final store set. `docs/store/` still has placeholders.
- The review also flagged, left for later: the Isha row shows tonight's time with a "Now" pill in the small hours; the default method survives a place change when the user never chose it; an Arabic browser shows Arabic meridian words beside English labels; and the polar note does not name the latitude it borrowed. Each is a known, recorded P2, not a hidden defect.


## Decisions that must not be undone by accident

Read `docs/DECISIONS.md`. The five that matter most:

1. This is a separate product from the phone. Do not copy the phone's release notes or store listing into this repo.
2. High latitude uses `TwilightAngle`, not `recommended`. The plan's line about `recommended` is older than the phone behaviour and would break the London fixtures.
3. Golden values are the phone engine's values, not the Aladhan numbers in the phone's test file.
4. No network requests. No host permissions. The privacy words must stay true. The manifest asks only for `storage` and `geolocation` until an alert exists.
5. City data is bundled and fetched from the extension, never from the internet. It is GeoNames `cities5000` under CC BY 4.0.

## Next step

The next milestone is the full first-run journey and the rest of Settings in `docs/PLAN.md`:

- Add the school and madhab steps, a language choice and the six-step sequence to the first run.
- Add language, theme and alert choice to Settings once an alert exists.
- Keep the Times popup unchanged while those screens are built.
- Add the store screenshots and the final listing, then hand Ali the submission checks.

Do not start alarms or the badge until the settings can save an alert choice. The worker should be written once, against a stable settings shape.

## How to pick this up

```bash
git clone https://github.com/aliimrankhan86/sajdatime-extension.git
cd sajdatime-extension
npm ci
npm run check
npm run test:e2e
```

The code lives at `https://github.com/aliimrankhan86/sajdatime-extension` on `main`, public. Do not rebuild it from `/tmp`. `tests/e2e/extension.ts` finds Chrome for Testing by itself through `SAJATIME_CHROME` or Playwright's cache; there is no hard-coded browser path to change.

## What Ali needs to do

1. Look at the screenshots and say whether the popup and Settings feel right.
2. Later: open the Edge Partner Center account when the Chrome build is close to submission.
3. At submission: press Submit and Publish himself, after reading the listing and the privacy answers.

Do not ask him to test by hand. Automated browser checks are the agreed testing method. Bring him screenshots and plain words.
