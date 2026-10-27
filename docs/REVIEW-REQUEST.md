# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `515731e` on `main`. Shia Maghrib code last changed in `f964ee8`; `515731e` only corrected the notes.
**Previous reviews:** `fab4abb`; then `eeac1ad`, which fixed the three P1s from the first pass; then `cb92544`, which did the P2s; then `ebcc4e0`, which applied Ali's ruling on the open P1; then the true-angle build and its third-pass fixes; then `f964ee8`, which reversed the true-angle ruling and was judged READY with two P2 fixes to the notes. This commit applies those two P2 fixes and makes the Shia Maghrib match the phone everywhere except the two small differences listed in `DECISIONS.md`.
**Date:** 27 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

A Manifest V3 browser extension, Chrome first and Edge later. It shows today's six prayer times for a saved place, the next prayer with a countdown, the Hijri date, and a small Settings screen. It is a separate product from the Android app. Do not review it as a port of `SajdaTime` and do not copy phone release notes or store copy into it.

There is no account, no ad, no analytics, no host permission, no content script and no runtime network request. Location is handled on the computer. The full intent is in [`docs/PLAN.md`](PLAN.md). Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md). If the plan and a decision disagree, the decision wins. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this fix commit changed

The previous build used the raw true angle for the Shia (Jafari and Tehran) Maghrib
whenever the sun reached it before Isha. The review measured that angle jumping about
45 minutes between neighbouring days, landing one minute before Isha, and putting Jafari
after Tehran at Anchorage. This commit reverts to the Twilight Angle cap the phone
ships, so the two products agree everywhere except the two small differences listed in `DECISIONS.md`.

- **Shia Maghrib is the cap.** `src/core/engine.ts` reads Jafari (4 degrees) and Tehran
  (4.5 degrees) Maghrib from a separate Isha-only pass with the Twilight Angle rule,
  exactly as the phone does: the true twilight when the sun reaches it early, and sunset
  plus `angle / 60` of the night otherwise. The true-angle probe and its before-Isha
  guard are gone. The main day check still sees sunset, so a normal Shia day above 60
  degrees is not projected.
- **Regression evidence.** Unit tests pin Oslo, Trondheim, Tampere, Manchester and
  Anchorage to the phone's Java probe values, and a sweep from 50 to 66 degrees across
  all of 2026 asserts Maghrib before Isha, Jafari no later than Tehran, and a daily
  Maghrib move of at most 10 minutes.
- **Docs.** `DECISIONS.md` D-002 records the reversal and the measured faults of the
  true angle. `HANDOVER.md`, this file and the probe README no longer describe a "Shia
  difference from the phone". `docs/PHONE-FOLLOW-UP.md` is deleted: there is no longer a
  phone change to hand over.

## The reversal, made

The true-angle ruling from the previous round is reversed. The measured faults that
ended it: Tampere, Jafari jumped from 00:04 on 9 June to 23:25 on 12 June, about 45
minutes across neighbouring days; Anchorage, Jafari on 21 June landed at 00:47, one
minute before Isha at 00:48; and Anchorage, Jafari came after Tehran (00:47 against
00:04), which is impossible in the sky. The true angle also matched no standard
reference and would have moved Maghrib for existing users. The Twilight Angle cap the
phone ships is smooth and is what Aladhan gives with its default angle-based setting,
so the extension now matches the phone everywhere except the two small differences listed in `DECISIONS.md`. The full reasoning and the rejected
option are recorded in `DECISIONS.md` D-002.

## What to run

Node 24 and npm 11 were used. Chrome for Testing is needed because branded Chrome refuses an unpacked extension in this setup.

```bash
git clone https://github.com/aliimrankhan86/sajdatime-extension.git
cd sajdatime-extension
npm ci
npm run check
npm run test:e2e
```

`npm run check` runs strict TypeScript, Vitest and a production build. `npm run test:e2e` builds `dist` and drives the loaded extension with Playwright. It finds Chrome for Testing through `SAJATIME_CHROME` or Playwright's cache. If neither exists, set `SAJATIME_CHROME` to a Chrome for Testing binary.

To look by hand, open `chrome://extensions`, enable Developer mode, choose **Load unpacked** and pick `dist/`. The popup is 380 by 600. Settings is the green button in the header.

## What to judge

