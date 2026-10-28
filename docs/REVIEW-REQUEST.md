# Review request

**Baseline:** [`aliimrankhan86/sajdatime-extension`](https://github.com/aliimrankhan86/sajdatime-extension) at commit `b433496` on `main`, the Part A commit, which is the state after the Step 8 review fixes. **The commit to review is the one that includes this file**, Step 9, Save as PDF. `git diff b433496..HEAD` is the whole of it, and it is one commit, so `git show` shows it all. This is Part B of the four-part follow-up; Parts A (Step 8 fixes), C (languages and right to left) and D (store preparation) sit around it, and each is its own commit with its own request.

**Previous reviews:** Step 1 (`ca39f1a`) READY with three P2 fixes; Step 2 (`cf60111`) NOT READY for a missing notification icon, a Play button that did not return and a cleared self-clear alarm, all repaired in `fd002ba` and judged READY; a P3 fix in `a534306`; Step 3a (`432223b`) READY with its P2 fix in `7debc97`; Step 3b (`b931147`) READY; Step 4 (`c712b14`) READY; Step 5 (`b71fd98`) READY; Step 6 (`69e1f84`) READY after its first landing was not ready; Step 7 (`78a5179`) READY; Step 8 (`fc79dae`) READY after the five fixes in `b433496`. All of that is history. The security foundation is `docs/SECURITY.md`, enforced by code.

**Date:** 28 October 2026.
**Reviewer:** Claude, Opus review pass.
**Owner:** Ali. He presses Submit, Publish, Merge, payment and consent. Do not ask him for credentials.

## What this is

The same Manifest V3 extension, now with a second page: a printable month of prayer times that the popup footer opens with "Save as PDF". Everything the extension already did is unchanged. No account, no ad, no analytics, no host permission, no content script, no runtime network request, no new dependency. **The manifest is untouched in this commit** and the permissions are still the five of `docs/SECURITY.md` R1. `chrome.tabs.create` is used and needs no permission; adding `tabs` would be a breach of R1, so it is not there.

Binding decisions are in [`docs/DECISIONS.md`](DECISIONS.md), and **D-040 is new here**. The current state is [`docs/HANDOVER.md`](HANDOVER.md).

## What this commit changed

1. **A new page, `src/print/`.** `index.html` (same shape as the offscreen entry), `main.tsx` (reads saved settings itself, applies the stored theme, parses the query as untrusted input), `Print.tsx` (the sheet), `styles.css` (screen and paper) and `timetable.ts` (the pure builders plus their unit tests). `vite.config.ts` gains one input, so the build emits `dist/print/index.html` and shares one chunk with the popup instead of duplicating the engine.
2. **The footer's second button.** `Popup.tsx` gains `onOpenPrint`, which calls `chrome.tabs.create({ url: chrome.runtime.getURL('print/index.html?month=2026-10&kind=month') })`. Settings and "Save as PDF" are two equal pills in `.footer-actions`, 48 px tall, 8 px apart, neither label wrapping. The footer's height is unchanged, so the Times screen still measures 600 px.
3. **The sheet itself.** Header: the mark, "Prayer times for London", the month with both Hijri months when the Gregorian month spans two, then the method and the Asr school. Table: Date, Day, Hijri and the six times, in the user's own 12 or 24 hour style, with tabular digits. Today's row is shaded and a line under the table says "Today is the shaded row", so the marking is never colour alone. Then the clock change note, the polar estimate sentence where it applies, and the footer line the plan fixes word for word.
4. **The Ramadan timetable**, offered when the shown month holds Ramadan days or when Ramadan begins within 30 days. It puts the day of Ramadan first, renames Fajr to "Suhoor ends" and Maghrib to "Iftar" rather than adding columns, and writes "8 Feb" in its date column because the table crosses a month boundary.
5. **Labels moved to `src/core/labels.ts`.** `HIJRI_MONTHS` and the six line labels left `Popup.tsx` so both pages use one list, and Part C has one file to translate them in.

## Paper, measured

`@page { size: A4 portrait; margin: 12mm }`, 12 pt in the table, black on white with today's row in `whitesmoke`, header 16 pt, rows on a 1.2 line height with 2 pt padding. A 31 day month measures **1008 px of the 1031 px** of A4 content width, so the longest month is one sheet with about 6 mm spare at the foot.

Two tests pin it: `page.pdf({ preferCSSPageSize: true })` returns a page box of 595 by 842 pt, which is A4 as the page's own CSS asks for it, with a single page; and the row counts are asserted for a 31 day month (October), 30 days (June and November) and 28 days (February 2027).

Named colours, not hex: `tools/check-bundle.mjs` bans `#hex` outside `tokens.css`, and paper is not a theme, which is why the print block overrides a dark theme rather than following it. The e2e test switches the page to dark and then asserts that the printed body is `rgb(0, 0, 0)` on `rgb(255, 255, 255)` at 16 px or larger, which is 12 pt.

## Evidence

| Check | Result |
| --- | --- |
| `npm run check` | strict typecheck, **312 unit tests in 19 files**, build, `check-bundle: 11 bundle files and the source are clean` |
| `npm run test:e2e` | **99 passed** (86 before this commit, 13 new) |
| `npm run test:e2e tests/e2e/print.test.ts` | 12 passed in 12 s |
| Manifest | unchanged; `tests` assert a byte for byte permissions list |
| Bundle | 11 files, no source map, no `console.log`, no hex outside tokens |

Screenshots and a sample sheet for the reviewer: [`docs/images/pdf-month.png`](images/pdf-month.png), [`docs/images/pdf-month-dark.png`](images/pdf-month-dark.png), [`docs/images/pdf-ramadan.png`](images/pdf-ramadan.png) and [`docs/images/pdf-sample.pdf`](images/pdf-sample.pdf), the actual A4 output of a 31 day month.

## The thirteen new e2e tests, and what each would catch

1. The footer button opens the page with `month=2026-10&kind=month` and nothing else in the URL, no latitude, no longitude, no town, and the tab title carries the month and not the town (R5).
2. The two footer pills are the same size, 48 px tall, 8 px apart, inside the 380 px popup, with one line box each and the popup still 600 px tall.
3. Thirty one rows, the first and last dated, today's row shaded, and the Fajr cell equal to the Fajr the popup shows for the same day.
4. The header names October 2026 and both Hijri months, and a cell reads "20 Rabi' al-Thani".
5. October's note is the brief's own sentence, June has no note at all.
6. One A4 page, buttons hidden under print media, black on white, 12 pt, the shaded row a tint.
7. The Ramadan table's nine headers, its 29 or 30 rows, "1" in the first row and the last row's number equal to the row count, "Mar" in the last date, and "Month timetable" returning to the month.
8. The Ramadan button appears for February 2027 and 20 January 2027 and not for June 2026.
9. Next and Previous month move the table a month at a time.
10. `?month=2026-13&kind=elsewhere` falls back to the current month instead of breaking.
11. A fresh profile with no settings gets "Set up SajdaTime first" and no half built table.
12. axe: no WCAG 2.2 AA violations in either theme, and the screenshots are taken from this test.
13. The word check (`tests/e2e/words.test.ts`) runs over the print page in both themes, in both the month and the Ramadan view, so every new sentence is held to the banned word, dash and semicolon rules the rest of the product already meets.

`tests/unit/timetable.test.ts` adds 25 unit tests: day counts including leap February, month stepping across a year, the twelve Hijri names and the six line labels, one row per day with weekday and Hijri date, both Hijri month names when the month spans two, the same engine as the Times screen, the saved minutes and Hijri shift, today marked and only today, nothing marked when today is in another month, no note in a month that does not change, polar estimation, the three clock change cases plus a zone that never changes, and the Ramadan numbering and span.

## Honest gaps

- **Printing to real paper is untested.** I have the PDF and its page count. I cannot see it come out of a printer, so margins, ink and how the shaded row survives a monochrome laser are unverified. The reviewer or Ali can print [`docs/images/pdf-sample.pdf`](images/pdf-sample.pdf) to check.
- **Chrome's own print preview is untested.** The tests call `page.pdf()`, which is the same engine but not the dialog. The page has no control over the dialog's margins if the user turns off "Default".
- **Only Chrome for Testing was used.** Edge and Windows are untested, as everywhere else in this project.
- **The screen view at popup width.** The page is designed for a tab, and at 380 px the nine column table scrolls sideways rather than wrapping. Not a state a user reaches from the footer, because the page opens in a tab, but worth naming.
- Screenshots are measured, not seen. I cannot see images, so layout claims in this request come from bounding boxes, computed styles, `Range.getClientRects()` and the PDF's page count.
- The Ramadan offer window (30 days) is the plan's number, not a religious judgement. If Ali wants the whole of Sha'ban, that is a one line change in `offersTimetable`.

## Checklist from `docs/UX-PLAN.md` section 7

Pasted as the plan writes it, answered for this commit.

```
UX checklist
[x] Read the design system pages for what I touched: PLAN.md section 6.5 (Save as PDF),
    section 3.1 (tokens), section 11 (accessibility), docs/UX-PLAN.md section 7, and
    docs/SECURITY.md R1, R5 and R6
[x] Skills used: none. This part is layout, printing and one test file, and no installed
    skill covers A4 print CSS; the plan's own numbers were the brief
[x] Colours only from tokens.css; token parity test passes
[x] Light and dark screenshots taken (for the reviewer): docs/images/pdf-month.png,
    docs/images/pdf-month-dark.png, docs/images/pdf-ramadan.png, and the sheet itself at
    docs/images/pdf-sample.pdf
[x] Measured in e2e, both themes: no overlap, fits where it must, colours from tokens,
    gaps on the scale. The page measures 1008 px of the 1031 px of an A4 content column,
    and the popup footer still measures 600 px
[x] 200% zoom: nothing clipped or overlapping (measured). The PDF is 12 pt at A4, which
    is larger than 200 per cent of the 14 px minimum, and the footer's two labels are
    measured as one line box each at the popup's own size
[x] Every action a solid pill with white bold text; no greyed or outlined button
[x] Green only on next prayer or something pressable; amber only for withheld; no red.
    The print page has no state colours at all: on screen the today row uses the surface
    container role, and on paper it is whitesmoke
[x] No state shown by colour alone. Today's row is shaded and the line under the table
    says "Today is the shaded row"
[x] Gaps from the scale by relationship (4, 8, 12, 16, 24) on screen. On paper the gaps
    are in points, because 12 pt rows are the constraint the plan sets
[x] Nothing under 14 px; tabular figures on times
[x] Words: sentence case, no dashes or semicolons, no banned words, UK spelling, no
    uppercase in code. Checked by the word test in both themes on the new page
[x] Every target 44 px or more; focus visible and kept after every save. The new buttons
    are 48 and 52 px, and focus lands on the first button when the page opens in a tab
[x] axe clean in both themes
[x] Disclaimer untouched and first. The first-run disclaimer is unchanged; the sheet ends
    with the plan's own line, quoted word for word
[x] What I could not check: real printing to paper, Chrome's print dialog, Edge, Windows,
    and any of it with a screen reader
```

## Verdict wanted

Give a verdict in this shape:

- **P0** permanent breakage or a privacy or permission breach.
- **P1** silent wrong result, unusable state, or religious or location content that misleads.
- **P2** quality, maintainability, test gap or design polish.

For each finding: file and line, what happens, how you reproduced it, what the user sees, and the smallest fix. If a finding is based only on reading, say so. If you reran a test, paste the command and result.

State clearly whether this is ready for Ali to look at, and pay particular attention to two things I could not check myself: whether the sheet reads well on paper, and whether the Ramadan table's column names are the ones a mosque would use. Two more parts follow in the same session, so a finding that affects Part C or D is worth naming now.
