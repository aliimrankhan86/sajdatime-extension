# Build brief: location found, prayer alerts, Ramadan

**Written:** 27 October 2026, by Claude (Opus), for DeepSeek to build.
**Asked for by Ali:** "when the user lets auto select the location then the extension should tell them visually we have found their location", "in settings there should be notification, so user can select their type of notification to appear with some nudge sound or adhan", and "plan for the Ramadan display always".
**Starting point:** `main` at the commit that adds this file.

This brief turns three requests into four steps: 1, 2, 3a and 3b. Each step is one commit, pushed to `main`. **After each step, stop and report. Claude reviews it before the next step starts.** Do not run ahead.

**Status note, 28 October 2026:** this brief covers only Steps 1 to 3b. Steps 5 (the Times screen re-plan), 6 (the Settings restructure) and 7 (the badge and reminders) of [`docs/UX-PLAN.md`](UX-PLAN.md) were briefed separately and are built; see `docs/DECISIONS.md` D-032, D-033, D-034, D-035 and D-036 and the top of `docs/HANDOVER.md`. D-035 is the Step 6 review fix: one line rows at 56 to 64 pixels, a heading only over two or more rows, each method named once, and the compact Play button beside the Sound title that Step 2 below already asked for. D-036 is Step 7: the toolbar badge, the Reminder before prayer and Suhoor reminder rows and sheets, the three new alarm names, and the two P3 fixes from the Step 6 PASS review.

`docs/PLAN.md` is the full design. This brief says which parts of it to build now, and decides the points the plan leaves open. Where this brief and `PLAN.md` disagree, this brief wins for these steps. Where `DECISIONS.md` disagrees with either, `DECISIONS.md` wins.

## Rules for every step

- **Security.** Follow `docs/SECURITY.md` on every step and paste its checklist in every report. A FAIL there means the step is not finished.

- **Words.** Use the exact English words written in this brief or in the `PLAN.md` section it points to. Do not write, shorten or "improve" any text a user sees. If a screen needs a word this brief does not give, stop and ask; do not invent one. No hyphens or em dashes in user text.
- **Design.** Quiet Glass tokens from `src/popup/styles.css` only, no new hex values. Every action is a solid green button with bold white text. Every control at least 44 pixels. Nothing below 14 pixels. Light and dark.
- **Privacy.** No network request, no remote code, no content script, no analytics. Only the permissions this brief adds.
- **Keep.** The disclaimer stays the first row of Settings, untouched. The School choice, the Shia Maghrib rule and the popup width (fixed `width: 380px`, no `max-width`) stay as they are.
- **Tests that can fail.** Every new test must fail against the code before your change. Say in the report how you checked that. A test that only repeats the code's own output is not a test.
- **Real popup.** `tests/e2e/popup-width.test.ts` must still pass: 380 by 600 with Settings visible.
- **Checks before each commit:** `npm run check`, `npm run test:e2e`, then `git status` must be clean. Paste all three results in the report.
- **Commit message:** what was wrong or missing, why this way, what was verified, what was not.
- Update `docs/HANDOVER.md`, `docs/DECISIONS.md` (one entry per decision below) and the `docs/REVIEW-REQUEST.md` Baseline line in the same commit.

---

## Step 1: tell the user their location was found

### What is wrong now

Pressing "Use my location" (first run, and the Location sheet in Settings) saves the place as **"My location"** with country `ZZ`, and goes straight on. The user sees no confirmation, the header says "My location" instead of a town, and the unknown country means the method suggestion falls back to Muslim World League even in Pakistan or Saudi Arabia. That last point is the recorded P2 "the default method survives a place change"; this step removes its cause for located users.

### What to build

