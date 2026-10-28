# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `b71fd98` on `main`, plus the accepted Step 6 commit `69e1f84`, plus this Step 7 commit on top of it, which is the one to review. `69e1f84` is the diff base: it is the first commit made before this one, so `git diff 69e1f84..HEAD` is the whole of Step 7. `b71fd98` is the accepted Step 5 (the Times screen re-plan). `69e1f84` is the accepted Step 6 (the Settings restructure, after its first landing `5e3c71a` came back not ready). Step 7 of [`docs/UX-PLAN.md`](UX-PLAN.md) and [`docs/PLAN.md`](PLAN.md) §7 is the badge and the reminders.

**Previous reviews:** Step 1 (`ca39f1a`) READY with three P2 fixes; Step 2 (`cf60111`) NOT READY for a missing notification icon, a Play button that did not return and a cleared self-clear alarm, all repaired in `fd002ba` and judged READY; a P3 fix in `a534306`; Step 3a (`432223b`) READY with its P2 fix in `7debc97`; Step 3b (`[[PHONE_b931147a]]`) READY; Step 4 (`c712b14`) READY; Step 5 (`b71fd98`) READY; Step 6 (`69e1f84`) READY after its first landing was not ready. The security foundation is `docs/SECURITY.md`, enforced by code. All of that is history for this review.

**Date:** 28 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

A Manifest V3 browser extension, Chrome first and Edge later. It shows today's six prayer times for a saved place, the next prayer with a countdown, the Hijri date, a small Settings screen, optional prayer alerts, Ramadan labels for Suhoor and Iftar, a coming-Ramadan notice, an Eid notice, an iftar alert, a System, Light or Dark theme, a toolbar badge showing the time to the next prayer, a quiet reminder before each prayer and a suhoor reminder in Ramadan. It is a separate product from the Android app. Do not review it as a port of `SajdaTime`.

There is no account, no ad, no analytics, no host permission, no content script and no runtime network request. Location is handled on the computer. Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md); if the plan and a decision disagree, the decision wins. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this commit changed

This is Step 7 of [`docs/UX-PLAN.md`](UX-PLAN.md): the badge and the reminders, plus two P3 fixes carried over from the Step 6 PASS review.

- **The toolbar badge.** `src/core/badge.ts` turns the wait until the next prayer into badge text: the minutes rounded up, "54m", "5m" or "1m" under an hour, "1h54" or "9h05" from an hour to under ten, "11h" from ten hours, never "0m" and never more than four characters. The background and the white text are set on every update from their RGB parts in code, because the bundle scan forbids a literal colour outside `tokens.css`. The tooltip is "SajdaTime: Maghrib in 1 hour 54 minutes (5:59 pm)"; before setup the text clears and the tooltip reads "SajdaTime: set up your prayer times". A repeating one minute `badge` alarm keeps the countdown current, and it stays alive even when alerts are off.
- **Reminder before prayer.** A new Alerts row, off by default, opens a sheet offering 5, 10, 15, 20 or 30 minutes. It fires a silent notification that many minutes ahead of a prayer the user enabled, only while alerts are on. No sound and no `requireInteraction`.
- **Suhoor reminder.** A new Ramadan row, off by default, opens a sheet offering 15, 30, 45 or 60 minutes before Fajr. It is independent of the alerts master switch, scheduled for today and tomorrow whenever the calendar is in Ramadan, fires at Fajr minus the minutes, and plays the chosen sound with a "Stop sound" button.
- **New alarm names.** `reminder:<date>:<slot>`, `suhoor:<date>` and `badge` join the alarm-name grammar. Each is built from fixed words and parsed strictly before any `prayer:` fallback, and the worker's ownership check recognises all of them.
- **Two P3 fixes from the Step 6 PASS review.** The Disclaimer row value is shortened to "A helper, not a religious authority." (dropping "Worth reading.") so it fits without an ellipsis, and the full disclaimer text is untouched. The `.switch-row` gains `padding: 8px 12px`, the same inset as `.row`, so the "Prayer alerts" switch content lines up with every other row's content.

## What to run

```text
npm run check       typecheck + unit tests + build + bundle scan
npm run test:e2e    build + the Playwright suite in Chrome for Testing
```

`npm run check` must report a strict typecheck, **270 unit tests in 15 files** passing, a successful build, and `check-bundle: 7 bundle files and the source are clean`. `npm run test:e2e` must report **78** tests passing. The screenshots are frozen unless `SAJDATIME_SCREENSHOTS=1` is set, so a clean run leaves `docs/images` untouched; the review screenshots for this commit are `settings-*`, `sheet-reminder-*` and `sheet-suhoor-*`, plus `zoom-200.png`.

## Evidence, measured rather than looked at

| Claim | Where it is pinned |
| --- | --- |
| The badge text at each boundary — over an hour, under an hour, under a minute, across midnight, never "0m", at most four characters | `tests/unit/badge.test.ts` |
| The badge stays scheduled even when alerts are off, and the worker owns and rebuilds it | `tests/e2e/alerts.test.ts` |
| The reminder and suhoor alarm names build and parse strictly, including malformed names | `tests/unit/alerts.test.ts` |
| The two new settings migrate in from older storage and validate | `tests/unit/settings.test.ts` |
| The Reminder before prayer sheet and the Suhoor reminder sheet open by keyboard, return focus on Escape and hold the right choices | `tests/e2e/settings-sheets.test.ts` |
| Every row still measures 56 to 64 px, the heading rule holds over the grown Alerts and Ramadan groups, and no value overflows to an ellipsis except the known Credits value | `tests/e2e/settings-rows.test.ts` |
| The badge and reminder colours exist only through the `hex()` helper, so the bundle scan stays clean | `tools/check-bundle.mjs` |
| The privacy page states what is now stored | `docs/privacy.html` |

## Known and accepted before you look

- The badge tooltip does not append "for Makkah" when the place is Makkah. The extension does not store whether the place came from the fallback or was chosen by name, so there is no flag to hang that wording on; the badge works for Makkah like any other place. Adding a stored flag was not in the Step 7 scope.
- The reminder title is "Asr in 15 minutes" (plan §7 style) rather than the phone's "Asr at 4:05 pm". The suhoor body spells "minutes" in full. Neither wording is invented; both are plan §7 or the phone's own strings.
- The Credits value "GeoNames, adhan-js, adhan recordings" is still 256 px wide and still ends in an ellipsis. The P3 only asked for the Disclaimer row, so Credits was left as the pre-existing, recorded gap.
- Notifications cannot be granted a permission from Playwright, so the silent reminder and the suhoor sound are asserted by their alarm and notification calls, not by an on-screen notification. The store listing, privacy URL and zip are not final.

## Verdict wanted

Give a verdict in this shape:

- **P0** permanent breakage or a privacy or permission breach.
- **P1** silent wrong result, unusable state, or religious or location content that misleads.
- **P2** quality, maintainability, test gap or design polish.

For each finding: file and line, what happens, how you reproduced it, what the user sees, and the smallest fix. If a finding is based only on reading, say so. If you reran a test, paste the command and result. Do not call the work done because the suite is green. The point of this pass is to find what the green suite missed.

State clearly whether the Step 7 requirements are met, whether the badge text and tooltip read correctly at each boundary, and whether this commit is ready for Ali to look at. If another review round is needed, say what the next smallest set of changes is.
