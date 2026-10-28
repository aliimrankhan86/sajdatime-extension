# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `b3bad2d` on `main`, the commit that recorded the Step 8 review brief. **The commit to review is the one that includes this file**, the Step 8 review fixes. `git diff b3bad2d..HEAD` is the whole of it, and there is one commit, so `git show` shows it all. This is Part A of the four-part follow-up: the five faults Claude found in the Step 8 review, fixed together.

**Previous reviews:** Step 1 (`ca39f1a`) READY with three P2 fixes; Step 2 (`cf60111`) NOT READY for a missing notification icon, a Play button that did not return and a cleared self-clear alarm, all repaired in `fd002ba` and judged READY; a P3 fix in `a534306`; Step 3a (`432223b`) READY with its P2 fix in `7debc97`; Step 3b (`[[PHONE_b931147a]]`) READY; Step 4 (`c712b14`) READY; Step 5 (`b71fd98`) READY; Step 6 (`69e1f84`) READY after its first landing was not ready; Step 7 (`78a5179`) READY, and Step 8 (`fc79dae`) whose review produced this commit. All of that is history. The security foundation is `docs/SECURITY.md`, enforced by code.

**Date:** 28 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

The same Manifest V3 extension as the Step 8 review: today's six prayer times for a saved place, the next prayer with a countdown, the Hijri date, Settings, optional prayer alerts, Ramadan and Eid notices, System, Light or Dark, a toolbar badge and a reminder before each prayer. First run asks six questions before the Times screen appears. It is a separate product from the Android app. Do not review it as a port of `SajdaTime`.

No account, no ad, no analytics, no host permission, no content script and no runtime network request. Permissions stay the five of `docs/SECURITY.md` R1 and the manifest is untouched by this commit. Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md), and D-039 is new here. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this commit changed

The five findings from the Step 8 review, in the order they were raised.

1. **The heading focus ring.** `[data-autofocus]` headings keep the programmatic focus that lets a screen reader announce the step, but no longer draw Chrome's focus ring, because the review saw a green box round every heading as a step opened. `src/popup/styles.css` sets `outline: none` on their `:focus` and `:focus-visible`. The ring is still on every real control, and the first Tab press lands on one.
2. **A method row named after its method.** Each row on the method step is titled `METHOD_NAMES[method]` and the suggestion moved to the smaller hint line under the first row, "Suggested for the United Kingdom". Before, the first row was titled with the suggestion and no row carried its method's name. `src/popup/FirstRun.tsx`, using the same `METHOD_NAMES` as the method sheet.
3. **"the" before a country in a sentence.** New `countryInSentence` in `src/popup/meta.ts` for the twelve names English wants it before, applied by `methodGroupsFor` and by both "Suggested for …" hints. Headings that are only the name keep it bare. D-039.
4. **The two method buttons stacked.** "Match my mosque" and "Other methods" were side by side and wrapped onto two lines each. They now stack, full width, 48 px tall, 8 px apart, in both themes. `.first-run-method-actions` in `src/popup/styles.css`. The step also lost a redundant sentence and 4 px of row padding to stay inside 600 px: it now measures 583 px of content.
5. **The popup width test.** `tests/e2e/popup-width.test.ts` waits for a settled popup instead of a fixed sleep: a free port from `node:net`, the popup target from the Chrome DevTools Protocol, `document.readyState === 'complete'`, and two identical size reads 150 ms apart. It measures 380 by 600 and Settings visible as before.

Also: an unknown country code now reads "your country" inside a sentence rather than "From this computer" (D-039), the Settings Place row is unchanged, and `docs/images/first-run-*` are refreshed in light and dark.

Three new e2e tests, one new unit file. Nothing was removed or softened, and the disclaimer is untouched.

## What to run

```text
npm run check       typecheck + unit tests + build + bundle scan
npm run test:e2e    build + the Playwright suite in Chrome for Testing
```

`npm run check` must report a strict typecheck, **287 unit tests in 18 files** passing, a successful build, and `check-bundle: 7 bundle files and the source are clean`. `npm run test:e2e` must report **86** tests passing. The screenshots are frozen unless `SAJDATIME_SCREENSHOTS=1` is set, so a clean run leaves `docs/images` untouched; they are already refreshed here for `first-run*` and `sheet-method*`, light and dark.

The popup width test is the flake this commit exists to remove, so the full suite was run **three times in a row**, back to back, with no code change between them:

| Run | Result |
| --- | --- |
| 1, with `SAJDATIME_SCREENSHOTS=1` | 86 passed (1.6m) |
| 2 | 86 passed (1.6m) |
| 3 | 86 passed (1.6m) |

Before this commit the same test passed alone and failed in the suite. It has now opened correctly in three full runs. That is evidence, not proof: a race can return. If it fails for you, the trace is kept on failure.

