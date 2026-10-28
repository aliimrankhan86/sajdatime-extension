# Review request

**For:** the reviewer of **Part C, languages and right to left**.
**Written:** 28 October 2026, Europe/London.

**The commit to review is the one that includes this file.** Its diff base is **`55aa1ff`**, the Part B
commit, which is also what `origin/main` pointed at when this work started. Run `git diff 55aa1ff..HEAD`
to see the whole of Part C. Nothing outside this commit belongs to it.

## What Part C asked for

PLAN.md section 10: five languages (English, Urdu, Arabic, Turkish and Indonesian), each named in its
own script, right to left for Urdu and Arabic, the computer's own language when it is one of the five,
a picker in Settings and in the first run, and the religious disclaimer carried across without being
softened in any language.

## What changed, in plain words

- **One small language module, no library.** `src/i18n/index.ts` holds the five languages, the picker's
  order and names, the direction rules, and a `t(key, params)` helper. `src/i18n/en.json` is the key
  list; `ur.json`, `ar.json`, `tr.json` and `id.json` must match it key for key, and a unit test fails
  if they do not, if a value is empty, or if a `{placeholder}` differs.
- **Every screen string moved into the files.** Roughly 350 sentences and labels left the TSX and became
  keys. The English words are unchanged: not one English sentence was reworded to suit a translation.