1. **Name the place offline.** Add `nearestCity(latitude, longitude, cities)` in `src/core/cities.ts`. It returns the nearest city from the bundled `public/data/cities.json` by great circle distance. No network. Load the list only after the browser returns a position, exactly as the search loads it now.
2. In `src/settings/place.ts`, `placeFromBrowser` takes the nearest city:
   - `name`: the city's name.
   - `countryCode`: the city's country.
   - `latitude` and `longitude`: still the **browser's** coordinates, rounded as now. The times are for where the user is, not the town centre.
   - `timeZone`: the browser's time zone, as now.
   - If the nearest city is more than **50 km** away, `name` is "Near " followed by the city name (for example "Near Tromsø"). The country still comes from that city.
   - If the city list cannot be loaded, keep today's behaviour ("My location", `ZZ`) so the user is never stuck.
3. **The confirmation.** After a successful location, before going on, show this panel in place of the location buttons:
   - A green tick icon (decorative, `aria-hidden="true"`), drawn in CSS or inline SVG, at least 32 pixels.
   - Title: **Location found**
   - Line 1: the place and country, for example **Leeds, United Kingdom** (country name from the existing `countryName` helper). For a "Near" place: **Near Tromsø, Norway**.
   - Line 2: **Your prayer times are now for this place.**
   - First run: a solid button **Continue**, which goes on to Times.
   - Location sheet in Settings: a solid button **Done**, which closes the sheet back to Settings.
   - The whole panel is a `role="status"` region, so a screen reader announces "Location found, Leeds, United Kingdom".
   - Move keyboard focus to the Continue or Done button.
4. **Existing test.** `tests/e2e/popup.test.ts` (the "first run asks for location" test, around lines 117 to 125) asserts "My location" and country `ZZ`. Change it to the new values, Leeds and `GB`, and to the confirmation panel. Do not delete it.
5. **Method on first run.** Because the country is now known, the first run uses `suggestMethod(countryCode, sect).suggested`, as it already does for a searched city.
6. Searching for a city by name does **not** show this panel. It already shows the chosen city. Only "Use my location" does.

### Tests

- Unit: `nearestCity` returns Leeds for 53.80, -1.55; returns a city in the right country for a point in Pakistan (Karachi area); returns the "Near" form for a point in the sea more than 50 km from any city.
- e2e, first run: mock a position in Leeds. The panel shows "Location found" and "Leeds, United Kingdom". Focus is on Continue. After Continue, the header shows Leeds. The stored settings have country `GB` and the UK's suggested method.
- e2e, Settings: the same through the Location sheet, ending with Done.
- e2e: the city list failing to load (make `page.route` abort `**/data/cities.json`) still saves "My location" and continues.
- axe on the panel, light and dark.

### Decision to record

D-021: "Use my location" names the place from the bundled city list, offline, and confirms it with a "Location found" panel. The coordinates stay the browser's. Rejected: reverse geocoding through any online service (breaks the no-network rule).

---

## Step 2: prayer alerts, from Settings to the sound

`DECISIONS.md` D-009 says `alarms`, `notifications` and `offscreen` arrive only in the same change as the service worker **and** the Settings screen that uses them. So this is one step. Read `PLAN.md` §4.4, §4.5 and §7 in full first. This step builds them **except** the badge, the reminder before prayer and the suhoor reminder, which come later.

### Settings storage

Add an `alerts` object to the settings, with a migration: `{ enabled: false, prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true }, sound: 'beep' }`, where `sound` is `'beep'`, `'adhan'` or `'silent'`. Old settings without it load with these defaults. `isSettings` validates it and rejects damaged values.

### Default: off

**Prayer alerts are off until the user turns them on.** The plan's first run step that asks about alerts is not built yet, and an extension that starts making sounds nobody asked for is the wrong first impression. When the full first run is built, its Alerts step will turn them on.

### Permissions and pages

- Add `alarms`, `notifications` and `offscreen` to `src/manifest.json`. Nothing else. Chrome will show "Display notifications" at install; that is expected.
- Add the offscreen page as a third build input in `vite.config.ts`: `src/offscreen/index.html` with its script, built to `offscreen/index.html`. Create it with `chrome.offscreen.createDocument({ url: 'offscreen/index.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Plays the prayer alert sound.' })`, after checking `chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })` finds none.
- The offscreen page can use `chrome.runtime` only. It answers four messages: `play-beep`, `play-adhan-sunni`, `play-adhan-shia`, `stop`. **Every sound goes through it**, including the Play button in Settings, so Stop in the notification and Stop in Settings share one path: popup or worker sends to the worker, the worker makes sure the offscreen page exists and forwards the message.

