# Review request

The commit to review is the one that contains this file. Its diff base is `4ade8d8`, the commit
that finished Part C (languages and right to left). `git diff 4ade8d8..HEAD` is the whole of
Part D.

This is the last of four parts. Part A was the Step 8 review fixes (`b433496`), Part B was Save as
PDF (`55aa1ff`), Part C was five languages and right to left (`4ade8d8`), and this is Part D:
preparing the store pack.

## What Part D asked for

Everything a store submission needs, prepared and checked, with Ali pressing every button that
belongs to him: a listing that matches the shipped build, the data use answers, a privacy page that
is still true after Parts B and C, store images taken from the real extension, version 1.0.0, a zip
with nothing private in it, a load test of that zip in a clean browser profile, and one command
that runs every release check and reports its output.

## What changed, in plain words

- **`docs/store/listing.md` is rewritten for the shipped build.** The old draft promised a countdown
  badge, alerts and four languages as "coming next", all of which now exist, and its permission
  table named only two of the five permissions. The new file has one description that fits both
  stores (under 10,000 characters, so it works in Edge too), the Chrome summary at 101 characters,
  the single purpose sentence exactly as PLAN section 12 words it, the five permission reasons, the
  five screenshots with captions, the promo tile and logo, the listing languages with Urdu marked
  for Edge only if Edge offers it, and review notes to paste into the submission form.
- **The data use answers are written down.** `docs/store/PUBLISHING.md` now says Location is ticked
  and nothing else is, why that is true when nothing leaves the computer, that the developer never
  receives the data, and where the privacy policy link goes. It also records the one time Chrome
  and Edge setup, the zip contents, and what to do if a review comes back with a reason.
- **`docs/privacy.html` changed in the same commit, as R12 requires.** It now names your language
  among the stored settings and explains that the printable month view is a page inside the
  extension whose PDF comes from the browser's own print dialog. Nothing else on the page was
  touched, and the date line reads 28 October 2026.
- **The version is 1.0.0** in both `package.json` and `src/manifest.json`, so the zip, the manifest
  and the listing agree.
- **`tools/store-images.mjs` and `npm run store-images` produce the seven store images from the
  built extension.** Five are 1280 by 800: Times light, Times dark, the first run's method list,
  Times on 1 Ramadan 1448 (which really shows "Suhoor ends" and "Iftar", captured from the running
  popup, not drawn), and Times in Urdu. Then the 440 by 280 promo tile and the 300 by 300 logo.
  Each popup capture is placed on a flat field of the extension's own background colour, so only
  the margin is not application pixels. The script then reads the corner pixel and a column of
  middle pixels of every composed image, and prints the width and height from each PNG header, so a
  blank or misplaced image fails at home rather than at a store.
- **`tests/unit/store-images.test.ts` re-checks the seven committed images** by reading their real
  headers, and forbids a leftover working screenshot in the folder.
- **`tests/unit/listing.test.ts` parses the listing as pasted,** the summary blockquote and the
  fenced description, and fails on a broken limit, a missing required phrase, the wrong single
  purpose sentence, or a banned word slipping into store copy.
- **`tests/e2e/package.test.ts` tests the zip, not just the build.** It runs `npm run package`,
  refuses a source map, a test file, `node_modules`, `src`, `.git` or `.DS_Store` inside, then
  unzips the package into an empty temporary folder and loads that folder in a fresh browser
  profile. It reads the resolved manifest and waits for the first run's heading, which is the
  closest thing to a store install this machine can do.
- **`tools/release-check.mjs` is the gate.** `npm run release-check` runs the type check, unit
  tests, build and bundle scan, then the whole browser suite, then the five language files, the
  listing limits and the manifest. It prints one pass or fail line per check and stops at the first
  failure. Its manifest rules are written out in the script rather than imported from a test, so an
  edit has to be made twice on purpose.
- **`tools/check-i18n.mjs` is committed** as the command line version of the language checks the
  unit suite already runs, so the gate does not depend on a test file being remembered.