1. **The Shia fix in the code.** Read `src/core/engine.ts` and `src/core/methods.ts` against the phone's `PrayerEngine.kt`. Check that the main day check sees sunset, that the second pass uses the same latitude, that the 4 and 4.5 degree values are right, and that nothing in the ordinary day uses a `maghribAngle`. Look for a remaining path where a Shia day is projected or falls back to sunset.
2. **Design against the brief.** Quiet Glass tokens, 380 by 600 popup, spacing, type hierarchy, the solid green action button with bold white text, no two icon buttons side by side, a close control on every dismissable screen, times in tabular numerals, nothing below 14 pixels, targets at least 44 pixels. The plan's section 3 and section 6 are the written brief.
3. **The Times screen in every state.** First open, next prayer today, next prayer tomorrow after Isha, a current prayer that is not the next one, sunrise as a quieter row, a polar estimate, a very long place name, 12-hour and 24-hour browser languages, 150 and 200 percent zoom, light and dark.
4. **First run and Settings.** Whether the words are plain and true, whether the location flow is understandable without a manual, whether Settings preserves a deliberately chosen method when the place changes, and whether the disclaimer is intact and readable. The disclaimer must never be removed, softened or hidden.
5. **Accessibility.** axe is not a screen reader. Check the tab order, the heading focus, Escape, the `aria-current` value, the live city hint and whether the visible pills match what is announced. Check the new `aria-disabled` controls still behave for keyboard and pointer, and that focus does not move during a save.
6. **Correctness and privacy in the code.** The engine mirrors the phone's high-latitude rule, the projection to the signed reference latitude, the Ramadan Isha adjustment, manual corrections last and the ascending clamp. The manifest should still ask only for `storage` and `geolocation`. There should be no `fetch` to a remote host, no remote code and no content script.
7. **Test quality.** Look for tests that only assert the code's own output, tests that pass for the wrong reason, and state that is not covered. The engine fixtures are the phone's values, not Aladhan's, except the broad sanity fixtures. The high-latitude Shia values were produced with the phone's Java adhan library, not by running the extension.
8. **Documentation accuracy.** If a claim in `HANDOVER.md` is not true of this commit, that is a finding.

## Evidence in this commit

`npm run check`: 7 unit files, 85 tests passed, strict typecheck passed, production build passed.
`npm run test:e2e`: 25 tests passed.

| Test file | What it covers |
| --- | --- |
| `tests/unit/engine.test.ts` | Phone fixtures, including the five high-latitude Shia cases, polar projection and correction clamp |
| `tests/unit/aladhan.test.ts` | 13 broad independent sanity fixtures |
| `tests/e2e/popup.test.ts` | Times, 253 pixel viewport, countdown tick, 12-hour language, tomorrow Fajr, first run wording, Makkah fallback, Settings, city search, method persistence |
| `tests/e2e/audit.test.ts` | Asr school, method change, place change, dark link contrast, keyboard focus and Escape, focus after a save |
| `tests/e2e/design.test.ts` | Now and Next pills, Next row has no `aria-current`, 44 pixel controls, 190 pixel reflow, dark flat card, no network request |
| `tests/e2e/a11y.test.ts` | axe 4.14, WCAG 2.2 AA tags, Times, Settings, Location and first run, light and dark |
| `tests/unit/contrast.test.ts` | 14 token pairs, including the hero gradient stops and the focus ring |

## Screenshots

These are review evidence at 380 by 600, not the final store set.

![Times, light](images/times-light.png)
![Times, dark](images/times-dark.png)
![Settings, light](images/settings-light.png)
![Settings, dark](images/settings-dark.png)
![First run, light](images/first-run-light.png)
![Times at 150 percent zoom](images/zoom-253.png)
![Times at 200 percent zoom](images/zoom-190.png)
![Settings at 200 percent zoom](images/settings-zoom-190.png)

The 190 pixel Settings screenshot is deliberately tall. It shows the stacked school and Hijri controls, and the native select truncating the longest method name. Judge whether that is acceptable at that zoom, not as the normal layout.

## Known gaps, do not report as new

- The Times header is the scaffold version: a word mark and a Settings pill, not the plan's 32 pixel logo, Gregorian date over the Hijri date, and town chip with pin and refresh. The footer is one line, not the two solid buttons. The next card has no glyph and no five prayer bars.
- The next card uses a 28 pixel name and time with a 22 pixel countdown. The plan's type table says a 46 pixel countdown. The previous review accepted the compact card; Ali also accepted it. Do not reopen it unless it causes a real usability fault.
- The full first run is not built. There is one location step and a city search. The school, madhab, language and six-step sequence are later milestones. The first-run pick always starts Sunni and suggests a method from the country.
- No alarms, badge, notifications, offscreen audio, Ramadan notices, suhoor, Eid, PDF timetable, Qibla or full About page.
- English only. No language switcher and no right-to-left layout yet. A remaining recorded P2: an Arabic browser shows Arabic meridian words beside the English labels. The digits are not yet forced to Latin.
- City search matches Latin names only.
- A remaining recorded P2: after midnight the Isha row still shows tonight's time with a "Now" pill.
- A remaining recorded P2: the default method survives a place change if the user never chose one.
- A remaining recorded P2: the polar note does not name the latitude it borrowed.
- No Edge run, no Windows run and no real screen reader run. These are stated limits.
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
