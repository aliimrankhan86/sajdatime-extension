---
type: project
title: 'SajdaTime browser extension, build plan v1.1 (signed off)'
ingested_at: '2026-10-21T10:07:30.034Z'
source_kind: 'mcp:put_page'
ingested_via: 'mcp:put_page'
---

# SajdaTime browser extension: build plan

Version 1.1, reviewed and signed off on 20 Oct 2026. Written 20 Oct 2026 in Ali's claude.ai SajdaTime project, for Claude Code to build from without asking questions. Owner: Ali Imran Khan. Status: planned and designed, nothing built. The review log at the end (§20) says what was checked and changed.

**GBrain note.** This page is the full plan, stored so Claude Code on Ali's Mac can read it without anyone copying it. Summary and status page: `projects/sajdatime-extension`. **Separate from the Android app** (`projects/sajdatime`): never mix the two. The same plan is in the claude.ai SajdaTime project as `claude/SajdaTime-extension-PLAN.md`. Once the extension repo exists, `docs/PLAN.md` there is the copy that wins.

---

## 0. Read this first (how to use this plan)

**What this is.** A complete brief for building the SajdaTime extension for Chrome and Microsoft Edge. It gathers every decision Ali made in the planning chat of 20 Oct 2026, the research behind the method picker, the screen design and the release route. Where something was not decided, this plan decides it and says so, so you can carry on without asking.