- **The words are the phone app's words** wherever the phone already had them: prayer names, school
  names, all thirteen method names, the Hijri months and the entire disclaimer. Extension-only sentences
  (the printable page, the first run's own copy, the Settings rows, the notices, the spoken labels) are
  translated here and listed, with their English, in [`docs/TRANSLATIONS-NEW.md`](TRANSLATIONS-NEW.md).
- **Right to left** comes from `dir` and `lang` on `<html>`. The stylesheet was already logical, so
  margins, padding, the town chip and the footer mirror by themselves. One block flips the row chevron
  and the back arrow, the two glyphs that name a direction. A second block pins `direction: ltr` on
  clocks only, so a time never reverses inside an Urdu or Arabic row.
- **The language is a saved setting,** `auto` by default, migrated into settings saved before this part
  and validated on read, so damaged storage goes back to the first run rather than drawing a screen with
  no words. It applies at once when chosen, on the first run and in Settings.
- **The store name and description** now live in `_locales/{en,ar,tr,id}/messages.json` and the manifest
  reads them through `__MSG_`. There is deliberately **no Urdu folder**: Chrome and Edge do not offer
  Urdu as a store interface language, and a file nothing reads is what `docs/SECURITY.md` R13 forbids.
  Urdu is fully available inside the extension.
- **Fonts are the system's**, so nothing is bundled and no font licence is needed. Urdu asks for Noto
  Nastaliq Urdu, then Jameel Noori Nastaleeq, then Noto Naskh Arabic, then Geeza Pro, then Tahoma.
- **Two things the reviewer should look at closely**, because both were wrong in the first draft and
  fixed here: the town chip's spoken name said "change location" in English under every language, which
  axe caught as WCAG 2.5.3, and the printable page and the popup were formatting dates with different
  locales, which the print test caught as "4:53 AM" against "04:53".

## How to run it

```bash
cd ~/Developer/sajdatime-extension
npm run check        # typecheck, unit tests, build, bundle check
npm run test:e2e     # builds, then the whole Playwright suite
```

Both were run before this commit. Partial results in between are not evidence; these are the final runs.

## Tests, as they stand in this commit

| Command | Result |
| --- | --- |
| `npm run check` | **333 unit tests in 20 files pass**, build succeeds, `check-bundle: 11 bundle files and the source are clean` |
| `npm run test:e2e` | **107 tests pass** (2.3 minutes), against 99 before this part |

New in this commit:

- `tests/unit/i18n.test.ts`, 21 checks: key parity across all five files, no empty string, placeholder
  parity, no semicolon or dash in any translated value, the disclaimer's opening sentence and closing dua
  held against the phone app's own strings, the picker's order and names, `isRtl` and `localeTag`, `t()`
  interpolation and fallback, the settings migration and the `isSettings` guard, and the four store locale
  files' name and 132 character description limit.
- `tests/e2e/i18n.test.ts`, 8 tests: `lang` and `dir` on the root for each of the five; the town chip's
  pin and the back arrow's matrix measured in Arabic, and the time measured as left to right with Latin
  digits; no sideways scroll on Times at 380 by 600 in any of the five; no clipped row or target under
  44 px at 200 per cent zoom in Indonesian and Turkish; a language picked in Settings applying at once
  and being saved; the first run offering Computer language and then each language in its own name; axe
  clean on Times in all five languages in both themes; and the method sheet opening in
  each language with every method row unclipped, at least 44 px tall, and the page not
  scrolling sideways.

The words test, the design tests and the audit tests all still pass, and the audit tests were updated
for two honest consequences: the town chip's spoken name is now its two visible words, and the Hijri row
now says "One day later" rather than "+1 day" so that it can be translated.

## Screenshots

In [`docs/images/i18n/`](images/i18n/), ten files, `times-<language>-<light|dark>.png` for the five
languages in both themes. They are generated by the e2e test from the built extension with
`SAJDATIME_SCREENSHOTS=1 npx playwright test tests/e2e/i18n.test.ts`, which is the only way to be sure
they show the code in this commit. **Ali has not seen them yet: M7 asks him to approve the Urdu and
Arabic layout before this part is called finished.**

## The UX checklist, filled in

```
UX checklist
[x] Read the design system pages for what I touched: tokens, components, patterns, copy rules
[x] Skills used: none, the project's own design system and PLAN.md sections 6 and 10 were the source
[x] Colours only from tokens.css; token parity test passes
[x] Light and dark screenshots taken (for the reviewer): docs/images/i18n/
[x] Measured in e2e, both themes: no overlap, fits where it must, colours from tokens, gaps on the scale
[x] 200% zoom: nothing clipped or overlapping (measured, Indonesian and Turkish)
[x] Every action a solid pill with white bold text; no greyed or outlined button
[x] Green only on next prayer or something pressable; amber only for withheld; no red
[x] No state shown by colour alone
[x] Gaps from the scale by relationship (4, 8, 12, 16, 24)
[x] Nothing under 14 px; tabular figures on times
[x] Words: sentence case, no dashes or semicolons, no banned words, UK spelling, no uppercase in code
[x] Every target 44 px or more; focus visible and kept after every save
[x] axe clean in both themes, in all five languages
[x] Disclaimer untouched and first, in every language, with its dua last
[ ] What I could not check: see below
```

## What I could not check, said plainly

- **No native speaker has read a single translated sentence.** That is the owner's standing decision of
  9 October 2026 for the phone app, and the extension inherits it. Nothing in the product claims a
  translation is waiting for review, and no user is asked to check one.
- **No real screen reader.** Urdu and Arabic are verified by direction attributes, geometry, the axe
  rules and the LTR isolation of times, not by hearing the screens spoken.
- **No Windows and no Edge on this machine.** Windows fonts for Urdu (Noto Nastaliq is not installed by
  default) were not seen. The font stack falls back to Naskh then Tahoma, which was reasoned about, not
  looked at.
- **The print sheet in Urdu and Arabic** was measured through shared CSS and the shared clock and covered
  by axe on the sheet in English only. It was not printed to paper, and a right-to-left month table was
  not looked at by eye.
- **Arabic digits** are Latin by decision (`ar-u-nu-latn`, the same as the phone). If a reviewer expects
  Arabic-Indic digits on the Times screen, that expectation is wrong for this product, on purpose.

## Waiting for Ali

- **M7: approve the Urdu and Arabic screens** from `docs/images/i18n/`. Until he does, this part is
  built and tested but not signed off, and the sign-off is his, because the words and the right-to-left
  layout are what a person reads.
- Nothing else in Part C needs him. No account, no store step, no payment is involved in this part.
