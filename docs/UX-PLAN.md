# UX and UI plan, and every step after Step 3b

**Written:** 28 October 2026, by Claude (Opus), the reviewer, at Ali's request: "follow better UX ... match it better with the design system and both themes ... write the complete plan for the UI/UX along with the next steps for deepseek so it knows what to do".
**For:** DeepSeek (the builder) and any later model. **Read it all before the next UI change.**
**Status of the build when written:** Steps 1 and 2 are accepted (`a534306`). Ali checked alerts on his Mac on 28 Oct 2026: the banner, the beep and the adhan all work. Step 3a is in progress.

If Claude is not available to review, this file is enough to keep going. Follow §6 step by step, run §2 on every step, and stop at each "Ali checks" point.

---

## 0. Which source wins

1. Ali's words in chat.
2. **The phone's design system**, read only: `/Users/aliimrankhan/Developer/SajdaTime/docs/design-system/` (start at `README.md`; the colours are in `tokens/color.json`). It is called Quiet Glass. The extension is the same product and must look like it.
3. `docs/PLAN.md` §3 (design) and §6 (screens and copy), then `docs/BUILD-NEXT.md`, then this file.
4. `docs/SECURITY.md` always applies, whatever a design asks for.

If two of these disagree on something visual, do not choose. Write both in the report and ask Ali, with a screenshot of each and a recommendation first.

## 1. The quality bar

Ali's words for the phone (17 Oct 2026): "make sure its all done to a good standard ... so nothing is done of bad standard and UX design, clean, easy to use and read". The extension meets the same bar.

The user opens the popup for two seconds to see one thing: **when the next prayer is**. Everything serves that. Calm, solid, readable. Nothing sells, nags or decorates.

### 1.1 Rules that are not preferences (from `01-principles.md` §1.5 and `06-content-and-language.md`)

- **Every action is a solid button with white bold text**, in light and dark. Pills, full radius. No outlined or tonal buttons, no greyed placeholder buttons (hide them until they can be used). The only text links are "Close" and "Got it" at the foot of a sheet.
- **Green means something**: the next prayer, the Qibla, or something you can press. Never decoration or a background wash.
- **Amber means withheld** (alerts blocked, an estimated time). **Red is never used.**
- **Never colour alone.** Every selected, next or current state also has a shape, a tick, a pill or words.
- **No decorative colour, no gradient behind text that changes with time.** The one fixed gradient is the hero card (`PLAN.md` §3.1).
- **Gaps come from the spacing scale, chosen by relationship** (`tokens/spacing.json`): 4 tight, 8 related, 12 paragraph, 16 group, 24 section. Never by eye. Never two gaps for the same relationship on one screen.
- **Type:** system font only. Nothing below 14 px. Times and countdowns use `tabular-nums`. One line height rule: about 1.4 for body text, 1.3 for titles.
- **Words:** sentence case; no hyphens, en dashes, em dashes or semicolons in app text (except inside names such as Eid al-Fitr); UK spelling; buttons start with a verb; full stops end sentences, never titles or buttons. **Never uppercase in code** (`text-transform: uppercase` breaks Turkish and caseless scripts).
- **Never** use the words in `06-content-and-language.md` §6.3 (missed, late, must, valid, imsak, error alone, amazing, premium ...).
- **The disclaimer is never removed, softened, shortened or moved down.**
- **Every touch target is at least 44 by 44 px.** Keyboard focus is always visible and never lost after a save.
- **No entrance animations, loops or springs.** Motion only answers a press, at 150 ms (icons), 250 ms (shape or colour) with the curve `cubic-bezier(0.4, 0, 0.2, 1)`. Respect `prefers-reduced-motion`.

### 1.2 Both themes are designed, not inverted