**This is separate work from the SajdaTime Android phone and Wear OS apps.** Ali said so twice: "do not mix it up with the android app. this is a seperate work on its own" and "Please do not mix it with the app for the Android, as it's a Chrome extension, it's slightly different work."
- Do not change any file in the phone repo (`aliimrankhan86/SajdaTime`, `~/Developer/SajdaTime`). Reading files from it is allowed and expected (disclaimer text, translations, adhan recordings, icon, the prayer engine's parameters).
- Do not mention extension work in the phone repo's HANDOVER, PROJECT_BRIEF or CLAUDE.md.
- Do not change the phone app's defaults because of anything in this plan. If you find something in the phone app that looks wrong, tell Ali in one line and leave it alone.

**Order of authority when things disagree** (highest first):
1. What Ali says in the current session.
2. `docs/DECISIONS.md` in the extension repo (the dated change log you keep, see §17).
3. This plan (§2 holds Ali's decisions, §2.1 the reviewer's, §15 the defaults for open points).
4. The design canvas (§3). It shows the look. This plan wins on behaviour and wording.

**When Ali changes something.** Apply it, write a dated line in `docs/DECISIONS.md` saying what changed, what it replaced and why, then update every place in this plan's checklist that it touches (§16 lists them). Never keep two versions of a rule alive.

**When to ask Ali (and only then).** Use AskUserQuestion, at most four questions, two to four options each, recommendation first and marked "(Recommended)", with screenshots for anything visual. Ask only when:
- a change alters how something looks and no rule here decides it,
- two of his instructions pull in different directions,
- it would reverse an entry in `DECISIONS.md` or this plan's §2,
- a step needs his account, his money or his button press.
Everything else: decide, record it in `DECISIONS.md`, and tell him in one line.

**Ali's standing rules** (they apply to everything here):
- UK English. Plain, short, human words. No em dashes or en dashes, no semicolons, no hyphens in app text unless a name needs one (Umm al-Qura, Eid al-Fitr). No AI cliché wording. Lead with the answer.
- He is not technical. Explain in plain words, say what was verified and what was not, never call something done when it was not tested.
- He presses every Submit, Publish, Merge, payment and consent button himself. Stop before those and hand them to him. For anything he must do in a web page, go one screen at a time and ask for a screenshot.
- Never ask for, view or handle passwords, keys, tokens or signing files.
- He does not want to copy prompts or follow lists. Do the work, and leave the records so the next session knows where things stand.
- Show him drafts before anything is sent in his name.
- Testing in an automated browser is enough. Do not ask him to test by hand. He may choose to try it himself.
- Do not use the Gmail, Google Drive or Figma connectors for SajdaTime.

---

## 1. When to start

- **Start only after phone 1.5.0 is released** (Ali, 20 Oct 2026: "We will do it straight after release of 1.5", "so we can concentrate on it"). Phone 1.5.0 is due to be submitted on Mon 9 Nov 2026, so the earliest start is around mid November 2026. Check the phone's Play page "Updated on" date before starting. If 1.5.0 is not live, wait. If Google raises a problem with 1.5.0, that comes first.
- **Design gate: passed.** Ali approved the design on 21 Oct 2026 ("the designs are approved from me"). Record it as the first line of `DECISIONS.md`. Do not ask again.
- **Ali's availability:** no planned absence (his Umrah plan changed, 20 Oct 2026). If he is ever unavailable, carry on with everything that does not need him, keep the list in `HANDOVER.md` under "waiting for Ali", and hold anything that needs his button.
- **Target:** live in the Chrome Web Store and Edge Add-ons well before Ramadan 1448, which begins Monday 8 February 2027 (Umm al-Qura). Submit by about **Mon 4 Jan 2027**. A first listing from a new developer account can take a week or more to review, and fixes add more time. Latest acceptable submit: **Mon 25 Jan 2027**. If it slips past that, ship a few days into Ramadan rather than cut testing.

**Day one, in this order.**
1. Open https://play.google.com/store/apps/details?id=com.sajdatime.app and read "Updated on". If 1.5.0 is not live, stop and tell Ali in one line.
2. Read, read only: the phone repo's `docs/DESIGN_SYSTEM.md`, `PrayerEngine.kt` and its Hijri helper, the disclaimer strings in all five languages, the adhan files and their licences, and the launcher icon source.
3. Put everything that needs Ali into **one** AskUserQuestion, so he answers once, on day one: (a) create the repo `aliimrankhan86/sajdatime-extension` (you create it with `gh` if signed in, otherwise he creates it on GitHub's site, one screen at a time), (b) open the two store accounts in §12 straight away, because identity checks can take days. Until he answers, carry on with everything that does not need him and keep the list in `HANDOVER.md` under "waiting for Ali".
4. Create the repo files in §4.3, copy this plan to `docs/PLAN.md`, write `CLAUDE.md` and the first `DECISIONS.md` line, then start M1.

---

## 2. Decisions already made (do not reopen without Ali)

Dated 20 Oct 2026 unless shown.

| # | Decision | Source |
|---|---|---|
| D1 | A Chrome and Edge extension showing prayer times, alerts and settings on a computer | Ali |
| D2 | **No Qibla, ever** | Ali |
| D3 | Opens as a **small popup** from the toolbar icon, 380 by 600 px (Chrome's popup limit is 800 by 600) | Ali chose from options |
| D4 | The toolbar icon shows a **countdown badge** to the next prayer | Ali chose |
| D5 | **Same design system as the phone app: Quiet Glass.** The popup looks like the phone's home screen widgets where possible | Ali |
| D6 | First run: welcome, short disclaimer, Sunni or Shia, madhab (Sunni only), location, calculation method, alerts and sound | Ali's list, order set by research (location now comes before method) |
| D7 | Two themes (light and dark) plus "System" | Ali |
| D8 | Five languages: English, Urdu, Arabic, Turkish, Indonesian. Urdu and Arabic right to left. Arabic uses Western digits | Ali ("multiple languages"), set to the phone's five |
| D9 | Ramadan features in version 1: Ramadan card, suhoor end and iftar labels, optional suhoor reminder, Eid greeting, Ramadan timetable | Ali |
| D10 | At each prayer: a sound and a message that shows for **1 minute then disappears** | Ali |
| D11 | Sound: user chooses. **Soft beep by default**, built in adhan, or silent | Ali chose |
| D12 | **No usage counts in version 1.** On by default is ruled out for legal reasons (UK ICO, as on the phone) | Ali chose |
| D13 | **Save as PDF** like the app: the monthly timetable, and the Ramadan timetable in Ramadan | Ali, in version 1 |
| D14 | **Update location** from the town chip on the Times screen | Ali |
| D15 | Town names and city search come from a **city list built into the extension**. Remote areas show "Near <town>" | Ali chose, asked about remote areas |
| D16 | **Chrome and Edge** in version 1, one build | Ali chose |
| D17 | Settings stay **on this computer**, never synced through the Google or Microsoft account | Claude, not contradicted |
| D18 | No rating prompt. A passive "Rate SajdaTime" row in Settings only | Claude, not contradicted |
| D19 | Calculation method: **suggest, never make people choose from a list of 14**. Show today's Fajr and Isha beside each option. "Match my mosque" and "Other methods" one tap away | Research, Ali asked for it |
| D20 | **UK users see three options** as one compact table: Moonsighting (suggested), 15 degrees (ISNA), 18 degrees (Karachi) | Ali delegated ("I want you to decide"), Claude decided |
| D21 | Build starts after phone 1.5.0 is released, and only after Ali approves the design. **Design approved 21 Oct 2026** | Ali |

### 2.1 Decisions made at review (20 Oct 2026, reviewer, so nobody has to ask)

These do not reverse anything in §2. They close gaps so Claude Code can carry on. Ali may change any of them. Ali accepted all reviewer recommendations on 20 Oct 2026.

| # | Decision | Why |
|---|---|---|
| R1 | Popup is built with **Preact**. No "plain TypeScript instead" option | One fewer choice to make. Preact is small and well tested with Vite |
| R2 | `minimum_chrome_version` is **127** | Covers `chrome.offscreen` (109), `setBadgeTextColor` (110), `getPermissionLevel` as a promise (116) and `chrome.action.openPopup` for every extension (127). Edge 127 shipped in July 2024 |
| R3 | **Keyboard shortcut** to open the popup: `Alt+Shift+S`, declared under `commands` as `_execute_action`. Needs no permission. Users can change it on the browser's shortcuts page | A prayer times tool should be reachable without the mouse |
| R4 | **No uninstall page.** `chrome.runtime.setUninstallURL` is not used. The browser deletes the extension's storage on uninstall, nothing else is needed | Privacy first, nothing to collect |
| R5 | **On update** (`runtime.onInstalled` with reason `update`): run the settings migration, rebuild every alarm, keep the setup state. Never show setup again after an update | Chrome clears an extension's alarms when it updates |
| R6 | **Moonsighting Committee Isha** uses the library's `Shafaq.General` for everyone. No shafaq setting in version 1 | It is the library default and gives sensible times at UK latitudes. A setting would add a third level to the method picker |
| R7 | **Times are shown in the chosen place's time zone**, not always the computer's. The city list carries each town's time zone (GeoNames has it). "Use my current location" uses the computer's time zone. If the place's zone differs from the computer's, the Times screen says "Times in <town>'s local time" under the town chip | Without this, the Makkah fallback and any searched town abroad would show wrong clock times |
| R8 | **Edge is not tested in an automated browser.** Playwright cannot load an unpacked extension into Edge or Chrome, only into its own Chromium. Edge runs the same Chromium engine. Record "Edge not tested, same engine" in `HANDOVER.md`. Ali may try the unpacked build in Edge himself if he wants, never ask him to | Verified against the Playwright docs, 20 Oct 2026 |
| R9 | A **"Send a test alert"** button sits at the bottom of the Alerts group in Settings. It shows a sample notification and plays the chosen sound | The extension cannot tell whether the computer's Focus or Do Not Disturb mode hid a notification, so the user needs a way to check for themselves |
| R10 | **Store privacy answers declare Location** as handled on the computer only, and never sold, shared or used for anything else | The Chrome Web Store counts data handled only on the device as "handled". Saying "no data" would be wrong and a rejection risk |
| R11 | The **16 px toolbar icon** is the mihrab shape alone if the full artwork is unreadable at that size. Show the result at the M2 screenshots, do not stop for it | Avoids a block on a visual detail |
| R12 | The **soft beep** is a two note tone, under 1.5 seconds, made in code (no file) with a fade in and out | No licence to track. Ali hears it before release at the M7 screenshots check |
| R13 | `_locales` holds English, Arabic, Turkish and Indonesian only. **Chrome has no `ur` locale**, so the Urdu name and description cannot go through `_locales`. Urdu is fully supported inside the extension through `src/i18n/ur.json` | Verified against the chrome.i18n locale table, 20 Oct 2026 |

---

## 3. The design

**The canvas:** "SajdaTime browser extension design", a private Claude Design canvas: https://claude.ai/artifact/4fcFbdvWEVwzcWoLD3AkQg. Ali can open it. If you cannot read it, this section and §6 hold everything you need. Its artboards:

| Row | Artboard | What it shows |
|---|---|---|
| Popup | Times, light | The main screen at 2:40 pm on Tue 20 Oct 2026, London |
| Popup | Times, dark | Same, dark theme |
| Popup | Times in Ramadan, light | 4:50 pm on Fri 19 Feb 2027, 12 Ramadan 1448 |
| Popup | Times in Urdu, dark, right to left | The main screen in Urdu |
| Popup | Update location | The location sheet with city search |
| Popup | Settings (full scroll), alerts blocked | Every Settings row, with the amber "alerts blocked" notice |
| First run | Setup 0 to 6, plus Match my mosque and Other methods | The whole first run |
| On the computer | Toolbar badge and the prayer alert | Badge "1h54" and the alert message |
| On the computer | Save as PDF | A4 monthly timetable, October 2026, London |

The times in the canvas are real, worked out for London with Moonsighting Committee and Hanafi Asr. Use them as test fixtures (§13).

### 3.1 Design tokens (copy exactly)

Quiet Glass, from the phone repo's `docs/DESIGN_SYSTEM.md` (branch `claude/quiet-glass`, later `main`). Read that file before building. It wins over this table if they differ. Put every colour in one `tokens.css` as CSS custom properties. No hex anywhere else.

**Light**
| Token | Hex |
|---|---|
| background | #F7F5F3 |
| surface | #FDFCFB |
| surfaceLow (sunrise row) | #FAF8F5 |
| surfaceHigh (current row, sheets, theme track) | #EDEFE8 |
| primaryContainer (next row, selected choice) | #D7EAE0 |
| onPrimaryContainer | #0F2A1F |
| primary (links, bars, Next pill, actions) | #0B5A43 |
| onPrimary | #FFFFFF |
| secondaryContainer (Now pill, row icon tiles, quiet notice) | #CDE3D7 |
| onSurface (text) | #1B211E |
| onSurfaceVariant (secondary text) | #5A605C |
| outline (chevrons) | #757C77 |
| outlineVariant (dividers) | #C9CFC9 |
| warning (amber) | #9A6208 |
| warningSurface | #FBF1DC |
| onWarningSurface | #5A4408 |
| CTA fill | #0B5A43 with white text |
| Hint text on primaryContainer | #3E5C4C |

**Dark**
| Token | Hex |
|---|---|
| background | #101312 |
| surface | #171B1A |
| surfaceLow | #141817 |
| surfaceHigh | #1E2321 |
| primaryContainer | #143028 |
| onPrimaryContainer | #8FD9B8 |
| primary | #4FC48F |
| onPrimary | #062117 |
| secondaryContainer | #1E4034 |
| onSurface | #E7EAE8 |
| onSurfaceVariant | #A9B2AE |
| outline | #8B948F |
| outlineVariant | #2A312E |
| warning | #E8B14A (text on it #3A2A00) |
| warningSurface | #2A2113 |
| onWarningSurface | #F3E4C5 |
| CTA fill | #17805A with white text |

**Hero card (the widget's countdown card)**
- Light: fixed gradient top to bottom #E6F3EC to #D7EAE0, 1 px border #C9CFC9, soft shadow `0 6px 16px rgba(11,90,67,0.12)`. Ink: name and countdown #1B211E, label and "until it begins" #5A605C.
- Dark: fixed gradient #18382D to #143028 to #0F241D, with a white sheen over the top half (7% to 0% by the middle), 1 px rim rgba(255,255,255,0.16). Ink: countdown and name #E7EAE8, label #8FD9B8, time #A9B2AE.
- The gradient is fixed. It never changes with the time of day.

**Surfaces.** Light cards use a level 1 shadow and no border. Dark cards use a 1 px outlineVariant border and no shadow.

**Type.** The system font (no bundled web font). Countdown 46 px light weight with tabular figures. Prayer name 26 px semibold. Rows 16 px. Secondary 14 to 15 px. **Nothing below 14 px**, except the badge (drawn by the browser). Times and countdowns use `font-variant-numeric: tabular-nums`.

**Spacing.** 4 px base. Popup gutter 16 px. Card padding 16 to 20 px. Gaps: title to its line 4, paragraph to its button 8, paragraph to paragraph 12, group to group 16, section to section 24. Rows at least 42 px on Times, 48 to 64 px elsewhere. Every clickable thing at least 44 by 44 px.

**Radius.** Cards 20 to 24 px. Buttons are full pills.

**Buttons (Quiet Glass §4.1).** Every action is a **solid green pill with white bold 16 px text**. Amber pills only inside a warning notice. The only text links are "Close" and "Got it" at the foot of a dialog. A close X stands alone at the top end of a dialog. Never put two icon buttons side by side. Never show a greyed out placeholder button: hide it until it can be used. Heights: 56 the main button of a setup step, 52 a standalone button, 48 a button inside a notice or the Times footer, 40 drawn (44 to touch) a compact button beside a heading.

**Notices.** One component, two tones. Warning (amber, something is wrong or withheld) and quiet (soft green, information or an occasion). Anatomy: round mark, title, one short sentence, optional folded details, then one row of solid buttons ("Details" with a chevron if there is more to say).

**Icons.** Inline SVG, 2 px stroke, round caps, `currentColor`. The six prayer glyphs from the phone widgets: Fajr rays above an empty horizon, Sunrise a rising half sun with an up arrow, Dhuhr the sun over a post with no shadow, Asr a post whose shadow equals its height, Maghrib a setting half sun with a down arrow, Isha a crescent and star. In right to left, mirror direction arrows and chevrons. Never mirror clocks, ticks or the prayer glyphs.

**Logo.** Use the phone's launcher icon artwork (mihrab and minarets, gold on green) from the phone repo, read only. The canvas shows a rough stand in. Produce toolbar and store sizes 16, 32, 48 and 128 px PNG, plus 300 by 300 for the Edge store logo. Check the 16 px one is still recognisable, and simplify it if not (R11).

### 3.2 Contrast and checks

Write a small test that checks every text and background pair in both themes against WCAG 2.1 AA (4.5:1 text, 3:1 large text and icons), including every ink on every hero gradient stop. The build fails if one drops below.

Check every screen in: light, dark, browser zoom 200%, Urdu, Arabic. Take screenshots of each (§13).

---

## 4. Architecture

### 4.1 Repository

- New public GitHub repository **`aliimrankhan86/sajdatime-extension`**, cloned at `~/Developer/sajdatime-extension`. Separate from the phone repo on purpose. Creation is part of the day one question (§1). He presses any button on GitHub's site.
- Branch `main` is protected the same way as the phone repo: work happens on branches, and Ali merges pull requests.
- GitHub Pages from `main`, folder `/docs`, for the extension's privacy page and a short help page.
- Licence: same as the phone repo (check it, read only).

### 4.2 Stack (keep dependencies few)

- **Manifest V3.** One build for Chrome and Edge.
- **TypeScript**, built with **Vite** (build only).
- **Preact** for the popup and pages (small, simple). Decided (R1).
- **adhan** (npm, adhan-js by Batoul Apps, MIT) for prayer times. Pin **4.4.6** (the latest on 20 Oct 2026, published 31 Aug 2026). Move to a newer version only after the golden tests pass on it.
- **Vitest** for unit tests. **Playwright** with its own Chromium (`channel: 'chromium'`) for end to end tests with the unpacked extension loaded through `launchPersistentContext`.
- No analytics library. No network library. No UI framework beyond Preact.
- Manifest V3 rules the build must respect: no inline `<script>` in any HTML page and no `eval` (the extension content security policy blocks them, Vite's default output is fine), no remotely loaded code, and no obfuscation. Minify, but keep the code readable enough for a store reviewer. Do not ship source maps in the package.

### 4.3 Folder layout

```
sajdatime-extension/
  CLAUDE.md                  rules for every session (§17)
  docs/PLAN.md               this file
  docs/DECISIONS.md          dated change log
  docs/HANDOVER.md           state of play, newest first
  docs/privacy.html          extension privacy policy (Pages)
  docs/store/                store listing text, screenshots, promo tiles
  src/manifest.json
  src/background/            service worker: scheduling, badge, alerts
  src/offscreen/             audio player page
  src/popup/                 Times, setup, settings, sheets
  src/pages/timetable/       print page for Save as PDF
  src/core/                  prayer engine, Hijri, Ramadan, methods, places
  src/i18n/                  en, ur, ar, tr, id message files
  src/assets/                icons, sounds, city list
  tests/                     unit and end to end tests, golden fixtures
  tools/                     city list builder, fixture builder
```

### 4.4 Manifest

- `name`, `description` from `_locales` with `default_locale: "en"`, in English, Arabic (`ar`), Turkish (`tr`) and Indonesian (`id`). Not Urdu (R13).
- `action`: default popup `popup.html`, default title "SajdaTime".
- `background`: service worker, module type.
- `commands`: `_execute_action` with suggested key `Alt+Shift+S` on every platform (R3).
- **Permissions, and nothing else:** `alarms`, `notifications`, `storage`, `offscreen`, `geolocation`. No host permissions. No content scripts. No `tabs`. No remote code. The browser shows two install warnings for these: "Display notifications" and "Detect your physical location". The store listing explains both in one sentence each.
- Icons 16, 32, 48, 128.
- `minimum_chrome_version`: `"127"` (R2).

### 4.5 How the pieces work

**Service worker (`background`).** Wakes on alarms and events, does its job, sleeps. Chrome stops it after about 30 seconds idle and after 5 minutes on any single event. It never relies on staying alive and never uses `setTimeout` for anything that matters. Every event listener is registered at the top level of the file, synchronously, or it will miss events after a restart.
- **Rebuild the alarms** (work out today's and tomorrow's times and create one non repeating alarm for each enabled prayer, the optional reminder before prayer, the optional suhoor reminder and a refresh just after midnight) on all of these: `runtime.onInstalled` (install and update), `runtime.onStartup`, a settings change, a location change, and at the top of the service worker file whenever it starts, after checking with `chrome.alarms.getAll` that the expected set is present. Chrome clears alarms when the extension updates and may lose them on restart, so the check on every start is the safety net. Keep the set small (under 20 alarms).
- A repeating alarm with `periodInMinutes: 1` updates the badge and its tooltip (Chrome's minimum is 30 seconds). It also notices a changed time zone or a clock jump (the next prayer it works out no longer matches the scheduled alarms) and rebuilds the alarms.
- When a prayer alarm fires: if it fired more than **5 minutes late** (the computer was asleep, Chrome fires missed alarms on wake), do nothing. Otherwise show the alert (§7) and play the sound.

**Offscreen document (`offscreen`).** A service worker cannot play sound, so a hidden offscreen page plays the beep or adhan. Rules from the Chrome docs: only **one** offscreen document can exist at a time, so one page `offscreen.html` declares both reasons it may need (`AUDIO_PLAYBACK`, and `GEOLOCATION` if the fallback in §8 is used). It can use `chrome.runtime` only, nothing else from `chrome.*`, so the service worker talks to it with messages ("play beep", "play adhan sunni", "stop", "get position"). Chrome closes it on its own 30 seconds after audio stops. Before creating it, check `chrome.runtime.getContexts` for an existing one.

**Popup.** Reads settings and works out times itself, so it opens instantly and shows a live countdown every second while open. It writes changes to storage. The service worker listens for storage changes and reschedules.

**Timetable page.** An extension page opened in a new tab that lays out the month (or Ramadan) and opens the browser's print dialog, where the user picks "Save as PDF". This keeps Urdu and Arabic text correct, which PDF libraries often break.

**Storage.** `chrome.storage.local` only. Never `storage.sync`. One versioned settings object (`schemaVersion`) with a migration function and safe defaults if it is missing or damaged. The popup and the service worker both read it, only the popup writes it, the service worker reacts through `chrome.storage.onChanged`. The city list is a bundled asset, never stored in `storage.local`.

**Browser detection.** For "Chrome asks Google" against "Edge asks Microsoft" and for the right store link, read `navigator.userAgentData.brands` and look for "Microsoft Edge". Anything else is treated as Chrome.

---

## 5. Prayer times engine (`src/core`)

### 5.1 Rules

- All times are worked out on the computer with adhan-js. **No network call ever** to work out times. Aladhan and other websites may be used during development to check results only.
- Times are rounded to the nearest minute (the library's default). Singapore (MUIS) rounds up, which the library sets itself. Shown in the browser's 12 or 24 hour style for the chosen language, except Arabic always uses Western digits (`ar-u-nu-latn`).
- Times are worked out for the place's coordinates and shown in the place's time zone (R7). "Today" is the date in that time zone. Alarms are absolute instants, so clock changes and time zones cannot move them.
- Far north safety: set `polarCircleResolution` to `AqrabYaum` for every method so a place inside the polar circle never produces an invalid time. The far north notice in §6.1 still shows.
- Asr: Hanafi or Shafi'i (the latter covers Shafi'i, Maliki and Hanbali), from setup. Shia users do not see the madhab step and use the standard Asr.
- **High latitude** (summer nights in the UK and further north): set automatically, never a user setting. Moonsighting Committee handles it itself (seasonal Fajr and Isha, and the one seventh rule from 55 degrees) and ignores the high latitude setting. For every other method, call `HighLatitudeRule.recommended(coordinates)`, which returns one seventh of the night above 48 degrees and middle of the night below. Without this, Muslim World League in London on 15 June gives Fajr and Isha both at 1:01 am, which is unusable (checked three times independently with adhan 4.4.6, last on 20 Oct 2026 by the reviewer: with one seventh it gives Fajr 3:39 am and Isha 10:23 pm).
- **Consistency with the phone app.** The phone uses adhan's Kotlin library with its own parameters. Before writing the engine, read the phone's `core/.../PrayerEngine.kt` (read only) and copy its choices: method parameters, its high latitude handling, its Hijri source and its rounding. Turkey's Diyanet offsets (Sunrise minus 7, Dhuhr plus 5, Asr plus 4, Maghrib plus 7) are already inside adhan-js's `Turkey` method, so the extension must **not** add them again. If the phone adds them on top of the Kotlin library's own, its Turkey times are doubled and you tell Ali in one line, without changing the phone. For the same method, madhab and place, the extension must give the **same minute** as the phone. Three exceptions are allowed and must be written in `DECISIONS.md`: (a) the extension's UK suggestion is Moonsighting Committee while the phone defaults to Muslim World League (Ali keeps them separate on purpose), (b) if the phone's high latitude handling produces unusable times, the extension uses the rule above and you tell Ali in one line, without changing the phone, (c) if the phone applies the Turkey offsets twice, the extension applies them once (the library's own) and you tell Ali in one line.

### 5.2 The methods offered (13)

| Shown as | adhan-js | Fajr / Isha | Notes |
|---|---|---|---|
| Moonsighting Committee | `MoonsightingCommittee` | 18 / 18 with seasonal shifts | Handles high latitude itself. Dhuhr plus 5 and Maghrib plus 3 minutes are built in. Isha uses `Shafaq.General` (R6) |
| 15 degrees (ISNA) | `NorthAmerica` | 15 / 15 | Dhuhr plus 1 built in |
| 18 degrees (Karachi) | `Karachi` | 18 / 18 | Dhuhr plus 1 built in |
| Muslim World League | `MuslimWorldLeague` | 18 / 17 | Dhuhr plus 1 built in |
| Umm al-Qura, Makkah | `UmmAlQura` | 18.5 / 90 min after Maghrib | Add 30 minutes to Isha in Ramadan through `adjustments.isha` (the library does not, its own notes say to) |
| Egyptian | `Egyptian` | 19.5 / 17.5 | Dhuhr plus 1 built in |
| Dubai | `Dubai` | 18.2 / 18.2 | Sunrise minus 3, Dhuhr, Asr and Maghrib plus 3 built in. Not an official UAE timetable |
| Kuwait | `Kuwait` | 18 / 17.5 | |
| Qatar | `Qatar` | 18 / 90 min after Maghrib | |
| Turkey (Diyanet) | `Turkey` | 18 / 17 | Sunrise minus 7, Dhuhr plus 5, Asr plus 4, Maghrib plus 7 built in. Do not add them again |
| Singapore (MUIS) | `Singapore` | 20 / 18 | Dhuhr plus 1 built in, rounds up |
| Jafari (Shia) | custom from `Other` | 16 / 14, Maghrib at 4 degrees | adhan-js has no Jafari. Build it from `CalculationParameters('Other', 16, 14)`, not with a `maghribAngle`; see D-002 for the separate Maghrib pass |
| Tehran (Shia) | `Tehran` | 17.7 / 14, Maghrib at 4.5 degrees | Same separate pass as Jafari; see D-002 |

The "built in" offsets are the library's `methodAdjustments`, verified in adhan 4.4.6 on 20 Oct 2026. Check them again against the phone engine. Where the phone differs, follow the phone and write it down.

**For Jafari and Tehran, the `maghribAngle` column above is superseded by [`DECISIONS.md`](DECISIONS.md) D-002.** Do not set `maghribAngle` on the main parameters. The main pass stays at sunset, and Maghrib comes from a second Isha-only pass at the same latitude. Setting `maghribAngle` makes the high-latitude day check judge the solar day by Maghrib and wrongly project a normal Shia summer day. See D-002 for the phone evidence.

### 5.3 Which method to suggest

Work it out on the computer from two things only: the user's tradition and the country of the chosen place (from the built in city list, §8). **Never by distance on a map** (that is how Aladhan gets Berlin, Sydney and Lagos wrong).

**Shia:** Jafari everywhere, Tehran in Iran. Sunni methods appear only under "Other methods". Never suggest a Shia method to a Sunni user.

**Sunni, countries with one official method** (show one suggestion card):
| Country | Suggest | Confidence |
|---|---|---|
| Saudi Arabia | Umm al-Qura | High |
| Egypt | Egyptian | High |
| Pakistan, India, Bangladesh, Afghanistan | 18 degrees (Karachi) | High for Pakistan, medium for the rest |
| Turkey | Turkey (Diyanet) | High |
| Singapore, Malaysia, Indonesia, Brunei | Singapore (MUIS) | High for Singapore, medium for the rest |
| Kuwait | Kuwait | Medium high |
| Qatar | Qatar | Medium high |
| UAE | Dubai | Medium |
| Bahrain, Oman | Qatar | Low |
| Algeria | Muslim World League | Medium |
| Tunisia | 18 degrees (Karachi) | Medium |

**Sunni, countries with no single standard** (show the top three table):
| Country | The three, first is suggested |
|---|---|
| United Kingdom | Moonsighting Committee, 15 degrees (ISNA), 18 degrees (Karachi) |
| Ireland | Moonsighting Committee, 15 degrees (ISNA), 18 degrees (Karachi) |
| United States, Canada | Moonsighting Committee, 15 degrees (ISNA), 18 degrees (Karachi) |
| Rest of Europe (incl. France, Germany, Netherlands, Belgium, Scandinavia), Australia, New Zealand, South Africa, Morocco, Jordan, Russia, everywhere not listed | Muslim World League, Moonsighting Committee, 18 degrees (Karachi) |

Why three for the UK: UK mosques mostly differ by how early Fajr begins. Moonsighting (later Fajr), 15 degrees (middle) and 18 degrees (earliest Fajr) cover that whole spread. More options mostly repeat times already shown (Muslim World League gives the same Fajr as 18 degrees). Moonsighting came within about 6 minutes of East London Mosque's published timetable on 1 Jan and 15 Jun 2026, while Muslim World League was 17 to 24 minutes out in January. Keep this table in one data file (`src/core/suggestions.ts`) so it can be changed in one place.

**Travel.** The method is set once and kept. If the user updates location to a different country, the Times screen shows a quiet notice once: "You are in Saudi Arabia. Use Umm al-Qura here?" with buttons "Switch" and "Keep mine". Never switch on its own. An Umrah trip must not quietly change someone's home method.

### 5.4 Match my mosque (method step)

1. The user types the time **Fajr begins** at their mosque today (one time field, 12 or 24 hour as their system shows). The help line says to use the start time, not the jamaat time.
2. Work out today's Fajr for every method in the user's tradition at their place.
3. Sort by the difference. Show the closest two with their Fajr and a plain line: "2 minutes after your mosque", "6 minutes before your mosque".
4. Preselect the closest. The user confirms with "Use <method>". Nothing changes until they confirm.
5. If the closest is more than 15 minutes away: "None of the methods is close to your mosque. Your mosque may use its own timetable. Pick the closest, then use Match your mosque in Settings to adjust each prayer by minutes."
6. Flexibility: adding an Isha field later must be one small change (the matching function takes a list of known times).

### 5.5 Match your mosque minutes (Settings)

As on the phone: each of the six times can be moved 30 minutes earlier or later in 1 minute steps, plus "Use your mosque's board": choose a prayer, type the time on the board, and the minutes are worked out. Refuse a board time more than 30 minutes away, with the message and a "Choose a calculation method" button. One line warns that the difference changes with the seasons, so the closest method should be picked first and minutes used only for small gaps. "Reset all" appears once something is adjusted.

### 5.6 Hijri date and Ramadan

- Hijri date from the same source as the phone (check `PrayerEngine.kt` or its Hijri helper. The phone uses the Umm al-Qura table). In the browser, `Intl.DateTimeFormat` with the `islamic-umalqura` calendar is the first choice. Test it against the phone for every day from 2026 to 2030 (§13). If they differ, build a table from the phone's data and use that.
- Hijri date shift setting: minus 2 to plus 2 days. It moves Ramadan and Eid too.
- Ramadan windows (copy the phone 1.5.0 rules):
  - The Ramadan notice shows from **3 days before** Ramadan: title "Ramadan begins on <date>", line "From the first day, the Ramadan card shows suhoor and iftar times here. You can turn it off in Settings." Buttons: "Set suhoor reminder" and "Shift the date".
  - The Ramadan rows in Settings show from 3 days before to the last day of Ramadan.
  - In Ramadan the hero card label reads "Iftar" before Maghrib and "Suhoor ends" before Fajr. Under the countdown: "until you break your fast" or "until suhoor ends". Rows label Fajr "Suhoor ends" and Maghrib "Iftar".
  - "Shift the date" shows on days 1 and 2 only.
  - The footer's "Save as PDF" becomes "Ramadan timetable" in Ramadan, and from 30 days before.
  - Suhoor reminder: off by default. When on, a quiet message (and the chosen sound) a set time before Fajr: 15, 30 (default), 45 or 60 minutes.
  - Eid greeting on 1 Shawwal and 10 Dhul Hijjah, as a quiet notice on Times with the footnote that stays visible: "Follow your mosque for the date of Eid."
  - Umm al-Qura only: Isha plus 30 minutes during Ramadan.

---

## 6. Screens, copy and behaviour

All copy below is the English source. Translate it (§10). Keep wording plain and short. Every screen fits the 380 by 600 popup at normal size without scrolling, except Settings and Other methods, which scroll.

### 6.1 Times (the main screen)

Layout from top: header, hero card, today list, footer.
- **Header:** logo (32 px), the date in bold ("Tuesday 20 October") over the Hijri date ("9 Jumada al-Awwal 1448"), and the **town chip** at the end: pin icon, town, refresh arrow. Screen reader name: "Update location, London". Pressing it opens the location sheet.
- **Hero card:** label "Next prayer", glyph, prayer name, its time, the countdown (h:mm:ss, ticking every second), "until it begins", and the day's five bars (done filled, next outlined, still to come in the divider colour, so they are told apart by shape as well as colour). Sunrise is not a bar.
- **Today list:** six rows, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha.
  - Next: highlight fill, 3 px green bar on the leading edge, bold, a filled "Next" pill.
  - Current (a prayer whose time has begun and the next has not): surfaceHigh fill and a quieter "Now" pill. No "Now" between sunrise and Dhuhr.
  - Sunrise: dimmed, one size smaller. It is not a prayer.
- **Footer:** two equal solid buttons, "Save as PDF" and "Settings".
- **Notices** appear between the header and the hero card, one at a time, closable on Times: Ramadan coming, Eid, travel suggestion, "Prayer times are for Makkah until you set your location" (with "Set location"), "Alerts are blocked" (with "How to allow it").
- **Stop sound:** while the adhan is playing, a solid "Stop sound" button shows above the hero card.
- Far north: if the place is above 55 degrees latitude, a quiet notice once: "Fajr and Isha are estimated this far north in summer. Check with your mosque."

### 6.2 Update location sheet

- Title "Location", close X alone at the top end.
- "Times are for" and the current place card: town, region and country. If the place's time zone differs from the computer's, a line under it: "Times in <town>'s local time" (R7). The same line shows under the town chip on Times.
- Solid "Use my current location" button. Under it: "Chrome asks Google to estimate where you are. SajdaTime never receives it." (In Edge it says "Edge asks Microsoft". Detect the browser.)
- "Or find a place": a search field. Matches appear as you type (from the built in list, best matches first, up to 6), each with its region and country. Choosing one sets the place and closes the sheet.
- "Close" text link at the bottom end.
- Errors: permission refused (or the computer's own location service is off for the browser, which looks the same to the extension): "Location is turned off for this extension. Search for your town instead." Timeout (use 15 seconds): "Could not find your location. Search for your town instead."

### 6.3 First run (setup)

Show a step line "Step 2 of 6" and a six part progress bar. Back and Continue as two equal 56 px buttons at the bottom. Madhab is skipped for Shia (then "of 5").

**0. Welcome.** Language button at the top end: globe and the current language's own name ("English", "اردو"), opening the language list with "Computer language" first. Logo, "SajdaTime", "Prayer times and a gentle alert, right here on your computer.", "Free, with no ads and no account. Your times are worked out on this computer." Button "Begin".

**1. Disclaimer** (must be answered, no close). Title "Before you begin". The **short disclaimer text copied exactly from the phone app** (read its strings in all five languages, read only). The canvas shows a draft only. It must say: the author is not a Mufti, an Aalim or an expert in fiqh, the app was built with the help of AI and may contain mistakes, check anything doubtful with a local mosque or scholar, and if it differs from the mosque, follow the mosque. The dua request lives only in this disclaimer. Buttons "I understand" (56) and "Read in full" (52) which opens the full text. **Never remove, soften or hide the disclaimer, in any language.** It stays in Settings, About, permanently.

**2. School.** "Which school do you follow?" "This picks the calculation method for you. You can change it later in Settings." Two choice cards: Sunni, Shia.

**3. Madhab** (Sunni only). "Which madhab do you follow?" "It only changes when Asr begins. Every other time stays the same." Cards: "Hanafi" with "Asr begins when a shadow is twice its height", and "Shafi'i, Maliki or Hanbali" with "Asr begins when a shadow equals its height". Nothing is preselected (the canvas shows Hanafi selected only to show the selected look). Continue appears once one is chosen. (The phone has a Skip on this step: if its strings show one, add "Skip" with the same behaviour, which uses the standard Asr.)

**4. Location.** "Where are you?" "Your times are worked out on this computer from where you are." Button "Allow location". The Google line from §6.2. "Or type a place" with the same search. Once a place is set, a confirmation row shows it with a tick and Continue appears. At the foot: "Skip for now and use Makkah", with "Prayer times will be for Makkah until you set your location."

**5. Method.** Two layouts, chosen by §5.3:
- **One official method:** title "Calculation method", line "Suggested for <country>", one selected card with the method's name and today's Fajr and Isha large, then "Match my mosque" and "Other methods" side by side, then Back and Continue.
- **No single standard (UK and the others in §5.3):** title "Which times match your mosque?", line "Mosques in <country> work out Fajr and Isha differently. Pick the one closest to your mosque, or keep the suggested one." One compact table with a "Fajr / Isha" header and three radio rows (name, a short hint, today's two times). First row preselected and labelled "Suggested for the UK". UK hints: "Suggested for the UK", "ISNA", "Karachi, earliest Fajr". Then the two buttons, then Back and Continue.
- **Match my mosque** screen: back arrow, title, help line, time field, "Closest to your mosque" with two rows, button "Use <method>" (§5.4).
- **Other methods** screen: back arrow, title, "Today's Fajr and Isha in <town> are shown for each one, so you can compare with your mosque." Groups: "Suggested for <country>" (the one or three), then Europe, Middle East and Africa, South and East Asia, Shia (for Sunni users last, for Shia users first). Each row: name, a place hint, Fajr and Isha. Choosing one returns to the method step with it selected.

**6. Alerts and sound.** "Prayer alerts" "At each prayer you hear a sound and see a message. The message closes after 1 minute." "Sound" with a compact "Play" button. Radio rows: "Soft beep" (default, "Short and gentle"), "Adhan" ("The full call to prayer"), "Silent" ("The message only"). Quiet notice: "Chrome needs to be open" "If Chrome is closed or the computer is asleep, no alert can sound." (Edge says Edge.) Buttons Back and Finish. Finish opens Times.

Setup progress is saved after each step, so closing the popup mid way resumes at the same step.

### 6.4 Settings (scrolls)

Header: back arrow ("Back to times") and "Settings". Groups of rows in cards. Each row: 36 px icon tile, title, current value under it, chevron. A row opens a small sheet or sub screen with the choices, with "Close" or "Done".
- Warning notice at the top when notifications are blocked for the extension (§7, "Alerts blocked"): "Prayer alerts are blocked" "Chrome is not allowed to show notifications for SajdaTime, so the alert cannot appear." Buttons "How to allow it" (opens a help page on the extension's Pages site with Windows and Mac steps, including Focus Assist, Do Not Disturb and macOS Focus) and "Details". Never closable in Settings while the problem lasts. (Edge says Edge.)
- **Prayer times:** School, Madhab for Asr (Sunni only), Calculation method (opens the same picker as setup, including Match my mosque), Match your mosque (minutes, §5.5), Hijri date (shift).
- **Ramadan** (only from 3 days before until the last day): Ramadan card on or off (on by default), Suhoor reminder.
- **Alerts:** Prayer alerts (each of the five on or off, all on by default), Sound (Soft beep, Adhan, Silent, with Play), Reminder before prayer (off by default, 5 to 30 minutes, a quiet message with no sound). At the foot of the group a 48 px solid button "Send a test alert" (R9) with the line "If nothing appears, check your computer's notification and Focus settings." It shows a sample notification titled "Test alert" with the message "This is how a prayer alert looks." and plays the chosen sound.
- **Appearance:** Theme, a three part selector "System, Light, Dark" (System by default). Language ("Computer language" first, then the five in their own names).
- **About:** Disclaimer (full text), Send feedback (opens an email to [[EMAIL_1fb075de]]), Rate SajdaTime (opens the extension's store page in the right store for the browser), Privacy policy (opens the Pages privacy page), Credits (adhan-js licence, GeoNames city data, adhan recordings with their licences, as the phone credits them).

### 6.5 Save as PDF

Opens a new tab with the timetable and the print dialog. A4 portrait. Header: logo, "Prayer times for <town>", the month and its Hijri months, the method and the Asr school. Table: Date, Day, Hijri, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha. Footnote for a clock change in the month ("Clocks go back on Sunday 25 October. Times from that day are in GMT."). Footer line: "Worked out by SajdaTime for the place above. Not supplied by any mosque, scholar or authority. If your mosque's times differ, follow your mosque." Right to left for Urdu and Arabic, with times left to right. Text at least 12 pt. The Ramadan timetable has the same layout with columns Day of Ramadan, Date, Suhoor ends (Fajr), Iftar (Maghrib) and the other times. The page has "Print or save" and "Next month" and "Previous month" buttons that do not print.

---

## 7. Alerts, sound and the badge

**The alert.** At each enabled prayer, a system notification:
- Title: "<Prayer>, <time>" (for example "Asr, 4:05 pm"). Message: "It is time for Asr in London." In Ramadan at Maghrib: "It is time for Maghrib. You can break your fast." Icon: the logo.
- `silent: true` on the notification (the extension plays its own sound, so the system does not add a second). `requireInteraction: true` so that, where the operating system allows, it stays on screen until the extension clears it. `iconUrl` is required by Chrome: use the 128 px logo.
- One button "Stop sound" when the sound is the adhan (Chrome allows up to two buttons).
- Cleared after **60 seconds** by `chrome.notifications.clear` from a non repeating alarm named for the notification (not a timer). Chrome's minimum alarm delay is 30 seconds, so 60 is safe. If the adhan is still playing after the message is cleared, the popup still shows "Stop sound".
- **What the extension can and cannot promise (D10).** It promises the message is gone within 1 minute. Whether it stays on screen for the whole minute is the operating system's choice: Windows and macOS show Chrome's notifications through their own notification systems and may slide a banner away after a few seconds (it then sits in the notification centre until cleared). Write the copy as "closes after 1 minute", which is true, and never "stays for 1 minute".
- Clicking the notification: call `chrome.action.openPopup()` inside a try block (Chrome 127 and later). If it throws (no active window, or the browser refuses), just clear the notification.
- Reminder before prayer and suhoor reminder: same, with "Asr in 15 minutes" style titles, no sound unless it is the suhoor reminder.
- Notifications are read by screen readers as they appear, so the title alone must carry the meaning ("Asr, 4:05 pm"), never just "SajdaTime".

**The sound.**
- Soft beep: made in code with the Web Audio API in the offscreen page (R12), two notes, under 1.5 seconds, with a fade in and out so it never clicks. No file and no licence to track. Ali hears it at the M7 check.
- Adhan: reuse the phone's built in recordings (read only): Sunni "Beautiful adhan.ogg" (CC0) and Shia "AzaanMaahur.ogg" by Saeed Hatamzadeh-Varmazyar (CC BY-SA 4.0). The adhan follows the user's school. Credit both exactly as the phone does, in Credits and in the store description's credits line (CC BY-SA asks for attribution and the licence name). Check the extension size stays reasonable (target under 10 MB in total).
- Volume follows the computer's volume. No volume slider in version 1.
- Played by the offscreen page. Stopped by the "Stop sound" button in the notification or the popup, which sends a "stop" message to the offscreen page through the service worker.

**The badge.**
- Text: under 1 hour, minutes with "m" ("54m", "5m", "1m"). From 1 hour, hours "h" minutes ("1h54", "9h05"). From 10 hours, hours only ("11h"). Minutes are rounded up, so it never shows "0m". Never more than four characters, which is all Chrome's badge can show.
- Background: primary green #0B5A43 (`setBadgeBackgroundColor`). Text: white (`setBadgeTextColor`, Chrome 110 and later). Both are set every time the badge text is set, because a service worker restart does not keep them.
- Tooltip (the icon's title): "SajdaTime: Maghrib in 1 hour 54 minutes (5:59 pm)", in the user's language.
- Before setup is finished: no badge, tooltip "SajdaTime: set up your prayer times".
- If location is not set (Makkah fallback): the badge works for Makkah, the tooltip says "for Makkah".

**Alerts blocked.** The extension can only see one thing: `chrome.notifications.getPermissionLevel()` returning `"denied"` (the user turned off notifications for this extension in the browser). Check it when the popup opens and show the amber notice in Settings and Times (§6.4) while it says denied. The extension **cannot** see when the operating system hides notifications (Windows Focus Assist or Do Not Disturb, macOS Focus, or Chrome not allowed in the system's notification settings): `notifications.create` still succeeds. Do not try to detect that with a hidden test notification, it does not work and it annoys people. Instead the help page explains those settings and the "Send a test alert" button (R9) lets the user check.

---

## 8. Location and the city list

- **Where location comes from:** `navigator.geolocation` called from the popup. The Chrome docs say popups can call it when the manifest has the `geolocation` permission, and that without the permission the call fails at once. The docs do not say whether the user still sees a browser prompt, so find out in the end to end test and record it in `DECISIONS.md`. Either way the extension handles refusal with the message in §6.2. The browser asks Google (Chrome) or Microsoft (Edge) to estimate the position from Wi-Fi and the internet address. The extension stores the coordinates locally and sends them nowhere. If the popup cannot get a position because the popup closes too early or the browser refuses geolocation in popups, use the shared offscreen document (§4.5) with the `GEOLOCATION` reason as the fallback, and record which one works.
- **Precision:** store coordinates rounded to 2 decimal places (about 1 km). That is plenty for prayer times (a minute or less) and kinder to privacy.
- **The city list:** built from GeoNames `cities5000` (places of 5,000 people or more, CC BY 4.0) plus the admin region names. A tool in `tools/` builds a compact file: name, ASCII name, other common names where small, country code, region, latitude, longitude, population and **time zone** (GeoNames' `timezone` column, needed for R7). Credit GeoNames in Credits and the privacy page. Target under 2 MB packed. If it is much larger, drop alternate names first and say so in `DECISIONS.md`.
- **Search and speed:** the list is loaded only when the location sheet or the setup location step opens, never on every popup open. Build a small index at load (first three letters of each word to a list of entries) so each keystroke searches a few hundred entries, not 50,000. Debounce typing by 120 ms. Loading plus the first search must finish in under 300 ms on a 2020 laptop, and the Times screen must never wait for it. Matching is case and accent insensitive, matches the start of words, best match and larger towns first. Arabic and Urdu users can type in Latin letters. Arabic and Urdu script names are a nice to have, not required for version 1.
- **Town label from coordinates:** the nearest town in the list. Within 20 km: its name ("Guildford"). 20 to 100 km: "Near <town>". Over 100 km: "Your location". Times are always exact for the coordinates, whatever the label.
- **Country** for the method suggestion comes from the chosen town (or the nearest town).
- **Refresh:** if the user chose "Use my current location", the popup quietly asks for a new position when it opens and the last one is more than 1 hour old. Change the times and label only if it moved more than 5 km. If the country changed, show the travel notice (§5.3).
- **Makkah fallback** when location is skipped, as on the phone, with the notice on Times. Makkah's times are shown in Makkah's time zone (Asia/Riyadh), with the "Times in Makkah's local time" line (R7).

---

## 9. Privacy

- No account, no server, no analytics, no usage counts, no ads, no network requests by the extension itself. The only outside service involved is the browser's own location service, used only when the user presses "Use my current location" or "Allow location".
- Never write that location "never leaves the device". True wording: "Your times are worked out on this computer. SajdaTime never receives your location. When you use your current location, Chrome asks Google (or Edge asks Microsoft) to estimate it."
- Settings stay in this browser on this computer (not synced).
- **Privacy page:** `docs/privacy.html` in the extension repo, served by GitHub Pages, dated the day it is published. Same voice as the phone's privacy page (read it, read only). Sections: who makes it (Ali Imran Khan, contact [[EMAIL_1fb075de]]), what is stored and where (settings and rounded coordinates, in the browser's local extension storage on this computer, deleted when the extension is removed), what the browser's location service does, permissions and why, no data sold or shared, children, changes, contact. Publish it before the store submission, because both stores require a working privacy policy link for an extension that handles location, even on the device only.
- Only [[EMAIL_1fb075de]] is ever shown publicly.

---

## 10. Languages

- Five: English (source), Urdu, Arabic, Turkish, Indonesian. Default: the browser's language if it is one of the five, else English. The user can pick any of the five in Settings and on the Welcome screen. "Computer language" is first in the list.
- `chrome.i18n` cannot switch language inside the extension (it follows the browser's language and needs a restart to change), so use your own small message files (`src/i18n/*.json`, codes `en`, `ur`, `ar`, `tr`, `id`) for all screen text, and `_locales` only for the extension's name and description in the store and browser. `_locales` has no Urdu, because Chrome does not list `ur` as a supported locale (R13).
- **Reuse the phone's translations** for every shared term and sentence (prayer names, madhab names, disclaimer, Ramadan and Eid lines, settings labels). Read them from the phone repo's `values-ur`, `values-ar`, `values-tr`, `values-in` strings, read only. Android's folder `values-in` is Indonesian, which the browser calls `id`. Translate only the new extension sentences. Claude translates and checks its own work, no native speaker review (Ali's standing decision). Take particular care with prayer and madhab names.
- Right to left for Urdu and Arabic: set `dir="rtl"` and `lang` on the root. Layout mirrors. Times, countdowns and numbers stay left to right (isolate them). Mirror chevrons and back arrows, never clocks, ticks or prayer glyphs.
- Arabic uses Western digits everywhere (`ar-u-nu-latn`).
- Urdu font: use the system font stack first. Decision for version 1: no bundled font. If Urdu reads poorly in screenshots on Windows or Mac, show Ali a Naskh and a Nastaliq option (screenshots) and let him choose.
- Labels wrap onto two lines rather than cut words. Test the longest language (often Indonesian or Turkish) at 200% zoom.
- Turkish casing: never uppercase in code.
- A translation check test: every key exists in all five files, no empty strings, placeholders match.

---

## 11. Accessibility

- Real buttons, links, radio groups and labels. Keyboard reachable, visible focus ring in primary green, logical tab order, Escape closes sheets.
- Screen reader names for icon buttons ("Update location, London", "Back to times", "Close").
- The countdown is not announced every second. The hero card has a label like "Next prayer Asr at 4:05 pm, in 1 hour 24 minutes", updated each minute.
- Next and Now are shown by three signals each (fill, bar or pill, and text), never colour alone.
- Works at 200% browser zoom (the popup may scroll then, it must never clip).
- Respect "reduce motion": no animation beyond simple fades.

---

## 12. Store listings and release

**Accounts (Ali's buttons).** On day one (part of the day one question, §1), Ali opens:
- the Chrome Web Store developer account at the Developer Dashboard (a registration fee paid once, 5 US dollars when last checked, plus a verified developer email, and the Google account must have 2 step verification on). The developer email cannot be changed later, so he picks [[EMAIL_1fb075de]]. The dashboard also asks whether he is a trader under EU consumer law: he is not (free, no revenue, no business), and
- a Microsoft Partner Center account enrolled in the Microsoft Edge program (free, needs a personal Microsoft account, not a work or school one).
Walk him through one screen at a time with screenshots. Never handle his payment details.

**Listing text** in `docs/store/LISTING.md`. Languages: English, Arabic, Turkish and Indonesian in both stores, plus Urdu wherever a store offers it (Chrome does not, R13). Keep under each store's limits: Chrome's short summary is 132 characters and its description 16,000. Edge's description must be at least 250 and at most 10,000 characters. Plain and accurate. Only claim what the shipped build does. Include the disclaimer phrase used on Play: "not supplied by any mosque, scholar or authority", and the adhan credits with their licence names. Single purpose statement: "Shows Islamic prayer times for the user's location and alerts at each prayer." Permission reasons:
- alarms: to alert at prayer times and refresh the countdown.
- notifications: to show the prayer alert.
- storage: to keep settings on this computer.
- offscreen: to play the alert sound (a service worker cannot).
- geolocation: to work out prayer times for where the user is, only when they ask.
**Data use answers (R10).** Chrome's privacy practices form counts data that stays on the device as handled. Tick **Location** and nothing else. Certify: not sold to third parties, not used or transferred for purposes unrelated to the extension's single purpose, not used for creditworthiness or lending. Say the data is stored on the user's computer only and the developer never receives it. Give the privacy page link. Edge asks the same in its own words. Prepare the answers, Ali checks and presses the buttons.

**Store images.** Five screenshots at 1280 by 800 (Times light, Times dark, method step, Ramadan, Settings or Urdu), a small promo tile 440 by 280, and for Edge a 300 by 300 store logo. Show Ali before upload.

**Packaging.** `npm run build` makes `dist/`. `npm run package` makes `sajdatime-extension-<version>.zip` for both stores (one zip, uploaded twice). Version 1.0.0.

**Submission.** Ali uploads the zip and presses Submit in each store, guided screen by screen. Record the date. Chrome usually answers within a few days, longer for a new account. Edge says up to seven business days. Both send email on review results, and the listing page shows the live version.

**After it is live.** Put both store links into the Rate row and the privacy page (until then the Rate row opens the store's search page for "SajdaTime", §15). The store item IDs are known only after the first upload. The phone repo is not touched. Update GBrain and `HANDOVER.md`.

---

## 13. Testing (definition of done)

**Unit tests (Vitest)**
- Golden prayer times: for London, Birmingham, Bradford, Glasgow, Makkah, Cairo, Karachi, Istanbul, Jakarta, Kuala Lumpur, New York, Toronto, Sydney, Tehran, Reykjavik (high latitude): every method, both madhabs, on 1 Jan, 20 Mar, 15 Jun, 20 Oct and 21 Dec 2026, and every day of Ramadan 1448 for London. Expected values come from the **phone engine**: build them with a small read only harness on the Mac that calls the phone's `:core` `PrayerEngine` (or its tests) and writes `tests/golden/*.json`. Same minute required, except the exceptions in §5.1. Spot check 20 of them against Aladhan during development.
- The canvas fixtures: London (51.5074, minus 0.1278), 20 Oct 2026, Moonsighting, Hanafi: Fajr 5:57 am, Sunrise 7:33 am, Dhuhr 12:50 pm, Asr 4:05 pm, Maghrib 5:59 pm, Isha 7:21 pm. 19 Feb 2027: Fajr 5:31 am, Sunrise 7:07 am, Dhuhr 12:19 pm, Asr 3:32 pm, Maghrib 5:25 pm, Isha 6:47 pm. Other methods on 20 Oct (Fajr, Isha): ISNA 6:01, 7:29. Karachi 5:41, 7:48. Muslim World League 5:41, 7:42. The reviewer re ran these with adhan 4.4.6 on 20 Oct 2026: every value matched except Maghrib on 20 Oct, which adhan-js gives as **6:00 pm**, not 5:59. The phone engine decides. If the phone also says 6:00, correct the canvas and the badge example in §7.
- High latitude: no method gives Fajr equal to Isha, or Isha after Fajr, in London or Glasgow on 15 Jun. Every method in Reykjavik on 15 Jun returns six valid times in order (expected with one seventh: Fajr 2:32 am, Isha 12:25 am the next day).
- Hijri: every day 2026 to 2030 equals the phone. Ramadan 1448 starts 8 Feb 2027.
- Suggestions: every row of §5.3, Shia never gets Sunni, Sunni never gets Shia.
- Match my mosque: ordering, ties, the 15 minute message.
- Badge text formatting for 0 to 24 hours.
- Scheduling with a fake clock (the scheduler is a pure function from settings, place and "now" to a list of alarm names and instants, so it can be tested without Chrome): alarms for the day, midnight rollover, clock change days (25 Oct 2026, 28 Mar 2027), time zone change, late alarm over 5 minutes skipped, a place in another time zone (Makkah fallback from London).
- Settings migration: an old `schemaVersion` object migrates to the current one, a damaged object falls back to defaults without losing the "setup finished" flag if it can be read.
- City list: search order, the 20 and 100 km label rules, country lookup, time zone lookup, load and first search under 300 ms.
- Contrast test (§3.2). Translation check (§10).

**End to end (Playwright, its own Chromium with the unpacked extension)**
- Load with `chromium.launchPersistentContext` and the `--disable-extensions-except` and `--load-extension` flags, `channel: 'chromium'` (headless works with that channel). Get the service worker from `context.serviceWorkers()` or the `serviceworker` event. Expect "Service worker restarted" errors if a call is in flight when Chrome suspends it, so keep each `evaluate` short.
- Time cannot be fast forwarded for `chrome.alarms`, and alarms under 30 seconds are not honoured. So the background code exposes, in test builds only, a message handler that runs the same function the `onAlarm` listener runs, with a given alarm name. Tests trigger a prayer alarm that way, then read `chrome.notifications.getAll` and the offscreen document's state back through the same hook. The 60 second clear is tested by triggering its alarm the same way. Real alarm creation is tested once with `chrome.alarms.getAll` after a settings change.
- Full first run for a Sunni UK user and a Shia user, with a fixed position (Playwright `geolocation` in the context options) and a fixed clock (`page.clock`).
- Times screen states: normal, Ramadan eve notice, Ramadan day, Eid, Makkah fallback, alerts blocked, travel notice.
- Settings changes reschedule alarms (read them back with `chrome.alarms.getAll` through the test hook).
- A prayer alert fires, the notification exists and is cleared by the clear alarm, and the offscreen document exists and reports playing. Headless Chromium shows no notification on screen, which is fine, the API state is what is checked.
- Keyboard: every screen can be completed with Tab, arrows, Enter and Escape alone. Run axe (`@axe-core/playwright`) on every screen in both themes and fail on serious or critical issues.
- Save as PDF opens the timetable page with the right rows.
- No network: listen to every request in the context during the whole run and fail if the extension's origin makes any request other than to its own files. Also grep `dist/` for `http://` and `https://` and allow only the mailto, store, GitHub Pages and credit links.
- Screenshots of every screen in light, dark, 200% zoom, Urdu, Arabic, saved to `tests/screenshots/`, shown to Ali as one private page or in the chat before the store submission.
- Edge: not tested in an automated browser (R8). Record it.

**Release gate (all must pass):** unit tests, end to end tests, contrast, axe, translations, `npm run build` with no warnings that matter, manifest permissions exactly as §4.4, no network requests, package under 10 MB with no source maps, screenshots reviewed by Ali. An independent review (a fresh agent that has not seen the work) of the code and the copy before submission.

**What is not tested and is accepted:** Windows (unless Ali has a Windows computer to try), Edge, how long each operating system keeps the notification on screen, browser versions below 127, real users. Write this down in `HANDOVER.md`.

---

## 14. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Start check | Phone 1.5.0 live, design approved, repo created, both store accounts opened (or listed under "waiting for Ali"), this plan in `docs/PLAN.md`, `CLAUDE.md` written |
| M1 | Engine | `src/core` with methods, suggestions, Hijri, Ramadan, golden tests green |
| M2 | Popup shell | Tokens, components, Times screen with live data, light and dark, screenshots |
| M3 | First run | All setup steps, method picker, Match my mosque, Other methods |
| M4 | Background | Alarms, badge, alerts, sound, notification clearing, alerts blocked check |
| M5 | Settings and sheets | Every Settings row, location sheet, mosque minutes |
| M6 | Ramadan and PDF | Ramadan states, suhoor reminder, Eid, both timetables |
| M7 | Languages and accessibility | Five languages, right to left, keyboard, screen reader, 200% |
| M8 | Store ready | Privacy page live, listing text, images, package, release gate, independent review |
| M9 | Submitted | Ali submits to both stores (by 4 Jan 2027, latest 25 Jan 2027) |
| M10 | Live | Both listings live, records updated |

Show Ali screenshots at the end of M2, M3 and M7, and before M9. Each is a short check, not a long review.

---

## 15. Open points with their defaults (do not block on these)

| Point | Default used | Ask Ali when |
|---|---|---|
| Match your mosque minutes in setup (Ali listed it in his journey) | In Settings only. The method step has "Match my mosque" for the method | Show at the M3 screenshots |
| Urdu font | System font | Only if Urdu screenshots read poorly, then show him a Naskh and a Nastaliq screenshot |
| Soft beep sound | Two note tone made in code (R12) | Play it to him at the M7 check, do not block on it |
| Store links in the Rate row | Store search page until the listing exists | After it is live, update |
| Edge listing at the same time as Chrome | Yes | Only if Partner Center blocks it |
| Edge testing | Not automated (R8). Ali may try the unpacked build himself | Never ask him to |
| Does the popup show a browser prompt for location | Handle both. Record what happens in `DECISIONS.md` | Never |
| The phone's Hijri source differs from `islamic-umalqura` | Build a table from the phone's data (§5.6) | Never, just record it |
| The phone doubles the Turkey offsets or has unusable high latitude times | Extension follows §5.1, tell Ali in one line | One line, no question |
| Whether the phone app should also change its UK default | Not in scope. The phone is separate | Never raise it here. Ali decides that in the phone project |

---

## 16. Where each rule lives (change checklist)

When Ali changes something, update every place it appears:
- Method list or parameters: §5.2, `src/core/methods.ts`, golden tests, Other methods groups, Credits.
- Suggestions by country: §5.3, `src/core/suggestions.ts`, tests, store text if it mentions it.
- A screen or its words: §6, `src/i18n/*.json` in all five languages, screenshots, store screenshots if shown there.
- Alerts or sound: §7, background code, Settings, setup step 6, store text.
- Privacy or permissions: §9, §4.4, `docs/privacy.html`, store data answers.
- Dates: §1, §14, `HANDOVER.md`, GBrain.
- A reviewer decision (§2.1) or an open point default (§15): the row itself, then the section it points to.
Then a dated line in `DECISIONS.md`.

---

## 17. Records and memory

- **`CLAUDE.md`** in the extension repo: the standing rules from §0 in short, the separation from the phone repo, where the truth lives, the release gate, and "update HANDOVER and GBrain with every commit that moves the project".
- **`docs/HANDOVER.md`**: a dated STATE OF PLAY block at the top (what is done, what is next, what is waiting for Ali, what was not tested), history underneath.
- **`docs/DECISIONS.md`**: one dated line per decision or change: what, why, what it replaced.
- **GBrain**: `projects/sajdatime-extension` (status and summary) and `projects/sajdatime-extension-plan` (this full plan), both separate from `projects/sajdatime`. Overwrite in place, keep lean and current. Once the repo exists, its `docs/PLAN.md` wins and this GBrain copy is refreshed from it when the plan changes.
- **claude.ai SajdaTime project:** this plan is saved there as a document. If the plan changes in the repo, the repo copy wins.
- Commits on branches, pull requests for Ali to merge, with the commit and pull request attribution lines your session gives you.

---

## 18. Research behind the method picker (summary)

Full report: "Prayer method selection UX" (sent to Ali, 20 Oct 2026). Key points:
- Most people keep the default they are given (about 80% in pension studies), so the suggestion has to be right.
- Choice overload happens when options are many, similar, technical and the person has no preference. That is exactly a list of 14 methods. Showing the result (today's times) turns it into something people can check.
- Muslim Pro, Pillars, Athan and Guidance pick automatically by country and hide the choice in Settings. None found shows times beside each method. Mawaqit follows mosque timetables.
- UK mosques split between the London Unified timetable (East London Mosque, Regent's Park), 18 degrees (the 1983 Bradford position) and other local rules. Kirklees alone has over 50 different timetables.
- Moonsighting Committee came within about 6 minutes of East London Mosque on 1 Jan and 15 Jun 2026. Muslim World League was 17 to 24 minutes out in January, and unusable in June without a high latitude rule.
- Ramadan care: Moonsighting puts the end of suhoor about 15 minutes later than 18 degrees in February in London. That is why 18 degrees sits in the UK's top three, and why the screen says to match your mosque.
- Dropdowns cause selection errors, so the picker uses visible radio rows in two levels at most.

---

## 19. Reviewer flags, resolved

Ali accepted the reviewer's recommendations on 20 Oct 2026 ("take fable suggestions for that"). They are now decisions.

- **D10, the one minute message (accepted).** The alert is cleared after one minute. Windows and macOS decide how long the banner stays on screen before it moves to the notification centre. Copy says "closes after 1 minute", never "stays for 1 minute". No extension window instead of a notification.
- **Timeline (accepted, simplified).** Ali has no planned absence. The two store accounts are opened on day one so identity checks do not delay the 4 January submit target.
- **Urdu store listing (accepted).** No Urdu Chrome Web Store listing, because Chrome has no Urdu locale. Urdu is fully supported inside the extension.
- **One minute fixture (accepted).** Where the canvas and the phone engine differ by a minute (Maghrib 20 Oct 2026, 6:00 pm against the canvas's 5:59 pm), the phone engine wins and the canvas is corrected.
- **The phone app (out of scope here).** Two possible phone issues were found while checking the library: the Turkey Diyanet offsets must not be added twice, and methods other than Moonsighting Committee need the one seventh high latitude rule above 48 degrees. Claude Code tells Ali in one line if the phone has either problem. They are decided in the phone project, never in this one.

---

## 20. Review log (20 Oct 2026, independent review, version 1.1)

**Changed**
- Header set to version 1.1, signed off, with a pointer to this log.
- §1: added a day one checklist so the first session knows exactly what to do and asks Ali once.
- §2.1: added thirteen reviewer decisions (R1 to R13) closing every place where Claude Code would otherwise have had to stop and ask.
- §4.2: Preact decided, adhan pinned to 4.4.6, Manifest V3 content security rules and no obfuscation added.
- §4.4: `default_locale`, keyboard shortcut, install warning text, `minimum_chrome_version` 127, `_locales` without Urdu.
- §4.5: alarms are cleared on extension update, so they are rebuilt on install, update, startup and every service worker start. One offscreen document only, `chrome.runtime` only inside it, closes 30 seconds after audio stops. Storage ownership and browser detection added.
- §5.1: times shown in the place's time zone (the Makkah fallback was wrong without it), Singapore rounding, polar safety, Moonsighting Committee's 55 degree rule, exception (c) for the Turkey offsets.
- §5.2: corrected Turkey (the library already has the Diyanet offsets, the plan would have applied them twice), listed every built in offset, gave the exact Jafari constructor.
- §6.2, §6.4: time zone line, alerts blocked wording made true, "Send a test alert" button.
- §7: `requireInteraction`, `iconUrl`, what D10 can and cannot promise, notification click opens the popup where Chrome allows, screen reader note, soft beep made in code, Stop sound message path, badge colours reset on every update. Alerts blocked detection corrected: only `getPermissionLevel` is observable, a hidden test notification cannot detect Focus modes.
- §8: geolocation prompt claim softened to what the docs actually say, time zone column, city list loaded lazily with an index and a speed target.
- §9: what is stored and why the privacy page is required even for on device data.
- §10: Urdu locale limit, `values-in` to `id` mapping.
- §12: account timing moved to day one, developer email cannot change, trader declaration, Edge account needs a personal Microsoft account, listing languages and length limits, store privacy answers corrected to declare Location (saying "no data" would have been false and a rejection risk), Edge logo size, review times, garbled "after it is live" sentence fixed.
- §13: how to load the extension in Playwright, how to test alarms without waiting, axe and keyboard checks, migration tests, network check method, Edge testing removed (Playwright cannot load extensions into Edge), fixture discrepancy recorded (Maghrib 6:00 pm), Reykjavik validity test.
- §14, §15, §16: store accounts in M0, five new open points with defaults, checklist entry for reviewer decisions.
- Dates checked: 20 Oct 2026 Tuesday, 9 Nov 2026 Monday, 4 and 25 Jan 2027 Mondays, 8 Feb 2027 Monday, 19 Feb 2027 Friday, 25 Oct 2026 and 28 Mar 2027 Sundays. Hijri: 20 Oct 2026 is 9 Jumada al-Awwal 1448, 19 Feb 2027 is 12 Ramadan 1448, 1 Ramadan 1448 is 8 Feb 2027, 1 Shawwal 1448 is 9 Mar 2027 (Umm al-Qura, hijridate 2.3.0).

**Verified, with source and date checked (all 20 Oct 2026)**
- chrome.alarms: 30 second minimum, cleared on extension update, missed alarms fire after wake. https://developer.chrome.com/docs/extensions/reference/api/alarms
- Service worker lifetime: 30 seconds idle, 5 minutes per event. https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- chrome.offscreen: Chrome 109, one document at a time, reasons AUDIO_PLAYBACK and GEOLOCATION, closes 30 seconds after audio stops, only chrome.runtime inside. https://developer.chrome.com/docs/extensions/reference/api/offscreen
- Geolocation in extensions: popups can call it with the manifest permission, service workers cannot, offscreen document route. https://developer.chrome.com/docs/extensions/how-to/web-platform/geolocation
- Install warnings: notifications "Display notifications", geolocation "Detect your physical location", none for alarms, storage, offscreen. https://developer.chrome.com/docs/extensions/reference/permissions-list
- chrome.action: popup 25 by 25 to 800 by 600, about four badge characters, setBadgeTextColor Chrome 110, openPopup Chrome 127 for all extensions. https://developer.chrome.com/docs/extensions/reference/api/action
- chrome.notifications: silent (Chrome 70), requireInteraction (Chrome 50), up to two buttons, iconUrl required, getPermissionLevel granted or denied, Mac shows only the first list item. https://developer.chrome.com/docs/extensions/reference/api/notifications
- chrome.i18n: supported locales include en, ar, tr, id but not ur, default_locale required. https://developer.chrome.com/docs/extensions/reference/api/i18n
- Edge supports alarms, notifications, storage, offscreen, action, i18n and runtime in MV3. https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support
- Chrome Web Store user data: data handled only on the device still counts, privacy policy required. https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Chrome Web Store registration: one time fee, developer email cannot change. https://developer.chrome.com/docs/webstore/register
- Trader and non trader self declaration. https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure
- Edge Add-ons: free registration, personal Microsoft account, Partner Center. https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account
- Edge listing: logo 300 by 300, screenshots 640 by 480 or 1280 by 800 (up to 6), promo tile 440 by 280, description 250 to 10,000 characters, up to seven business days. https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
- Playwright extensions: persistent context, channel chromium, headless allowed, Chrome and Edge no longer accept the side loading flags, service worker suspends after about 30 seconds. https://playwright.dev/docs/chrome-extensions
- adhan-js 4.4.6 (npm latest, published 31 Aug 2026): every method's angles, intervals and built in offsets, Tehran's maghribAngle 4.5, maghribAngle applied for any method, no Jafari, HighLatitudeRule.recommended threshold 48, Moonsighting Committee one seventh from 55 degrees, default rule middle of the night, Umm al-Qura Ramadan plus 30 by hand. https://github.com/batoulapps/adhan-js (src/CalculationMethod.ts, src/CalculationParameters.ts, src/HighLatitudeRule.ts, METHODS.md) and the installed package.
- Fixtures re run with adhan 4.4.6 in Node 22: London 20 Oct 2026 and 19 Feb 2027 match the canvas except Maghrib 20 Oct (6:00 pm). Muslim World League London 15 Jun 2026: 1:01 am both with the default rule, 3:39 am and 10:23 pm with one seventh.

**Not verified**
- The exact Chrome Web Store fee today (5 US dollars historically, the current page does not print the amount) and whether 2 step verification is still demanded at sign up. Ali will see both on screen.
- Whether a browser prompt appears when the popup calls geolocation with the manifest permission. Handled either way, to be recorded in the first end to end run.
- How long Windows and macOS keep a Chrome notification on screen. Treated as outside the extension's control (§7, §19).
- Chrome Web Store summary and description limits (132 and 16,000 characters) are from memory, not re read today. Check them on the dashboard when writing the listing.
- Whether Edge Add-ons offers an Urdu listing language. Check in Partner Center.

- 20 Oct 2026, after sign off: Ali accepted every reviewer recommendation in §19, and said his Umrah plan has changed, so all references to him being away were removed.
- 21 Oct 2026: stored in GBrain as `projects/sajdatime-extension-plan`, with the summary page `projects/sajdatime-extension` pointing here.