### The schedule

- A pure function in `src/core/alerts.ts`: given the settings and "now", return the alarms to create. Names:
  - `prayer:<YYYY-MM-DD>:<slot>` for each enabled prayer today and tomorrow (Fajr, Dhuhr, Asr, Maghrib, Isha; never Sunrise), future times only;
  - `refresh` one minute after local midnight;
  - nothing at all when `alerts.enabled` is false.
  Under 20 alarms.
- The service worker rebuilds the alarms on `runtime.onInstalled`, `runtime.onStartup`, `storage.onChanged` for the settings key, and whenever it starts and `chrome.alarms.getAll` does not match the expected set.
- Register `chrome.alarms.onAlarm`, `chrome.notifications.onClicked`, `chrome.notifications.onButtonClicked`, `chrome.runtime.onInstalled`, `chrome.runtime.onStartup`, `chrome.runtime.onMessage` and `chrome.storage.onChanged` **at the top level of the worker file, synchronously**, or Chrome drops events after the worker restarts.
- A prayer alarm that fires **more than 5 minutes late** (the computer was asleep) does nothing.

### The alert

From `PLAN.md` §7 "The alert", in English:
- Title: the prayer name, a comma, and its time, **formatted exactly as the popup formats it** (`navigator.language`, as in `Popup.tsx`). So it reads **Asr, 16:05** in en-GB and **Asr, 4:05 PM** in en-US. Use the same helper in the worker so the two never differ.
- Message: **It is time for Asr in London.** (the saved place name).
- `iconUrl`: `icons/icon-128.png`. `silent: true`. `requireInteraction: true`.
- One button **Stop sound**, only when the sound is the adhan.
- Cleared after 60 seconds by a one-off alarm named `clear:<notificationId>`, not a timer.
- Clicking it: `chrome.action.openPopup()` inside try and catch; on failure just clear it.

### The sound

- **Soft beep** (the default): made in code with Web Audio in the offscreen page, two notes, under 1.5 seconds, with a fade in and out. No audio file.
- **Adhan**: copy the phone's two recordings **unchanged**, from the phone repo (`/Users/aliimrankhan/Developer/SajdaTime`, branch `claude/1-6-0`, `app/src/main/res/raw/`): `adhan.ogg` (Sunni, 1.2 MB) and `adhan_shia.ogg` (Shia, 2.3 MB), into `public/audio/`. Read them with `git show`; do not edit that repo. The adhan follows the saved School. Record each file's SHA-256 in the D-022 entry.
- **Silent**: the message only.
- Volume follows the computer. No slider.

### The Alerts group in Settings, with its exact words

Placement, top to bottom: disclaimer (first, untouched), Place, School, Calculation method, Asr school, Hijri date, **Alerts** (new), About.

- Heading: **Alerts**
- A switch row: **Prayer alerts**. Hint under it: **A message and a sound at each prayer.** Off by default.
- When Prayer alerts is on, show:
  - Five switch rows, all on when Prayer alerts is first turned on: **Fajr**, **Dhuhr**, **Asr**, **Maghrib**, **Isha**.
  - A heading **Sound**, then three choice rows, styled like the School buttons but stacked:
    - **Soft beep**, hint **Short and gentle** (selected by default)
    - **Adhan**, hint **The full call to prayer**
    - **Silent**, hint **The message only**
  - Beside the Sound heading, a compact solid button **Play**, which plays the chosen sound once. Hidden for Silent. While the sound plays it reads **Stop**.
  - A solid 48 pixel button **Send a test alert**. Under it: **If nothing appears, check your computer's notification and Focus settings.** It shows a notification titled **Test alert** with the message **This is how a prayer alert looks.** and plays the chosen sound.
  - A quiet note at the foot of the group, two lines: **Chrome needs to be open.** and **If Chrome is closed or the computer is asleep, no alert can sound.** In Edge, both say Edge instead of Chrome (detect with `navigator.userAgentData.brands`, as `PLAN.md` §4.5 says).
