# Handover

**Updated:** 27 October 2026, morning, Europe/London.

This file says what is true now. It is written for the next person or AI who opens the repository. Read it before the plan. The plan describes the whole build. This file describes the part that exists.

## Where this is

The repository was empty on 27 October 2026. It now has a working scaffold, a tested prayer engine, and a Times popup that opens in Chrome. It is **not in any store**. Version 0.1.0 in the manifest is a development version.

The Chrome Web Store developer account is open. The Edge Partner Center account is not. Ali opens accounts and presses Submit. Nobody else handles his credentials or payment.

## What works, with evidence

| Area | State | Evidence |
| --- | --- | --- |
| Manifest V3 extension | Loads in Chrome for Testing | Playwright launches it with `--load-extension=dist` and finds the popup |
| Prayer engine | 13 methods, both Asr schools, polar safety | `npm test`: 33 unit tests pass |
| Golden values | Four phone fixtures pinned | `tests/unit/engine.test.ts` |
| Hijri calendar | Umm al-Qura, shift, Ramadan windows, Eids | `tests/unit/hijri.test.ts` |
| Method suggestion | Country table and Shia rule | `tests/unit/suggestions.test.ts` |
| Popup | Place, Hijri date, next prayer, countdown, six times | Playwright screenshot and four end-to-end tests |
| First run | Location, method suggestion, save, show times | Playwright test with a supplied fix |
| Light and dark | Both themes from `tokens.css` | Screenshots in `docs/images/` |
| Build | Production bundle in `dist/` | `npm run build` |
| TypeScript | Strict, no errors | `npm run typecheck` |

Commands actually run on 27 October 2026:

```text
npm run typecheck    pass
npm test             3 files, 33 tests passed
npm run build        pass, dist/manifest.json and the popup bundle written
npm run test:e2e     4 tests passed
```

The end-to-end suite uses Chrome for Testing at:

```text
/Users/aliimrankhan/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
```

That path is machine-specific. Change it in `tests/e2e/extension.ts` if the browser moves.

## What is not built

- A settings screen, city search, and changing the place after first run.
- Prayer alerts, the countdown badge, offscreen audio and the late-alarm rule.
- Ramadan notices, the suhoor timer, Eid notices and the timetable page.
- Urdu, Arabic, Turkish and Indonesian, with right-to-left layout and the Arabic Western-digit rule.
- Store screenshots, the final listing, the hosted privacy URL and the zipped builds.
- A second browser test for Edge. Playwright cannot load an extension into Edge, so Edge gets a manual load and a short check later.

## Known gaps in what was tested

- The real browser permission bubble for geolocation is not automated. The end-to-end test supplies a known fix through `navigator.geolocation` and checks that the extension saves it. The banner and the real prompt still need a manual look.
- The popup was tested at exactly 380 by 600. Other window sizes and 200 percent zoom are not tested yet.
- The first run uses the computer's time zone. A city search later will use the city's zone.
- Only English exists. No language switcher, no right-to-left test.
- No accessibility audit yet. The markup uses real buttons and labels, but axe and a screen reader have not run.
- The service worker is nearly empty by design. Do not treat its presence as proof that alarms work.

## Decisions that must not be undone by accident

Read `docs/DECISIONS.md`. The four that matter most:

1. This is a separate product from the phone. Do not copy the phone's release notes or store listing into this repo.
2. High latitude uses `TwilightAngle`, not `recommended`. The plan's line about `recommended` is older than the phone behaviour and would break the London fixtures.
3. Golden values are the phone engine's values, not the Aladhan numbers in the phone's test file.
4. No network requests. No host permissions. The privacy words must stay true.

## Next step

The next milestone is the settings and first-run completion step in `docs/PLAN.md`:

- Add **Search for a city** beside **Use my location**.
- Add the settings sheet: method, madhab, alert choice, Hijri shift, language, theme, about.
- Put the religious disclaimer in About, first row, with all four substance points and the final dua request.
- Keep the Times popup unchanged while those screens are built.

Do not start alarms or the badge until the settings can save an alert choice. The worker should be written once, against a stable settings shape.

## How to pick this up

```bash
cd /tmp/sajdatime-extension
npm_config_cache=/tmp/npm-cache npm run check
npm_config_cache=/tmp/npm-cache npm run test:e2e
```

The extension source is in `/tmp` at the moment. Push it to `https://github.com/aliimrankhan86/sajdatime-extension` so it survives a temporary folder cleanup. The remote is public. The initial scaffold should be the first commit.

## What Ali needs to do

1. Nothing right now except look at the screenshots and say whether the popup feels right.
2. Later: open the Edge Partner Center account when the Chrome build is close to submission.
3. At submission: press Submit and Publish himself, after reading the listing and the privacy answers.

Do not ask him to test by hand. Automated browser checks are the agreed testing method. Bring him screenshots and plain words.