## Evidence, measured rather than looked at

| Claim | Where it is pinned |
| --- | --- |
| Every first-run heading takes focus with computed `outline-style: none`, and the next Tab lands on a button or input with a 3 px solid ring | `tests/e2e/first-run.test.ts`, "every first-run heading takes focus without a ring and Tab draws one", walked through welcome, disclaimer, both disclaimer states, school, madhab, location, location found, method, both method sub sheets, and alerts |
| Every method row is titled with a value of `METHOD_NAMES`, exactly one hint line reads "Suggested for the United Kingdom", and the Other methods sheet opens with the same group title | `tests/e2e/first-run.test.ts`, "every method row is named after its method and the suggestion is the hint line" |
| Both method buttons are 48 px tall, 8 px apart, the same width, and each label is one line, in both themes | `tests/e2e/first-run.test.ts`, "the two method buttons stack full width on one line in both themes", using `Range.getClientRects()` for the line count |
| The twelve names take "the" and every other name does not, and the helper is idempotent | `tests/unit/meta.test.ts` |
| Every step still fits 380 by 600 with no clipping and no target under 44 px, in both themes | `tests/e2e/first-run.test.ts` (`checkFits`, `checkSheetFits`, `undersizedControls`) |
| The popup opens at 380 by 600 with Settings visible | `tests/e2e/popup-width.test.ts`, now three attempts against a settled page |
| axe is clean on every first-run step and sub sheet, in both themes | `tests/e2e/a11y.test.ts` |
| No new colour outside the tokens, and no banned word | `tools/check-bundle.mjs`, `tests/e2e/words.test.ts` |

## UX checklist

```
UX checklist
[x] Read the design system pages for what I touched: docs/design-system/07-accessibility.md 7.1 to 7.5 (contrast pairs, never colour alone, 48 dp targets, headings are announced, "not yet checked by ear"), plus docs/PLAN.md 3.1 for the token list and the pill rule
[x] Skills used: none loaded for this pass. The five fixes are rule checks against the pages above and the repo's own tests, so a design skill would have added nothing. Not claimed as used
[x] Colours only from tokens.css; token parity test passes
[x] Light and dark screenshots taken (for the reviewer): docs/images/first-run-light.png, first-run-dark.png, first-run-5-method-light.png, first-run-5-method-dark.png, first-run-methods-light.png, first-run-methods-dark.png, sheet-method-light.png, sheet-method-dark.png
[x] Measured in e2e, both themes: no overlap, fits where it must, colours from tokens, gaps on the scale
[ ] 200% zoom: nothing clipped or overlapping (measured) — not measured for the first-run steps, see below
[x] Every action a solid pill with white bold text; no greyed or outlined button
[x] Green only on next prayer or something pressable; amber only for withheld; no red
[x] No state shown by colour alone: the selected row keeps its tick, not just its fill
[x] Gaps from the scale by relationship (4, 8, 12, 16, 24); the two stacking buttons are 8 apart
[x] Nothing under 14 px; tabular figures on times
[x] Words: sentence case, no dashes or semicolons, no banned words, UK spelling, no uppercase in code
[x] Every target 44 px or more; focus visible and kept after every save
[x] axe clean in both themes
[x] Disclaimer untouched and first
[x] What I could not check: see below
```

## Known and accepted before you look

- The first-run steps are still measured at the normal size only. No dedicated first-run 200% zoom test exists, and adding one would have pushed one more thing into this commit. It remains the honest gap.
- Not tested: a real screen reader, Windows, Edge, other window sizes. axe is not a screen reader, and `outline: none` on a heading is only proved to leave no ring in Chrome, not that every screen reader announces the heading. The heading keeps `tabIndex="-1"` and the focus call, so it is announced in the usual way, but that is reasoning, not measurement.
- The method step's 17 px of spare room is tight. It is measured at 583 px in English, and Step 10 brings longer method names in four other languages, so the step will be measured again there.
- The geolocation path is still exercised with a mocked position in Playwright, because a test cannot grant the real browser permission.
- The Settings method sheet still shows the same rows it did, only the group heading gained "the". `tests/e2e/settings-rows.test.ts` was updated for that one word.

## Verdict wanted

Give a verdict in this shape:

- **P0** permanent breakage or a privacy or permission breach.
- **P1** silent wrong result, unusable state, or religious or location content that misleads.
- **P2** quality, maintainability, test gap or design polish.

For each finding: file and line, what happens, how you reproduced it, what the user sees, and the smallest fix. If a finding is based only on reading, say so. If you reran a test, paste the command and result.

State clearly whether all five findings are met, whether anything was fixed into a worse state, and whether this commit is ready for Ali to look at. Two more parts follow this one in the same session, so a finding that affects Part B, C or D is worth naming now.