- **Alerts blocked.** If `chrome.notifications.getPermissionLevel()` says `denied`, show an amber notice at the top of the Alerts group: title **Prayer alerts are blocked**, line **Chrome is not allowed to show notifications for SajdaTime, so the alert cannot appear.** No button yet (the help page is not published).
- Every switch and choice saves at once, keeps keyboard focus where it was, and uses the same `aria-disabled` save guard as the existing Settings controls. Switches are `role="switch"` with `aria-checked`.

### Credits (the Shia recording's licence requires them)

- Settings, About group: a row **Adhan recordings** that opens to this text, exactly as the phone has it:

  > Sunni adhan: recorded by Adam-synagda, CC0.
  > Shia adhan: sung by Saeed Hatamzadeh-Varmazyar, CC BY-SA 4.0.
  > Both via Wikimedia Commons.

  "CC BY-SA 4.0" links to `https://creativecommons.org/licenses/by-sa/4.0/` and opens in a new tab. A link the user presses is not a request by the extension.
- Add the same three lines to `public/THIRD-PARTY-NOTICES.txt`.

### Privacy page, same commit

`docs/privacy.html` promises it is updated before these permissions arrive. Replace the paragraph that begins "Prayer alerts are not in this build" with exactly:

> Prayer alerts use three more permissions, and they do nothing until you turn alerts on in Settings. Alarms wake SajdaTime at each prayer time. Notifications show the prayer message. Offscreen lets SajdaTime play the beep or the adhan, because its background part cannot play sound by itself. None of them sends anything off this computer.

Change the page's date to the day you commit.

### Tests