- Light and dark each use their own values from `tokens/color.json` (the `light` and `dark` of each role). Light cards: a level 1 shadow and no border. Dark cards: a 1 px `outlineVariant` border and no shadow.
- In dark, never put white text on `primary` (#4FC48F). Solid buttons use the CTA fill with white text: #0B5A43 in light, #17805A in dark.
- Every screen is checked in **both** themes before a step is reported. A step that looks right in one theme only is not finished.

## 2. How to work on any UI step (do this every time)

1. **Read** the design system pages for what you touch: `02-foundations.md`, `03-components.md` (the matching component), `06-content-and-language.md`, `07-accessibility.md`. For a new screen, `10-new-feature-playbook.md`.
2. **Use the skills.** Ali has given you all of his skills. Before writing UI, load and follow, in this order: `design-system` (keep tokens and components consistent), `impeccable` and `make-interfaces-feel-better` (spacing, type, borders, hit areas, states), `accessibility` (WCAG 2.2 AA), `apple-design` (the iPhone road; Apple's design guidelines). For a review pass on screenshots, `browser-qa` and `ui-ux-pro-max`. **The design system and Ali's rules beat any skill.** If a skill suggests a font, a gradient, an animation, a new colour or uppercase, ignore that part.
3. **Build with tokens only.** Every colour is a CSS custom property in `src/popup/tokens.css`. No hex anywhere else (a test enforces it, §5).
4. **Screenshot** every changed screen at 380 by 600 in light and dark, plus 200% zoom, with `SAJDATIME_SCREENSHOTS=1`, and commit the images in `docs/images/`. **DeepSeek cannot see images** (it said so on 28 Oct 2026), so it must not claim it looked. Instead it **measures** in e2e, in both themes:
   - no two text or control boxes overlap, and nothing crosses its card's edge (compare `getBoundingClientRect`);
   - the page has no scroll where `PLAN.md` says it fits (`scrollHeight <= 600`);
   - every computed colour of text, fill and border equals a `tokens.css` value for that theme;
   - every gap between siblings is one of 4, 8, 12, 16 or 24 px;
   - no text repeats a fact already shown on the same screen.

   The reviewer (Claude) or Ali looks at the images. If no reviewer is available, list the images in the report for Ali at the screenshot gates of §6.
5. **Self-review** with the checklist in §7 and paste it in the report, each line PASS or FAIL.
6. **Report:** what changed, the screenshots' paths, the checklist, the security checklist, test counts, and what you did not test. Stop and wait for review.

## 3. What is wrong today (audit of `a534306`, light and dark at 380 by 600)

Claude took these screenshots on 28 Oct 2026. Fix them in the steps of §6, not all at once.

| # | Where | Problem | Rule | Fix |
|---|---|---|---|---|
| U1 | `tokens.css` | Colours are close to the design system but not equal (`--paper` #F7F5EF, should be `background` #F7F5F3; dark #0E1512, should be #101312) and are named by look, not by role | §1.2, `PLAN.md` §3.1 | Rename every token to its Material role from `color.json` (`--background`, `--surface`, `--primary`, `--on-surface-variant` ...) with the exact `light` and `dark` values. Add a unit test that reads the phone's `color.json` values copied into `tests/fixtures/color.json` and fails if `tokens.css` differs |
| U2 | Times header | Warm sand and brown gradient (`--hero-c` #E4D2B4, dark #3A2F1D) behind the town and date | No decorative colour | Header sits on `background`. Remove `--hero-a/b/c` |
| U3 | Brand | "SAJDATIME" via `text-transform: uppercase` and letter spacing | Never uppercase in code | Write "SajdaTime" in sentence form, 16 px semibold, `primary` |
| U4 | Times header | No Gregorian date; the town is plain text, not a control | `PLAN.md` §6.1 | Header: logo, bold date ("Tuesday 27 October") over the Hijri date, and the town chip (pin, town, "Change") that opens the location sheet. Screen reader name "Change location, London" |
| U5 | Hero card | Plain card. No fixed gradient, sheen or rim; no prayer glyph; no five day bars; countdown reads "2 h 2 m 59 s" | `PLAN.md` §3.1, §6.1 | Light: gradient #E6F3EC to #D7EAE0, 1 px #C9CFC9 border, shadow `0 6px 16px rgba(11,90,67,0.12)`. Dark: #18382D to #143028 to #0F241D, white sheen 7% to 0% over the top half, rim rgba(255,255,255,0.16). Add the glyph, the five bars (done filled, next outlined, later in the divider colour) and the countdown as `2:02:59` with tabular figures and "until it begins". Contrast test every ink on every stop |
| U6 | Today list | No prayer glyphs | `PLAN.md` §3.1 Icons | The six glyphs from the phone widgets, inline SVG, 2 px stroke, `currentColor`, 20 px, never mirrored |
| U7 | Times footer | Settings sits in the header beside the logo; the plan's footer is "Save as PDF" and "Settings" | `PLAN.md` §6.1 | Until PDF exists (§6 Step 9), keep one footer button "Settings" (48 px, full width). Move "Worked out on this computer. No ads." under it |
| U8 | Settings layout | Every group is open at once: a 2,000 px scroll, a native `<select>` for the method and a native disclosure triangle for the disclaimer | `PLAN.md` §6.4, `03-components.md` Settings group and rows | Rows in grouped cards: 36 px icon tile, title, current value under it, chevron; a row opens a sheet with its choices and "Done". Groups in this order: Disclaimer (first, never moved), Place, Prayer times (School, Asr school, Calculation method, Hijri date), Ramadan (when shown), Alerts, Appearance, About |
| U9 | Sound choices | Selected only by a green border | Never colour alone | Selected row: `primaryContainer` fill and a tick at the end, plus `aria-pressed` (already there) |
| U10 | Alerts foot | Three loose lines of small text under the test button | `PLAN.md` §6.3 step 6 | The two "Chrome needs to be open" lines become one quiet notice (soft green, round mark, title "Chrome needs to be open", line "If Chrome is closed or the computer is asleep, no alert can sound."). Edge says Edge |
| U11 | About | Underlined text links (Privacy policy, GeoNames, Adhan recordings) | Only "Close" and "Got it" are text links | About rows with icon tile and chevron: Disclaimer (full text), Privacy policy, Credits (GeoNames, adhan-js, adhan recordings), Version as a plain value |
| U12 | Settings | No theme choice | `PLAN.md` §6.4 Appearance | A three part selector "System, Light, Dark" (System by default), stored in settings, applied with `data-theme` on `<html>`. The page must not flash the wrong theme on open |
| U13 | Settings top | A close X; on the phone, a sub screen has a back arrow | `PLAN.md` §6.4, `09-ios-mapping.md` | Back arrow at the top start, screen reader name "Back to times". No X |

## 4. Components to build once and reuse

Each lives in `src/popup/components/`, uses only tokens, and has an e2e check in both themes.

| Component | Spec |
|---|---|
| `Button` | Solid pill, white bold 16 px. Heights: 56 main setup button, 52 standalone, 48 in a notice or footer, 40 drawn (44 touch) compact beside a heading |
| `Notice` | Two tones, warning (amber) and quiet (soft green). Round mark, title, one sentence, optional details, one row of solid buttons |
| `Row` | Icon tile, title, value, chevron (mirrored in right to left), at least 56 px high, the whole row is the button |
| `Sheet` | Title at the top start, close X alone at the top end, content, "Done" or "Close" at the foot. Focus moves in and returns to the row that opened it. Escape closes it |
| `Switch` | The existing one, kept |
| `ChoiceRow` | Title, hint, selected = `primaryContainer` fill plus tick |
| `Segmented` | Two or three equal parts (School, Asr school, Theme), selected = solid fill plus tick or bold, `aria-pressed` |
| `Glyph` | The six prayer glyphs |
| `TownChip` | Pin, town, "Change" |

## 5. Tests that hold the design (add in Step 4)

- **Token parity:** `tokens.css` equals the copied `color.json` roles in light and dark.
- **No hex outside `tokens.css`**, no `text-transform: uppercase`, no `!important` in `src/` (extend `tools/check-bundle.mjs`).
- **Contrast:** extend `tests/unit/contrast.test.ts` to every text and background pair in both themes, and every ink on every hero gradient stop. 4.5:1 text, 3:1 large text and icons.
- **Words:** a unit test scans the built strings for an em dash, an en dash, a semicolon, " - " and the banned words of §1.1.
- **Targets:** every interactive element at least 44 by 44 (the existing `undersizedControls`), on every screen, both themes.
- **axe** on every screen in light and dark.
- **Theme:** with each of System, Light and Dark, `html` has the right `data-theme` before first paint (no flash).
- **Screenshots:** every screen, light and dark, and 200% zoom, written to `docs/images/` only with `SAJDATIME_SCREENSHOTS=1`.

## 6. The steps, in order

One step per commit (a fix after review is its own commit). After each: `npm run check`, `npm run test:e2e`, `git status` clean, push, **stop and report**. Do not start the next step until the review says PASS. If no reviewer answers within a day, carry on, and say so in the next report.

| Step | What | Done when |
|---|---|---|
| **3a** | Ramadan labels (in progress), as `BUILD-NEXT.md` | As written there |
| **3b** | Ramadan notice, Eid, iftar alert wording, as `BUILD-NEXT.md` | As written there |
| **4** | **Design foundation.** U1, U2, U3, U12 and the §5 tests. No layout change yet | Tests of §5 pass. Screenshots of Times and Settings in light and dark show the same layout with the exact colours and no sand gradient |
| **5** | **Times screen to plan.** U4, U5, U6, U7, with `Glyph` and `TownChip`. Notices slot between header and hero, one at a time | Fits 380 by 600 with no scroll in both themes, including during Ramadan and with a notice showing. Countdown ticks once a second without moving the layout. **Ali checks screenshots** (M2) |
| **6** | **Settings restructure.** U8, U9, U10, U11, U13, with `Row`, `Sheet`, `ChoiceRow`, `Segmented`, `Notice`. The method sheet shows each method with today's Fajr and Isha, grouped as `PLAN.md` §6.3 "Other methods". All Step 2 behaviour and tests keep passing | Settings is one screen of rows. Every row's sheet works by keyboard, focus returns to the row, Escape closes. axe clean in both themes |
| **7** | **Badge and reminders** (`PLAN.md` §7): toolbar badge with time to the next prayer, Reminder before prayer (off by default, 5 to 30 minutes, quiet, no sound), Suhoor reminder in Ramadan | Alarm names follow `SECURITY.md` R11. Unit tests on badge text at each boundary |
| **8** | **First run** (`PLAN.md` §6.3, M3): Welcome, Disclaimer (copied exactly from the phone's strings), School, Madhab, Location, Method (with Match my mosque and Other methods), Alerts | Progress saved per step. Every step fits 380 by 600. **Ali checks screenshots** (M3) |
| **9** | **Save as PDF** (`PLAN.md` §6.5), then the footer gets its second button | A4 print preview correct for a month with a clock change |
| **10** | **Languages and right to left** (`PLAN.md` §10, M7): Urdu, Arabic, Turkish, Indonesian with the phone's own strings where they exist | Every screen in Urdu and Arabic right to left, both themes. **Ali checks screenshots** (M7) |
| **11** | **Store ready** (`PLAN.md` §12, M8): privacy page live, listing text, store images retaken, package, release gate | Ali submits. Claude never submits |

Steps 4 to 6 are the UX work Ali asked for on 28 Oct 2026. Do them before 7.

## 7. Self-review checklist (paste it in every UI report)

```
UX checklist
[ ] Read the design system pages for what I touched: <list>
[ ] Skills used: <list>, and what I took from each
[ ] Colours only from tokens.css; token parity test passes
[ ] Light and dark screenshots taken (for the reviewer): <paths>
[ ] Measured in e2e, both themes: no overlap, fits where it must, colours from tokens, gaps on the scale
[ ] 200% zoom: nothing clipped or overlapping (measured)
[ ] Every action a solid pill with white bold text; no greyed or outlined button
[ ] Green only on next prayer or something pressable; amber only for withheld; no red
[ ] No state shown by colour alone
[ ] Gaps from the scale by relationship (4, 8, 12, 16, 24)
[ ] Nothing under 14 px; tabular figures on times
[ ] Words: sentence case, no dashes or semicolons, no banned words, UK spelling, no uppercase in code
[ ] Every target 44 px or more; focus visible and kept after every save
[ ] axe clean in both themes
[ ] Disclaimer untouched and first
[ ] What I could not check: <list>
```

## 8. Decide alone, or ask Ali

- **Decide alone:** anything this file or the design system already says.
- **Ask Ali, with screenshots and a recommendation first:** a new colour, icon, layout, wording that changes meaning, anything the design system does not cover, and any time two sources disagree.
- **Never:** remove or soften the disclaimer, add a permission, a network request or a dependency (`SECURITY.md`), or merge, publish or submit.
