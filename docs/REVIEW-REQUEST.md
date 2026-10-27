# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `c3f39e5`.
**Date:** 27 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

A Manifest V3 browser extension, Chrome first and Edge later. It shows today's six prayer times for a saved place, the next prayer with a countdown, the Hijri date, and a small Settings screen. It is a separate product from the Android app. Do not review it as a port of `SajdaTime` and do not copy phone release notes or store copy into it.

There is no account, no ad, no analytics, no host permission, no content script and no runtime network request. Location is handled on the computer. The full intent is in [`docs/PLAN.md`](PLAN.md). Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md). If the plan and a decision disagree, the decision wins. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this commit changed

It is a design and accessibility audit, not a feature release.

- `Next` and `Now` became real text in the row. Before, `Now` was a CSS `::after`, so a screen reader never heard it. The current row now carries `aria-current="time"`.
- Opening Settings or Location moves focus to its heading. Escape closes the current screen. Focus returns to the Settings button or to Change. Before, focus fell to `<body>` and Escape did nothing.
- The row, the next-prayer row and the place row wrap at 190 pixels. The Asr segmented control and the Hijri stepper stack there. Nothing sits outside the viewport at 200 percent zoom.
- The Hijri date uses a darker token over the warm end of the gradient. It was 3.84:1, below WCAG AA.
- Links use `--primary` and are underlined. `--primary-strong` was 3.76:1 on the dark surface.
- Sunrise is one type step smaller, 15 pixels instead of 16, per the design brief.
- The current row uses `--surface-soft`, the next row keeps its fill and 3 pixel bar, and the dark next card is flat to match the phone.
- City search has `aria-describedby` for its hint, and `aria-controls` is only present when the result list is. The duplicate hidden loading status is gone.
- The disclaimer summary is at least 44 pixels tall and has a gap after its title, so it no longer reads `DisclaimerA helper`.
- The dark Settings card has no shadow.

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

1. **Design against the brief.** Quiet Glass tokens, 380 by 600 popup, spacing, type hierarchy, the solid green action button with bold white text, no two icon buttons side by side, a close control on every dismissable screen, times in tabular numerals, nothing below 14 pixels, targets at least 44 pixels. The plan's section 3 and section 6 are the written brief.
2. **The Times screen in every state.** First open, next prayer today, next prayer tomorrow after Isha, a current prayer that is not the next one, sunrise as a quieter row, a polar estimate, a very long place name, 12-hour and 24-hour browser languages, 150 and 200 percent zoom, light and dark.
3. **First run and Settings.** Whether the words are plain and true, whether the location flow is understandable without a manual, whether Settings preserves a deliberately chosen method when the place changes, and whether the disclaimer is intact and readable. The disclaimer must never be removed, softened or hidden.
4. **Accessibility.** axe is not a screen reader. Check the tab order, the heading focus, Escape, the `aria-current` value, the live city hint and whether the visible pills match what is announced. Look for anything axe cannot see: reading order, repeated announcements, focus visible against every surface.
5. **Correctness and privacy in the code.** The engine mirrors the phone's high-latitude rule, the projection to the signed reference latitude, the Ramadan Isha adjustment, manual corrections last and the ascending clamp. The manifest should still ask only for `storage` and `geolocation`. There should be no `fetch` to a remote host, no remote code and no content script.
6. **Test quality.** Look for tests that only assert the code's own output, tests that pass for the wrong reason, and state that is not covered. The engine fixtures are the phone's values, not Aladhan's, except the broad sanity fixtures.
7. **Documentation accuracy.** If a claim in `HANDOVER.md` is not true of this commit, that is a finding.

## Evidence in this commit

`npm run check`: 7 unit files, 80 tests passed, strict typecheck passed, production build passed.
`npm run test:e2e`: 23 tests passed.

| Test file | What it covers |
| --- | --- |
| `tests/e2e/popup.test.ts` | Ten original tests: times, 253 pixel viewport, countdown tick, 12-hour language, tomorrow Fajr, first run, Makkah fallback, Settings, city search, method persistence |
| `tests/e2e/audit.test.ts` | Asr school, method change, place change, dark link contrast, keyboard focus and Escape |
| `tests/e2e/design.test.ts` | Now and Next pills, 44 pixel controls, 190 pixel reflow, dark flat card, no network request |
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
- The next card uses a 28 pixel name and time with a 22 pixel countdown. The plan's type table says a 46 pixel countdown. A 46 pixel countdown adds more height than the 380 by 600 popup has without scrolling, given the six rows and the visible Settings button. Whether to accept the compact card or move the countdown into the hero and shorten the list is an open design question for Ali, not a settled choice. Treat it as part of the design verdict.
- The full first run is not built. There is one location step and a city search. The school, madhab, language and six-step sequence are later milestones. The first-run pick always starts Sunni and suggests a method from the country.
- No alarms, badge, notifications, offscreen audio, Ramadan notices, suhoor, Eid, PDF timetable, Qibla or full About page.
- English only. No language switcher and no right-to-left layout yet.
- City search matches Latin names only.
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