- Unit, `src/core/alerts.ts`: on **27 October 2026 at 10:00 London** (MWL, Shafi'i), the list holds Dhuhr, Asr, Maghrib and Isha for 27 October, all five for 28 October, and `refresh`; not Fajr on the 27th (04:53, already past). Disabled prayers are left out. `enabled: false` gives an empty list. A Shia user's Maghrib alarm is at the Shia Maghrib.
- Unit: the late check: 4 minutes late plays, 6 minutes late does not.
- Unit: settings migration and validation of `alerts`.
- e2e (through the service worker's `evaluate`): turn alerts on in Settings, then `chrome.alarms.getAll` holds the expected `prayer:` names. To fire a prayer by hand, create `prayer:<today>:asr` with `when: Date.now()` (an unpacked build has no minimum delay) and wait for `chrome.notifications.getAll` to hold a notification titled "Asr, ...". With the adhan chosen, an offscreen document exists while it plays, and the `stop` message ends the sound.
- e2e, Settings: the group is hidden beyond the switch until it is on; turning it on shows five switches all on and Soft beep selected; choices survive a reload; focus stays on each pressed control; Play changes to Stop and back; Send a test alert creates the Test alert notification.
- e2e: with `chrome.notifications.getPermissionLevel` overridden by `addInitScript` to report `denied`, the amber notice shows.
- axe on Settings with the group open, light and dark. The real popup test still passes.
- `git ls-files` shows the two `.ogg` files as the only new binary files, and `dist` stays under 10 MB.

### What cannot be tested here

Whether the operating system actually shows the banner (Focus, Do Not Disturb) and whether the sound is heard. Say so in the report. Ali checks both by ear.

### Decisions to record

- D-022: alerts use Chrome alarms, notifications and one offscreen audio page; the adhan files are the phone's own, unchanged (with their SHA-256). D-009 is updated to say the three permissions now ship with a working alert. Badge and reminders are deferred.
- D-023: prayer alerts are off until the user turns them on, until the full first run exists.

---

## Step 3a: Ramadan labels, shown automatically every year

### What "always" means here

Every Ramadan, the extension changes to its Ramadan display **on its own**, with nothing for the user to set up, every year. It is on by default, and a user can turn it off in Settings. This is `PLAN.md` §5.6, which copies the phone's 1.5.0 rules. If Ali meant something else, for example a Ramadan countdown all year, this step changes before it is built.

### Use the existing helpers

`src/core/hijri.ts` already has `ramadanInfo`, `isRamadan`, `daysUntilStart`, `contains`, `showsNotice`, `showsSettings`, `isLastDay` and `eidOn`, all taking the Hijri shift. Use them. Do not write a second set. If one needs extending, extend it and test it.

### Storage

Add `ramadanCard: boolean` to the settings, default `true`, with a migration and `isSettings` validation.

### What to build

1. **In Ramadan** (`contains(info, today)`) and with `ramadanCard` on, on Times:
   - The hero label reads **Suhoor ends** when Fajr is next and **Iftar** when Maghrib is next. Under the countdown: **until suhoor ends** or **until you break your fast**. Other prayers are unchanged.
   - In the list, the Fajr row is labelled **Suhoor ends** and the Maghrib row **Iftar**.
   - The Hijri date in the header already shows the day number (for example **13 Ramadan 1448**), so no separate "day" line is added.
2. **Settings, Ramadan group**, shown while `showsSettings(info, today)` is true, placed above Alerts: heading **Ramadan**, one switch **Ramadan card**, on by default. Turning it off returns Times to the normal labels.
3. Umm al-Qura Isha plus 30 minutes in Ramadan already exists (`engine.ts`). Do not touch it.

### Tests

- e2e with Playwright's clock set inside Ramadan 2027: the hero says Iftar in the afternoon and Suhoor ends after Isha; the Fajr and Maghrib rows are relabelled; the header's Hijri date shows the day number and no separate day line appears; turning the Ramadan card off restores the normal labels; outside Ramadan nothing changes.
- Unit, only for a helper you extended: dates around 1 Ramadan 1448 and 1 Shawwal 1448, with shifts of minus 1 and plus 1, checked against the phone's Umm al-Qura values, not against this code.
- Screenshots of Times in Ramadan, light and dark, only with `SAJDATIME_SCREENSHOTS=1`, for Ali.

### Decision to record

D-024: the Ramadan display turns itself on every Ramadan and can be turned off.

---

## Step 3b: Ramadan notice, Eid and the iftar alert

1. **Coming notice**, only when `daysUntilStart` is 1, 2 or 3 (not on the days of Ramadan, even though `showsNotice` also covers days 1 and 2; that "Shift the date" notice is deferred). Between the header and the hero card, closable: title **Ramadan begins on <date>** (date as the popup formats dates), line **From the first day, the Ramadan card shows suhoor and iftar times here. You can turn it off in Settings.** No button in this step. Closing it saves `true` under the `chrome.storage.local` key `sajdatime.notice.ramadan.<hijriYear>`, so it stays closed for that Ramadan only.
2. **Eid**, when `eidOn(today)` is set: a closable notice on Times, title **Eid Mubarak**, with a line that stays visible: **Follow your mosque for the date of Eid.** Closing saves `sajdatime.notice.eid.<eid>.<hijriYear>`.
3. **Iftar alert wording**: when alerts are on, the Maghrib notification in Ramadan (with `ramadanCard` on) has the message **It is time for Maghrib. You can break your fast.**

### Tests

- e2e with the clock 2 days before Ramadan 1448: the notice shows; 4 days before: it does not; on day 1: it does not. Closing it hides it after a reload.
- e2e on 1 Shawwal 1448: the Eid notice and its line.
- Unit or e2e: the Maghrib alert message inside and outside Ramadan.

**Still deferred after 3b:** the suhoor reminder, the Ramadan timetable, the "Shift the date" notice on days 1 and 2, the badge, the reminder before prayer.

---

## Questions for Ali (defaults used until he answers)

1. Alerts off until turned on (Step 2). Default: off.
2. "Ramadan display always" read as "automatic every Ramadan, can be turned off" (Step 3a). Default: that reading.
3. Places more than 50 km from any town show "Near <town>" (Step 1). Default: 50 km.