- **`CLAUDE.md` had a stale permissions line** left from Part B ("storage and geolocation, no
  alarms until an alert is built"). It now names the five permissions that actually ship and says
  the release check fails if that list changes. This is a documentation fix, found while reading
  for Part D, not a behaviour change.

## How to run it

```bash
cd ~/Developer/sajdatime-extension
npm run release-check      # every gate, about four minutes
npm run package            # writes artifacts/sajdatime-1.0.0.zip
npm run store-images       # writes docs/store/images, about a minute
```

`npm run release-check` builds first, so it does not need `npm run build` beforehand. The zip test
inside the suite runs `npm run package` itself, so the suite is the thing that proves the upload
file, not a person remembering to run it.

## Tests, as they stand in this commit

| Suite | Result |
| --- | --- |
| `npm run check` | typecheck clean, build clean, bundle scan clean |
| Unit tests | **352 in 22 files** |
| `npm run test:e2e` | **108 passed** in 2.2 minutes |
| `tools/check-i18n.mjs` | 252 keys in each of five files, clean |
| `tools/release-check.mjs` | every check passed |

New tests in this part: 19 unit checks (11 in `listing.test.ts`, 8 in `store-images.test.ts`) and
one browser test, `package.test.ts`. The browser suite went from 107 to 108 and the unit suite from
333 in 20 files to 352 in 22 files.

`npm run release-check` output, from this commit:

```
[release-check] summary
  pass  check: typecheck, unit tests, build, bundle scan
  pass  browser suite: npm run test:e2e
  pass  language files: five languages, same keys
  pass  listing limits: summary and description fit both stores
  pass  manifest: version and the five permissions, nothing else

[release-check] every check passed. The zip for both stores is safe to package.
```

## Store images

In `docs/store/images/`, all generated by `npm run store-images` from this build:

| File | Size | What a person sees |
| --- | --- | --- |
| `times-light.png` | 1280 by 800 | The Times screen in the light theme, whole day and countdown |
| `times-dark.png` | 1280 by 800 | The same screen in the dark theme |
| `method-step.png` | 1280 by 800 | The first run's full list of 13 methods with Fajr and Isha times |
| `ramadan.png` | 1280 by 800 | Times on 1 Ramadan 1448, with "Suhoor ends" and "Iftar" |
| `times-urdu.png` | 1280 by 800 | The Times screen in Urdu, right to left, times left to right |
| `promo-tile-440x280.png` | 440 by 280 | Chrome's small promo tile |
| `logo-300.png` | 300 by 300 | Edge's store logo, the shipped icon |

The script prints what it measured for each file, and the unit test re-measures the committed ones.
I cannot see images, so these are checked by geometry, by pixel sampling and by the words the
captured screen contained, not by eye. That is the one thing in this part that needs Ali's eyes
before submission, and it is listed under what I could not check.

## The UX checklist, filled in

From `docs/UX-PLAN.md` section 7, the standing list:

- [x] A new screen or a changed screen was measured, not just read: the store images are captured
      from the running extension at a real viewport, and the composition is measured in pixels.
- [x] Every user-facing sentence is in `src/i18n/en.json`, so all five languages change together.
      No store image or listing sentence added a hard-coded string to the extension.
- [x] The religious disclaimer is unchanged, still step 1 of the first run, and still whole in every
      language. The listing repeats its authority sentence in the same words.
- [x] No new permission, no network request, no dependency. The release check proves the
      permission list and the bundle scan proves the source.
- [x] Colours come from `tokens.css`; the store image fields use the token values for light and
      dark backgrounds.
- [x] Sentence case, UK spelling, no dash and no semicolon in user-facing copy, which the listing
      test now enforces for store text too.
- [x] Targets stay at least 44 px and text at least 14 px: no layout changed in this part.
- [x] The zip excludes source maps, tests, `.DS_Store`, the 300 pixel icon and `.git`, and the
      package test proves it on every run.
- [x] The privacy page matches the build in the same commit (R12).
- [ ] What I could not check is written below rather than left out.

## What I could not check, said plainly

- **No real upload.** No Chrome Web Store or Edge package was submitted, and no account was
  created. Ali does that, and the listing and publishing files walk him through it one screen at a
  time.
- **The images have not been seen by a person.** They are measured, not looked at. Ali approves the
  five screenshots and the promo tile before anything is uploaded.
- **The promo tile's type is drawn with the machine's system font** because a canvas cannot read
  the extension's stylesheet. It is close, not identical.
- **No real screen reader, no Windows machine, no Edge.** Those gaps carried over from Parts B and
  C and nothing in this part closes them.
- **The store forms change.** The listing records what to paste and in what order, but the field
  names in the publishing file are described, not photographed, so Ali sends a screenshot of each
  screen and gets the next click.

## Waiting for Ali

These are his alone. I cannot do any of them, and I have not tried.

1. **Approve the images.** Look at the five screenshots and the promo tile in `docs/store/images/`,
   and the M7 method sheet decision that is still open from Part C. If any image is wrong, say
   which, and I regenerate it from the same script.
2. **Make the privacy page live.** `docs/privacy.html` is in the repository; the listing's link is
   `https://aliimrankhan86.github.io/sajdatime-extension/privacy.html`. Open it in a private
   window. If it is a 404, turn on GitHub Pages for `main` and tell me.
3. **Open the two store accounts.** The Chrome Web Store developer account, the one time fee,
   two step verification and the identity checks, then the Microsoft Partner Center account. The
   steps are in `docs/store/PUBLISHING.md`. No password, card or code comes to me.
4. **Upload `artifacts/sajdatime-1.0.0.zip`** after `npm run release-check` says every check passed
   in that commit.
5. **Press Submit.** I never press submit, publish, pay or accept. Send a screenshot of the screen
   and I will tell you the next click.
