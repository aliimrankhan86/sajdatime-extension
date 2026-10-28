# Decisions

The order of authority is Ali's current words, then this file, then `docs/PLAN.md`, then the design canvas. If two documents disagree and this file is silent, the plan wins on behaviour and wording.

A decision is added here in the same commit that makes it. Each entry says what was decided, why, and what would make us revisit it.

## D-001: This is a separate product

**Decided:** the extension is built, tested, released and documented on its own. It shares a name and the Quiet Glass language with the Android app and nothing else.

**Why:** Ali, 20 October 2026: "do not mix it up with the android app. this is a seperate work on its own." The phone has its own release train, store listing, privacy policy and support load. Coupling them would make both harder to change.

**Revisit only if:** Ali asks for shared code or one release process. That would be a product decision, not a cleanup.

## D-002: High latitude uses the phone's Twilight Angle rule, and projects an impossible day

**Decided:** for every method except Moonsighting Committee, set `highLatitudeRule = HighLatitudeRule.TwilightAngle`. Set `polarCircleResolution = AqrabYaum` for the ordinary calculation. If the unresolved probe shows any of the six times does not exist, or the local day is not in order, compute the day once at 45 degrees (60 for Moonsighting Committee), keeping the user's longitude and hemisphere, and mark it approximate. Moonsighting Committee keeps its own seasonal rule.

**Why:** the phone engine sets `HIGH_LATITUDE_RULE = TWILIGHT_ANGLE` and has shipped with it since before 1.5.0. The extension copies behaviour users already have. The plan asks for `HighLatitudeRule.recommended`, but in adhan-js that applies one seventh of the night as a floor even when the twilight angle exists. In London on 10 April it moves Fajr from 04:12 to about 04:50, which would make the popup disagree with the phone by around 38 minutes and break the London fixture this build pins. The plan's own consistency rule says the extension must give the same minute as the phone. Where those two lines conflict, the shipped phone behaviour wins for people who already use the app.

`AqrabYaum` alone was not enough. adhan-js returns finite but impossible values above the polar circle: on 21 December 2026 it puts Asr before Dhuhr at Tromso, and Asr after Maghrib at Longyearbyen. The hero card then names Maghrib as the next prayer while Asr is still to come. The phone's `isUsable` rejects such a whole day and projects it from a reference latitude. The extension now does the same, and clamps manual corrections so they cannot cross the six times either.

The Shia Maghrib is not an exception to the phone's behaviour. The phone keeps its ordinary parameters at sunset and computes Jafari (4 degrees) and Tehran (4.5 degrees) from a second Isha-only pass with the Twilight Angle rule. adhan-js's own `maghribAngle` would also feed `isUsable`, and because the Shia Maghrib sits well after sunset the solar-noon midpoint check then wrongly projects a normal Oslo summer to 45 degrees. The extension keeps the main parameters at sunset and reads the angle from the same separate pass, so it matches the phone exactly.

**Evidence:** extension unit tests pin London 10 April 2026 at 04:12 and London 21 June 2026 at 02:31 and 23:27, matching the phone's shipped engine. Tromso and Longyearbyen on 21 December 2026, and McMurdo on 21 June 2026, are polar, finite and strictly ordered. A Dhuhr +30 and Asr -30 correction at 59.9 degrees cannot reverse the day. Oslo 21 June 2026 stays a real day and shows the phone's cap (23:05 Jafari, 23:07 Tehran), and Trondheim, Tampere, Manchester and Anchorage pin the same cap and Isha as the phone's Java probe. A sweep from 50 to 66 degrees across all of 2026 keeps Maghrib strictly before Isha, Jafari no later than Tehran, and the daily Maghrib move at most 10 minutes.

**Decision, 27 October 2026: the Shia Maghrib uses the Twilight Angle cap, matching the phone.** An earlier ruling the same day chose the raw true angle whenever the sun reached it before Isha. That was reversed after the review measured the faults: the true angle jumped about 45 minutes between neighbouring days (Tampere, Jafari, 9 June 00:04 against 12 June 23:25), landed one minute before Isha (Anchorage, Jafari, 21 June 00:47 against Isha 00:48), and put Jafari after Tehran (Anchorage, 21 June 00:47 against 00:04), which is impossible in the sky. It also matched no standard reference and would have moved Maghrib for existing users. The Twilight Angle cap, which the phone ships and Aladhan gives with its default angle-based setting, is smooth: it returns the true twilight when the sun reaches it early and caps it at sunset plus `angle / 60` of the night otherwise. The extension now matches the phone everywhere except the two small differences listed below.

**Smaller known differences from the phone, all library behaviour:** above 66 degrees the extension rejects a day where Asr equals Dhuhr, while the phone accepts that minute and projects less often. The extension is the safer of the two. In a few high latitude cases the extension's Fajr is one minute earlier, because adhan-java drops the fraction of a second from the night portion and adhan-js keeps it. Neither difference is hidden by a tolerance.

**Revisit if:** the phone changes its high latitude rule or its reference latitudes, a scholar Ali trusts shows this is wrong for a community he serves, or Ali revisits the Shia Maghrib cap ruling recorded above.

## D-003: Turkey's Diyanet offsets are not added twice

**Decided:** use adhan-js's `CalculationMethod.Turkey()` with no extra offsets.

**Why:** adhan-js already carries Sunrise minus 7, Dhuhr plus 5, Asr plus 4 and Maghrib plus 7. The phone uses the same library settings through adhan-java. Adding them again would move four times by up to 14 minutes.

**Evidence:** adhan-js 4.4.6 carries the offsets inside `CalculationMethod.Turkey()`. `src/core/methods.ts` calls that factory and adds nothing to `methodAdjustments`, so the offsets are applied once. The extension has no separate Turkey test yet, so the next golden fixture pass covers it.

**Revisit if:** the phone starts using a different Turkish source.

## D-004: Golden values come from the phone engine, not the phone's test file

**Decided:** extension fixtures use the values the phone engine produces after adhan's nearest-minute rounding. They do not copy the phone test file's expected numbers, because those numbers came from the Aladhan API with a two-minute tolerance.

**Why:** the phone's `PrayerEngineTest` calls Aladhan while developing and asserts within two minutes. Its expected Makkah Asr is 15:37, the phone engine gives 15:38. Copying the API values would make the extension test fail against the library the app actually uses, or hide a one-minute disagreement behind a tolerance.

**Rounding:** adhan-js 4.4.6 rounds its exact time to the nearest minute for every method except Singapore, which it sets to `Rounding.Up`. adhan-java rounds every method to the nearest minute. `parametersFor` now forces `Rounding.Nearest` for all methods, so the two libraries agree. The extension then truncates the final Date to whole minutes in `computeDay`, after manual corrections and the order clamp, so alarms and the countdown sit on the minute. Truncation after rounding does not recreate adhan-java's exact second, so a same-minute result can still differ by one in rare cases, but Singapore no longer does. The difference is not hidden behind a wide tolerance.

**Fixed one minute case:** Makkah, 15 January 2026, Singapore method. Before forcing nearest the extension gave Dhuhr 12:32 and Isha 19:18. It now gives 12:31 and 19:17, matching the Java reference. The engine test pins both minutes.

**Evidence:** `tests/unit/engine.test.ts`. Makkah Umm al-Qura 15 January 2026: 05:41, 07:01, 12:30, 15:38, 17:59, 19:29. Tehran Jafari 21 June 2026: 03:14, 04:49, 12:06, 15:55, 19:42, 20:44. London Muslim World League 10 April 2026: 04:12, 06:16, 13:03, 16:46, 19:49, 21:46. London midsummer: 02:31, 04:43, 13:03, 17:25, 21:22, 23:27.

**Outside check:** `tests/unit/aladhan.test.ts` also records 13 Aladhan API results as a broad wiring check. They allow five minutes because Aladhan and adhan-js differ in rounding and method offsets. They are not golden values and never replace the phone fixtures.

**Revisit if:** a user reports a time that differs from the phone by more than two minutes for the same method, madhab and place.

## D-005: First run asks for location, then saves the place

**Decided:** first run offers one obvious action, **Use my location**. The popup asks the browser for one coarse fix, takes the time zone from the computer, suggests a method and saves the settings. There is no account and no city search yet. If location is refused or unavailable, the error screen offers **Use Makkah for now** so the user is never left with no times at all.

**Why:** a new user should see times in one step. Asking for a city before showing anything is a longer path to the same result. Refusing location used to be a dead end; the Makkah button turns it into a usable, clearly labelled fallback until the settings screen can take a place. City search arrives with that screen.

**Limits:** the place is called **My location**, or **Makkah** when the fallback is used. The suggested method is a starting point, never an authority; the language's region is no longer used as a country hint, so a traveller's suggestion is less specific. The user cannot change either yet.

**Revisit when:** city search is built. The first-run flow should then offer **Use my location** and **Search for a city** on the same screen, and the Makkah button should become a last resort rather than the only alternative.

## D-006: The privacy words describe what SajdaTime does, not what the browser does

**Decided:** the extension says it does not send the location anywhere, keeps settings in `chrome.storage.local`, and makes no network requests. It never says the location "never leaves the device".

**Why:** the browser's own geolocation service may use the network to estimate a fix. That is outside the extension's control. Saying more than we can prove would be false, and the phone project already paid for that lesson.

**Revisit if:** the extension stops using the browser's geolocation API, for example after offline city search only.

## D-007: No service worker work in this step

**Decided:** the service worker currently clears the badge on install and nothing else. Alarms, notifications, offscreen audio and the countdown badge come in their own step.

**Why:** a worker that schedules alarms before settings, alert choices and the late-alarm rule exist would have to be rewritten. The popup does not depend on the worker, so the current build is honest and testable.

**Revisit when:** the settings screen can save an alert choice. That is the point at which alarms become real.

## D-008: English only until the words are written

**Decided:** version 0.1.0 has English UI. The five languages and right-to-left layout come after the screens stop changing.

**Why:** translating a moving target wastes work and leaves stale keys. The manifest already has `default_locale` and a `_locales/en` file so the structure is ready. Urdu will not get a `_locales` folder because Chrome does not ship an Urdu locale, but the popup will still show Urdu words from its own message table when the language step lands.

**Revisit when:** the Times and Settings screens are settled. Then add all five languages in one change, with a completeness test.

## D-009: No host permissions and no content scripts

**Decided:** the manifest asks for `storage`, `geolocation`, `alarms`, `notifications` and `offscreen`. Nothing else, and no host permissions or content scripts.

**Why:** the extension never reads a page, never calls a server and never needs a tab. Every extra permission makes the install warning longer and the store review harder. The first build asked only for `storage` and `geolocation`, because a notification and alarm permission for a feature that cannot fire asks the user to trust a promise the build does not keep. The three alert permissions arrive now, in the same commit as the worker, the offscreen audio page and the Settings switches that use them, as D-024 records.

**Revisit only with:** a future feature that needs a host permission must bring a written reason and Ali's agreement.

## D-010: The store copy is drafted early, published last

**Decided:** `docs/store/listing.md` is a working draft. It is not submitted until the screenshots and the privacy URL are real.

**Why:** store review rejects listings that describe features the build does not have. The draft keeps the wording in one place while the build catches up.

**Revisit when:** the first store-ready build exists. Then replace every placeholder and check each claim against the build.

## D-011: The checks workflow waits for the workflow scope

**Decided:** the GitHub Actions workflow stays out of the repository until this Mac's GitHub login can write it. The file exists locally at `.github/workflows/ci.yml`, and `.git/info/exclude` keeps it out of accidental commits. Local checks are the source of truth until CI has actually run.

**Why:** GitHub refuses an OAuth app from creating a workflow without the `workflow` scope, and `gh auth refresh -s workflow` failed with "failed to move active token in keyring" from the tool sandbox. Pushing without the workflow is the only clean option. Claiming CI is green before it has run would break the rule of never calling untested work done.

**Revisit when:** `gh auth refresh -s workflow` succeeds in a normal Terminal. Then remove the path from `.git/info/exclude`, commit the workflow, push it and watch its first run.

## D-012: Links for Ali are always clickable

**Decided:** any link Ali is meant to open is a Markdown link he can click, never a bare URL pasted as text.

**Why:** Ali asked on 27 October 2026, "make the link clickable so I can click and get it done." He is not technical and acts from clicks, not copied addresses.

## D-013: The popup has a fixed 380 pixel width, and zoom is a real browser zoom

**Decided:** the `body` is a fixed 380 pixels wide with no `max-width`, and `html` carries no width rule. Zoom is tested with `deviceScaleFactor: 2` on a 380 by 600 viewport, not by shrinking the viewport.

**Why:** the earlier rulings were wrong. `width: 100%` with `max-width: 380px` collapsed the real action popup to about 147 pixels, because Chrome sizes an action popup to the document's intrinsic width. The follow-up `width: 380px` with `max-width: 100vw` collapsed it to about 25 pixels, because Chrome measures the popup while its viewport is still tiny. A fixed width on the body is the only value that holds in the real popup. The zoom emulation was wrong too: Chrome zooms a popup by enlarging the window and keeping 380 CSS pixels, so shrinking the viewport tested a state that never happens.

**Evidence:** `tests/e2e/popup-width.test.ts` opens the real toolbar popup in headful Chrome for Testing over a remote debugging port and reads `window.innerWidth`, `innerHeight` and the Settings button position from the DevTools protocol. It fails against the two earlier CSS states at 147 and 25 pixels. `tests/e2e/design.test.ts` and `tests/e2e/popup.test.ts` set `deviceScaleFactor: 2` and check that nothing clips, the countdown stays on one line and every control keeps a 44 CSS pixel target.

**Revisit if:** the popup grows a control that genuinely cannot shrink. Even then it may scroll, but it must not clip.

## D-014: Coordinates are rounded to about one kilometre

**Decided:** the place saved from the browser is rounded to two decimal places before it is stored.

**Why:** PLAN.md asks for two places to be kinder to privacy. Six or seven decimal places describe a building; two describe a neighbourhood, which is all prayer times need.

**Revisit if:** a place needs finer than two decimal places, which no prayer time does. City search also rounds the city centre to two places.

## D-015: The countdown is written as "9 h 23 m 59 s"

**Decided:** the countdown uses spaced hour, minute and second units. It does not use the plan's `h:mm:ss`.

**Why:** the spaced form is easier to read at a glance in a small popup, and it fits the available width. The plan's compact form saves space but reads like a timer on a machine, not a prayer time.

**Revisit if:** a later layout gives the countdown a wider column and the shorter form becomes the calmer choice.

## D-016: City search uses a bundled GeoNames list, not a network API

**Decided:** a built-in city list backs "find a place". It is GeoNames `cities5000`, about 70,000 places with coordinates, country and time zone, packed as a compact JSON file shipped with the extension and fetched through `chrome.runtime.getURL`.

**Why:** the plan allows a built-in list and rules out a network call. GeoNames `cities5000` is the largest freely usable set that still fits a popup search. It is CC BY 4.0, credited in `THIRD-PARTY-NOTICES.txt`, in Settings and in the README.

**Revisit if:** the packed size grows, or users need Urdu and Arabic names or a "near this town" fallback for places outside the list.

## D-017: The Settings screen is a sheet reached from a visible button in the Times header

**Decided:** the Times header carries a solid Settings button, not the plan's footer button.

**Why:** the popup is 380 by 600 and the times list already fills it. A footer button would sit below the fold and would not be visible without scrolling, which Ali asked to avoid. The header button is seen the moment the popup opens. It is the only icon-like control in that row, so the no-two-icon-buttons rule still holds.

**Revisit if:** the Times screen is redesigned with room in the footer.

## D-018: The disclaimer is a first row in Settings that opens on tap

**Decided:** Settings opens with a Disclaimer row whose summary is "A helper, not a religious authority. Worth reading." Tapping it reveals the full text.

**Why:** the phone keeps the disclaimer as the first row of Settings, About, and never shows the whole paragraph at first launch. A popup this small cannot show the full text and the controls at once. The summary keeps the warning visible and one tap opens the full text, which keeps all four substance points and the closing dua.

**Revisit if:** the settings screen is redesigned with more room, or the full first-run journey gives the disclaimer its own step.

## D-019: State labels are real text, and a full screen takes keyboard focus

**Decided:** the Times row writes `Next` and `Now` as text inside the row, not as a CSS `::after` label. When Settings or Location opens, focus moves to the screen heading. Escape closes the current screen, and focus returns to the control that opened it.

**Why:** the earlier Now label was generated by CSS, so a screen reader never heard it and a keyboard user could open Settings and land on `<body>`. Both are silent failures that look fine in a screenshot. `aria-current` alone is not enough for a visual reader, and a visual label alone is not enough for a screen reader. The pair keeps the two in step.

**Evidence:** `tests/e2e/design.test.ts` checks the visible pills and `aria-current="time"` on the current row. `tests/e2e/audit.test.ts` checks Tab into Settings, heading focus, Escape, return to the Settings button, and Escape from Location back to Change. `tests/e2e/a11y.test.ts` runs axe on Times, first run, Settings and Location in light and dark.

**Revisit if:** the layout leaves no room for a text pill and the label moves to an icon. Then the icon needs an accessible name and the same test.

## D-020: School offers only the methods that belong to it

**Decided:** Settings has a School row with Sunni and Shia. Shia is offered Jafari and Tehran only; Sunni is offered every other method. Changing school keeps the current method when the new school offers it, and otherwise resets to the country's suggestion for that school in the same single save.

**Why:** the phone's `CalcMethod.offeredTo` treats Jafari and Tehran as Shia-only and everything else as Sunni-only, and `SettingsRepository.setSect` discards a method the new school was never offered. The extension mirrors both, with the country suggestion standing in for the phone's `AUTO`. A Shia user kept on a Sunni method would silently lose the Jafari Maghrib, and a Sunni user kept on Jafari would silently gain it.

**Evidence:** `src/core/methods.ts` holds one `isMethodOfferedTo` used by both the Settings method list and the School setter, so the two cannot disagree. `tests/unit/methods.test.ts` pins the split; `tests/e2e/school.test.ts` covers both reset directions, the keep case and focus after a save.

**Revisit if:** a method spans both schools, or a scholar Ali trusts asks for a different split.

## D-021: "Use my location" names the place from the bundled list and confirms it

**Decided:** "Use my location" names the place from the bundled city list, offline, and confirms it with a "Location found" panel. The coordinates stay the browser's. The name is the nearest bundled city that is not a section (a borough, quarter or district, feature code `PPLX`); when that nearest city is itself a district, its name is replaced by a larger city's only when the larger city's name is a whole word inside it ("Paris" in "Paris 04 Hôtel-de-Ville", "Dubai" in "Bur Dubai"), it shares the country, it is within 20 kilometres, and it has at least ten times the population. Rejected: reverse geocoding through any online service (breaks the no-network rule).

**Why:** the header said "My location" with the country `ZZ`, so nothing told the user the fix had worked and the suggestion fell back to Muslim World League even in Pakistan or Saudi Arabia, where the country is what picks the method. The GeoNames list is already bundled for search and carries the town's country, so the name and the country cost nothing: no new permission, no request, no geocoder whose answers depend on the network. The coordinates deliberately stay the browser's, because the times must be for where the user is and not for the centre of the nearest town; past 50 kilometres the name says "Near <town>" so the header does not claim a street. The panel exists because a silent save gave no moment to notice a wrong name before the times appeared. Rejected naming rules: the most-populous-within-15-km radius (it named Bradford and Dewsbury "Leeds" and Kehl "Strasbourg, France", the wrong country), and showing the district name as-is (central Paris then showed "Paris 04 Hôtel-de-Ville" and central Dubai "Bur Dubai"); the whole-word promotion names those two plainly without a radius search and without touching the coordinates, the country or the 50 km "Near" line.

**Evidence:** `tests/unit/cities.test.ts` pins the nearest city for Leeds and for Karachi and the distance between them; `tests/unit/place.test.ts` pins the kept city name and country, the browser coordinates and time zone, the 50 kilometre line in both directions, and the fallback when there is no city. `tests/e2e/popup.test.ts` drives the first run with a Leeds fix, the panel words, focus on Continue, and the saved `GB` and UK method; `tests/e2e/location-found.test.ts` drives the Settings sheet with Done and a city list aborted in the browser; `tests/e2e/a11y.test.ts` runs axe on the panel in light and dark. Every one of them was shown failing before the change.

**Revisit if:** a step needs the user's own neighbourhood rather than the nearest town, or a local-script name is wanted. Both need a bundled list with those names, not a network call.

## D-022: The manifest is locked and the build is scanned

**Decided:** `docs/SECURITY.md` is enforced by code, not by memory. `tests/unit/manifest.test.ts` asserts the exact top level key set, the exact permissions (`alarms`, `notifications`, `storage`, `offscreen` and `geolocation`), the strict content security policy `script-src 'self'; object-src 'none'; base-uri 'none'`, and the absence of host permissions, content scripts, web accessible resources and external messaging keys. `tools/check-bundle.mjs` runs at the end of `npm run check`, after the build, and fails on `eval`, `new Function`, `document.write`, `importScripts`, external messaging, `console.log`, the storage APIs other than `chrome.storage.local`, the HTML insertion family in `src/`, and any URL outside the four link allowlist entries.

**Why:** the security rules arrived as prose, and a rule with no check is a wish. The manifest is the only place the extension can widen what it can reach, so it is the one file where a quiet addition would matter most, and a test that pins every key makes such an addition a deliberate, reviewed act. The scan covers the other routes a later step could take by accident: a CDN font, a remote sound, a `console.log` that prints a coordinate, or a place name pasted into `innerHTML`. The three `www.w3.org` namespace names are allowed because Preact writes them as identifiers, not requests.

**Evidence:** the manifest test fails when `"tabs"` is added to `permissions` or the policy is dropped (three assertions red, shown before this commit). The scan fails with six named violations when `localStorage`, `eval`, `document.write`, a remote URL, `console.log` and `onMessageExternal` are appended to a built file. Both pass on the shipped tree. `npm audit --omit=dev` reports 0 vulnerabilities and no runtime dependency was added.

**Revisit if:** a later step needs another permission. That is allowed, by adding it to the manifest, to the test, and to this log in the same commit.

## D-023: A located point is named by the nearest city that is not a section

**Superseded by D-021.** This decision was first the 15 km radius, then the nearest-non-section pass alone. Both are rejected and folded into the complete naming rule in D-021, which also records why the radius failed.

## D-024: Alerts use Chrome alarms, notifications and one offscreen audio page

**Decided:** prayer alerts ship with three more permissions: `alarms`, `notifications` and `offscreen`. The background service worker schedules one alarm per prayer plus a daily refresh, shows a notification at each prayer time, and plays the sound through a single offscreen audio page, because a service worker cannot play sound by itself. The two adhan recordings are the phone app's own files, copied unchanged, with these SHA-256 values:

- `public/audio/adhan.ogg` (Sunni): `35fe06b08fe80505c550c33fed8a783fa9901ddc81ac884958b4be048f5b2a79`
- `public/audio/adhan_shia.ogg` (Shia): `0e0433e77bed4ee15044169c4b735cac346836eeae11a36ea194228aaa18ac97`

The badge and "time until the next prayer" reminders are deferred.

**Why:** each permission maps to one visible thing and nothing else. `alarms` wakes the worker at each prayer time, `notifications` shows the message, and `offscreen` plays the beep or the adhan. The offscreen page is the smallest route to sound: a service worker has no `Audio` and the extension will never use a content script or a tab for it. Reusing the phone's own recordings keeps the extension sounding the same without a new asset or licence. The badge and reminders are deferred so this step stays about the alert itself, not a second surface.

**Revisit if:** the sound needs to keep playing past the one minute "Stop sound" window, the badge is wanted, or a reminder before each prayer is wanted. Each is its own feature and brings its own permission question.

## D-025: Prayer alerts are off until the user turns them on

**Decided:** alerts are off by default. `alerts.enabled` is `false` and the sound is `beep`. Nothing is scheduled and no notification can appear until the user turns alerts on in Settings, where a master switch and five per-prayer switches control them, and `beep`, `adhan` and `silent` are the sound choices.

**Why:** the privacy promise, written in `docs/BUILD-NEXT.md` and `docs/privacy.html`, is that the three new permissions do nothing until the user turns alerts on. Shipping off by default means an existing user upgrades with no new sound, no notification and no changed behaviour. There is no full first-run journey yet to explain the three permissions, so off by default is the honest state until that journey exists.

**Revisit when:** the full first run exists. It can then offer alerts as part of onboarding rather than leaving the choice entirely to Settings.

## D-026: The worker owns only prayer and refresh alarms, and sound-ending is a message

**Decided:** the review of Step 2 found three bugs, now fixed. First, the notification icon URL was relative and resolved against `background/index.js`, so Chrome refused the image and showed nothing; both alert paths now use `chrome.runtime.getURL(...)` and await `notifications.create` with a fixed `console.error` on failure. Second, the beep never returned the Play button to Play; the offscreen page now sends a `sound-ended` message when a sound finishes, fails or is stopped, the popup accepts it only from the offscreen page and returns to Play, and the worker ignores it. Third, `rebuildAlarms` cleared every alarm on a settings change, which deleted the 60 second `clear:<id>` self-clear and left a pinned notification on screen; the worker now owns only `refresh` and `prayer:` names, compares and clears only those, never `clearAll`.

**Why:** an alarm name is also the notification id and the self-clear id, so a blanket `clearAll` destroys another part's bookkeeping. Owning one prefix keeps the worker from touching alarms it did not create, and emitting a distinct `sound-ended` type keeps the popup in sync without the worker having to track playback. Each is a single fixed string, never a message field, so R4 still holds.

**Revisit if:** a future feature needs its own alarm prefix or a second sound source that must also report its end.

## D-027: a replaced sound does not report its end

**Decided:** the offscreen page gives each sound an incrementing id and sends `sound-ended` only when the current sound genuinely ends (the audio `ended` event, a play failure, the beep's 1.2 second timer, or a real user stop). The internal `stop()` that `playFile` and `playBeep` call before starting a new sound pauses and resets the old one but does not report it, and it advances the id so a stale timer or event for a replaced sound is ignored. Starting a new sound over a playing one therefore keeps the Play button on Stop.

**Why:** before this, `stop()` sent `sound-ended`, so pressing Play while a prayer's adhan was playing flipped the button straight back to Play while the new sound was still sounding. Reporting only the current sound, keyed by id, makes a timer or event unable to end a sound it did not own.

**Revisit if:** a sound ever needs to overlap another on purpose, for example a layered alert, which would need a different ownership model.

## D-028: Ramadan relabels Fajr and Maghrib, and the card is on by default

**Decided:** while today is inside Ramadan on Umm al-Qura (with the user's Hijri shift) and the `ramadanCard` setting is on, the Times screen reads Fajr as "Suhoor ends" and Maghrib as "Iftar". The hero names the next prayer "Suhoor ends" or "Iftar", the countdown note reads "until suhoor ends" or "until you break your fast". The Hijri date already names the day, so no separate day line is added. Every other prayer keeps its name. Settings gains a "Ramadan" group above Alerts, shown while the card would ever apply (inside Ramadan or up to three days before), with one "Ramadan card" switch and no hint. The card defaults to on; turning it off returns all six times to their normal names.

**Why:** the two prayers that bound the fast matter more than their names during Ramadan, so the automatic reading Ali asked for renames only those two and leaves the rest alone. The switch exists for someone who prefers the plain prayer names, but the default follows the brief's automatic behaviour. The notice window (three days before and the first two days) and the timetable are deferred to Step 3b. The Umm al-Qura Isha plus thirty minutes rule was already in the engine and is untouched.

**Revisit if:** Ali asks for the labels always on, or for a suhoor or iftar reminder, which would turn the card into a fuller Ramadan view.

## D-029: the header shows the day once

**Decided:** the review of Step 3a asked to remove the "Ramadan, day N" line that D-028 added under the Hijri date. The Hijri date already reads "13 Ramadan 1448", so the second line repeated the same fact and pushed the header against the hero card. The line and the `is-ramadan` spacing rules that tightened around it are removed, and the e2e test now asserts the Hijri date shows "Ramadan" and that the day appears only once in the header.

**Why:** a screen must not repeat a fact it already shows, and the extra line cost the header its normal gaps. The Hijri date is enough on its own.

**Revisit if:** a later design wants the day number shown separately in the header, which would need a different layout, not a second text line.

## D-030: the Ramadan notice, Eid and the iftar wording

**Decided:** on the one, two and three days before Ramadan (not on the days of Ramadan) the Times screen shows a closable coming notice between the header and the hero card: title "Ramadan begins on <date>", line "From the first day, the Ramadan card shows suhoor and iftar times here. You can turn it off in Settings.", and no action button. Closing it stores `true` under `sajdatime.notice.ramadan.<hijriYear>`, so it stays closed for that Ramadan only. On the two Eids (`eidOn(today)` set) the Times screen shows a closable notice with the title "Eid Mubarak" and the line "Follow your mosque for the date of Eid."; closing stores `sajdatime.notice.eid.<eid>.<hijriYear>`. While alerts are on and the Ramadan card is on, the Maghrib alert message is "It is time for Maghrib. You can break your fast."; every other prayer, and Maghrib outside Ramadan, keep "It is time for <prayer> in <place>."

**Why:** the three pieces all name the Ramadan moment: warn the user three days before, greet the Eid, and say the Maghrib call is the time to break the fast. The notices use the quiet (soft green) tone because they are invitations, not problems. The dismissed keys are separate from `sajdatime.settings.v1`, so closing a notice never touches settings. The coming notice and the Eid notice cannot show together, because coming days are before the first day and the Eid is the first Shawwal.

**Closed in Step 5 (D-032):** the base Times screen once filled 380 by 600 exactly, so the notice pushed the popup taller than 600 px and it scrolled. Step 5 rebuilt the Times screen so every state — normal, Ramadan, the coming notice and Eid — fits 380 by 600 with no scroll in both themes, and built the full `Notice` component.

**Revisit if:** Ali wants the deferred "Shift the date" notice on the first two days of Ramadan, or a different close control than the "Close" text link.

---

## D-031: the design foundation (Step 4)

**Decided:** every colour in the popup comes from `src/popup/tokens.css`, named by Material role, with the light and dark values copied from the phone's `docs/design-system/tokens/color.json`: 32 roles from `primary` to `inverse-primary`. `tests/unit/tokens.test.ts` fails if any token drifts from `tests/fixtures/color.json`, a byte copy of that file. `--cta` and `--on-cta` come from `brand.cta` and `brand.onCta`; the hero card's three stops and three inks come from `gradients.hero`. The decorative header gradient and `--hero-a/b/c` are gone and the header is flat. The brand is "SajdaTime", sentence case, 16 px semibold in `primary`, never uppercase. The theme is System, Light or Dark, System by default, stored as `theme` in `sajdatime.settings.v1`, migrated to `system` when an old setting has no theme, and rejected by the validator for anything else. It is written as `data-theme` on `<html>`, and `color-scheme` is set in `tokens.css`, before the content renders. `tools/check-bundle.mjs` now rejects a literal colour outside `tokens.css`, `text-transform` and `!important` anywhere in `src/`.

**Why:** the phone's tokens are the design system; a second palette in the extension would drift the moment either side changes, so the values are copied against a fixture rather than retyped from memory. Role names let the component styles stay literal (no hex) and let one attribute switch the whole popup. U2 removes a decorative gradient that contradicted the rule against colour behind text that changes with time; the hero *card* keeps one fixed gradient, because PLAN 3.1 allows exactly that, and its tokens are defined now for Step 5 to use. U3 removes an uppercase word mark. U12 gives System as the safe default, keeps an explicit choice across reloads, and reuses the existing settings migration path instead of a second storage key. The focus ring was already `3px solid var(--primary)` with a 2 px offset, which meets 3:1 in both themes, so no new focus token was invented. `color.json` has no hover role, so hover uses `filter: brightness(0.92)` on the existing controls rather than a made-up colour.

**Known gaps:** the light card shadow and dark hairline are applied to `.next-card` only; the other card-like surfaces keep the existing hairline in both themes until Step 5 or 6 unify them. The hero tokens are defined but unused until Step 5 builds the hero card. The Theme selector has no hint line, because the brief gives no words for one and inventing user-facing words is not allowed. With an explicit Light or Dark choice on an operating system set the other way, the empty window background can follow the operating system for the few milliseconds the storage read takes: the CSP forbids an inline script and `localStorage` is banned, so there is no synchronous cache. The content itself never paints in the wrong theme, and an e2e observer proves the first content appears with the stored theme; System is exact from the first frame.

**Words instrument:** UX-PLAN 5.4 says "a unit test scans the built strings". The check is an e2e scan of what is rendered (text plus every `aria-label`, `title`, `placeholder` and `alt`) on every screen in both themes, with a self-test that proves the detector fires on bad copy. A raw source scan would count code semicolons and CSS class names as prose and would miss strings assembled at runtime, so the literal instrument was changed deliberately. The build-time scan covers the code-side part: uppercase is banned by `check-bundle.mjs`.

**Revisit if:** a later phone release adds focus or hover roles to `color.json`, or Step 5 replaces the card surfaces.

---

## D-032: the Times screen re-plan (Step 5)

**Decided:** Step 5 rebuilt the Times screen exactly as `docs/UX-PLAN.md` writes it — U4 (header with logo, bold Gregorian date over the Hijri date, and the town chip), U5 (the hero card with the phone's `gradients.hero` values on the next prayer card only), U6 (the six rows with a `Glyph` per slot) and U7 (the footer Settings button and the worked-out line) — plus the `Glyph`, `TownChip` and two-tone `Notice` components. The whole popup fits 380 by 600 with no scroll in light and dark, including Ramadan and with a notice showing, and the countdown ticks once a second without moving the layout.

Deviations from `PLAN.md` §6.1 and the phone's component specs, each deliberate so the notice state stays inside 600 px:

- **Times rows are 40 px, not 42 px.** `PLAN.md` §6.1 asked for rows of at least 42 px, but the phone's Today rows are actually 50 px (`03-components.md` line 185), so either is a re-plan. 40 px was chosen because 42 px pushed the coming-notice state over 600 px. The 44 px touch target is met by the header chip, footer button and notice close, not by read-only time rows.
- **Notice padding is 12 px, not 16 px.** The phone's Notice uses 16 px; the popup is the compact variant at 12 px.
- **Hero name and time are 20 px, not 24 px**, and the hero glyph is 20 px, not 24 px.
- **The countdown and its note sit on one line.** "until it begins" (or the Ramadan wording) is an inline span after the countdown, not its own row, so the hero card stays short enough for the notice to fit. The countdown is 20 px (not 22 px), the note 14 px.
- **Day bars are 4 px tall with an 8 px gap and 4 px top margin** (not the earlier 8 px margin), and there are five bars — one per prayer, no sunrise.
- **"until <prayer>" became "until it begins".** The hero reads "Next prayer" already, so naming the prayer again in the note repeated a fact the card shows.
- **Glyph stroke widths follow the phone's vector drawables, not U6's literal "2 px".** The Android `widget_glyph_*.xml` files use 1.8 for the six base glyphs, 1.5 for the Isha star and 3 for the Asr shadow, so `Glyph.tsx` uses those exact widths.

Two details worth keeping for the next reader:

- **The town chip's accessible name is "London, change location"** (place first, then the action), not `PLAN.md`'s "Change location, London". axe's WCAG 2.5.3 Label in Name rule failed the second form because the visible words "London" then "Change" must appear in the accessible name in order; "London, change location" keeps them. A zero-width space between the two spans keeps them separate words for axe (flex `gap` is visual only, so without it the DOM reads "LondonChange" as one word).
- **The countdown line count is measured by height over line height**, not by `Range.getClientRects()`. The note is a smaller font than the digits, so a Range over the two runs reports two rects on one line.

**Why:** the header, hero, rows and footer are one screen the user sees every time they open the popup, so it is the place to spend the design care. The hero gradient is the one fixed gradient in the product, carried only on the next prayer card, and its inks are `--on-hero` (countdown and name), `--on-hero-label` ("Next prayer") and `--on-hero-secondary` (the time and the note). Green stays reserved for the next prayer, Qibla and pressable text, so row glyphs are `currentColor`, never green.

**Verified:** `npm run check` (250 unit tests, strict typecheck, build, bundle scan) and `SAJDATIME_SCREENSHOTS=1 npm run test:e2e` (70 tests) both pass. The fit is asserted by e2e for normal, Ramadan, coming-notice and Eid states in both themes at `scrollHeight <= 600` and `<= clientHeight`. Screenshots live in `docs/images/times-*.png` plus `zoom-200.png`.

**Revisit if:** Step 6 unifies the remaining card surfaces, or the brief adds a longer notice line that needs the compact padding revisited.

Superseded in part by D-033 (Step 5 review): the one-line countdown note, the 20 px countdown, the 40 px rows and the notice's -12 px pull-up under the header are all replaced; the remaining deviations (notice padding 12, hero name and time 20, hero glyph 20, 4 px bars, five bars with no sunrise, "until it begins" instead of "until <prayer>", and the glyph stroke widths) stay.

## D-033: the Times screen fixes from the Step 5 review

**Decided:** the review of `8a29451` found the screen looked wrong although every test passed, and asked for one commit of fixes with e2e measurements so none can come back. These changed:

- **The header is two rows.** 16 px of top padding, row one holds the mark and the date block (bold Gregorian date over the Hijri date, both `nowrap` and never ellipsised), row two holds the town chip alone at the start, 8 px between the rows, 16 px below the header. One row could not hold a date that must never be cut off: the date read "Tuesday 27 Octo..." and the Hijri year wrapped into the hero card.
- **The hero words paint above the sheen and the rim.** The card is `isolation: isolate`, and `::before` (sheen) and `::after` (rim) sit at `z-index: -1`, so they draw over the gradient and under the text. Before this they sat on top and the label, name and countdown read faded grey.
- **The five bars share the card's inner width equally.** The outlined "next" bar draws its 1.5 px ring with an inset box-shadow, not a border: a border adds 3 px to that one bar and the five stop being equal.
- **The countdown is a zero-padded clock.** `00:44:59`, 32 px, tabular figures, the same shape the phone draws (`TimeFormat.countdownClock`), with "until it begins" (or the Ramadan wording) on its own line below it. A screen reader hears "44 minutes 59 seconds until Dhuhr" from the timer's `aria-label`, because digits read one by one are not words.
- **The hero is laid out top to bottom** — label, glyph and name and time on one row, the countdown, "until it begins", the bars — with 12, 12, 8 and 16 px gaps rather than a squeeze.
- **Times rows are 32 px, not 40 px.** The review's requests add about 120 px (two-row header, larger countdown, note on its own line, 16 px section gaps). The six rows are where the height comes from; at 40 px the coming-notice state lands over 600 px. The 44 px touch targets (header chip, footer button, notice close) are unchanged.
- **The notice sits fully below the header**, 16 px down, and 8 px above the compact card. Before this it pulled up under the chip with a -12 px margin.
- **On a notice day the hero card is compact** (Ali's ruling, newest answer to the fit question): one row with the glyph, the prayer name, its time and the countdown. The label, "until it begins" and the five bars are dropped on those days only, the gradient, ink and glow stay, and the whole sentence "Dhuhr at 11:45, 44 minutes 59 seconds until it begins" is the row's `aria-label`. Dismissing the notice returns the full card. Every other day keeps the full card.

**Rejected options, recorded so they are not tried again:** letting the notice replace the hero hides the countdown, which is the popup's main job; letting the popup scroll pushes Isha and Settings off the 600 px screen, which D-030 already ruled out.

**Measured:** `tests/e2e/hero.test.ts` asserts, in all four states and both themes: no scroll and no clipping, the two date lines one line each and untruncated, the header 16 from the top and its block 16 clear of the header, the gradient present, the full hero's order and gaps on the scale, a `\d{2}:\d{2}:\d{2}` tabular countdown with its note below, five equal bars inside the padding box with equal gaps, every hero ink at opacity 1 and 4.5:1 against all three gradient stops, and the paint order (a probe that first lets the overlays take pointer events, then proves `elementFromPoint` at each text centre returns the text, not the card — the mutation of removing `z-index: -1` flips this test to fail). The worst state, the coming notice, measures 594.3 of 600 in both themes; the normal state 592.1; Eid 537.2.

**Why:** the reviewer could not see a live popup, so the fixes had to be provable by number. The compact hero keeps the countdown visible, which is the whole reason the popup exists, and is the option Ali chose over hiding it or scrolling.

**Revisit if:** a later step shortens or removes the notice, which would let the rows or the countdown grow again, or Step 6 gives the Times rows back their height.

## D-034: the Settings restructure (Step 6)

**Decided:** Step 6 rebuilt Settings as one scrollable screen of `Row`s grouped into cards, exactly as `docs/UX-PLAN.md` §4 and §6 write it. The frozen Times screen, hero, notice and footer are untouched; only the Settings DOM, its sheet components and the e2e selectors that drove the old `<select>` and inline controls changed.

The new layout, top to bottom: a header (back arrow "Back to times", title "Settings"), then a fixed-height 600 px column whose inner `.settings-scroll` scrolls, holding these group cards:

- **Disclaimer** (its own card, first, never moved — U8 wins over U11's old About list): one Row, title "Disclaimer", value "A helper, not a religious authority. Worth reading.", opening a full-text Sheet titled "Disclaimer" whose body is the single-paragraph extension disclaimer ending with the dua request.
- **Place**: one Row opening the existing LocationSheet; focus returns to the Place row on close.
- **Prayer times**: School (Segmented Sunni/Shia), Asr school (Segmented Shafi'i/Hanafi, hidden for Shia methods), Calculation method, Hijri date (stepper).
- **Ramadan**: the existing switch, only while `showRamadan` holds.
- **Alerts**: a never-closable amber Notice while notifications are denied ("Prayer alerts are blocked"), the master switch, five prayer switches, the Sound Row, "Send a test alert", the field hint and a quiet Notice ("<browser> needs to be open").
- **Appearance**: Theme (Segmented System/Light/Dark).
- **About**: Privacy policy (Row opening the page in a new tab), Credits (Row opening a Sheet with the GeoNames, adhan-js and adhan-recording attributions), Version (plain-value Row, no chevron).

Components added under `src/popup/components/`: `Row` (36 px icon tile, title over value, chevron, whole row is the button, `data-row` and `aria-label="${title}, ${value}"`), `Sheet` (title top start, close X alone top end, content, "Done" at the foot, focus moves in and returns to the row, Escape closes), `ChoiceRow`, `Segmented`, and a `Notice` that uses **distinct `settings-notice*` class names** so it cannot collide with the frozen Times `.notice*` classes.

The method Sheet (U13) is the only one without a Done button: choosing a method saves and closes immediately. It shows each offered method with the phone's exact name and description plus "Fajr {time} · Isha {time}" for today in the current place, grouped "Suggested for <country>" (suggested + alternatives) then **Europe** (Moonsighting, Muslim World League, ISNA, Diyanet), **Middle East and Africa** (Umm al-Qura, Egyptian, Dubai, Kuwait, Qatar), **South and East Asia** (Karachi, Singapore), **Shia** (Jafari, Tehran). For a Shia sect the sheet shows only the Shia group.

**Why:** U8 demands the disclaimer be first and never moved, so it is its own first card and no duplicate sits in About. U9 makes every setting a row with a sheet, so the old inline `<select>`s and inline choice list go. U13 wants the method list comparable against today's Fajr and Isha, which is why each row carries the two times and the sheet has no Done. The distinct `settings-notice*` classes keep Step 5's frozen `.notice*` styling and `notices.test.ts` untouched. The 600 px fixed column plus an inner scroll lets Settings and the method sheet scroll (PLAN §6.4) while every other screen still fits with no scroll.

**Resolved before implementation (flag to reviewer):** the region mapping above, the phone-exact method names and descriptions in `METHOD_NAMES`/`METHOD_HINTS`, the material-outlined icon set (Info/Pin/School/Clock/Tune/Calendar/Note/Contrast/Lock/Person/Phone), and the switch rows keeping their existing `.switch-row`/`.switch` pattern without icon tiles (only chevron rows get the 36 px tile). "Send a test alert" stays an inline solid button in the Alerts card.

**Verified:** `npm run check` (250 unit tests, strict typecheck, build, bundle scan) passes. The e2e suite, axe in both themes, the Settings fit/scroll measurements and the screenshots are in `docs/images/settings-*.png` (light, dark and 200% zoom for Settings and each sheet).

**Revisit if:** a later step adds a row whose sheet needs different footing, or the phone adds a method name or region the extension does not yet carry.


## D-035: the Step 6 review fix

**Decided:** the Step 6 review of `5e3c71a` came back **not ready** with two visible problems. Both are fixed here, and the optional third is done because the brief already asked for it.

1. **A Row is one line of layout.** The review measured about 120 px per row, with the title at the top, the value 30 px below it and the icon tile floating in the middle. The cause was a zero-width space rendered as a bare text node between `.row-title` and `.row-value`: it became an anonymous flex item in the column, so it added a 20.8 px line plus two 4 px gaps to every row that showed a value. The space now lives inside the title span (`{title}\u200B`), so `textContent`, the accessible name and the axe `label-content-name-mismatch` pass are unchanged, but no extra flex item exists. `.row` is now `min-height: 56px; padding: 8px 12px; gap: 14px`, which draws a value row at **60.4 px** and a title-only row at **56 px**.
2. **A group heading shows only when the group holds two or more rows.** The review named "Disclaimer over Disclaimer" and "Place over London". A local `Group` component now renders the `h2` and the `aria-labelledby` only when `rows >= 2`, and a plain `div.group-card` otherwise, so no group ever points at a heading it does not have. The heading count is passed in rather than derived from children, because the Alerts card's row count changes with its master switch: with alerts off it holds one row and has no heading, and turning alerts on brings the heading back with the five prayers and the Sound row.
3. **The method sheet names each method once.** The suggested methods now form the first group and are removed from the region groups below, a group left empty is dropped, and the hardcoded Shia group is never appended for a Sunni user. A Sunni list is 11 methods, a Shia list is exactly jafari and tehran under one Shia heading.
4. **Play sits beside the Sound title.** `Sheet` grew an optional `action` slot rendered in the header between the title and the close button, which is where `BUILD-NEXT.md` Step 2 puts the compact Play button. `.sheet-head` is now `flex-start` with the title at `flex: 1` so every other sheet keeps its title at the start and its close X at the end.

**Deliberate deviation (flag to reviewer): the row is shorter than the phone's.** `~/Developer/SajdaTime` draws `PlainRow` at `heightIn(min = 64)` with `padding(16 × 12)`, and its subtitle has no `maxLines`, so a phone row with a subtitle is about 72 to 80 px and long subtitles wrap. The review's 56 to 64 wins, because this popup has 600 px for eight cards and the review is Ali's quality bar. The type and the 4 px title-to-value gap are the phone's own (title 16/1.3 at weight 600, value 14/1.4 in `onSurfaceVariant`).

**Consequence to know about:** because a row may not exceed 64 px, `.row-title` and `.row-value` are each one line with `text-overflow: ellipsis`. Nine of the ten rows fit their value in the 228 px available. Two do not: the Credits value is 256 px wide and the Disclaimer value is 315 px, so each ends in an ellipsis ("A helper, not a religious authori…"). Every word stays in the DOM text, in the accessible name and in the sheet behind the row, and the Disclaimer row stays first, so nothing is softened or buried. The alternative, letting those two values wrap, puts their rows at about 85 px and fails the review's own "every row is 56 to 64 px" test.

**Test that can fail:** `tests/e2e/settings-rows.test.ts` measures every row and asserts 56 to 64 px, a 4 px title-to-value gap, one shared vertical centre within 1 px for the icon, the text block and the chevron, the heading rule against the rendered row count, and the method list (no id twice, 11 for Sunni with no Shia name or heading, exactly jafari and tehran for Shia). Run against `5e3c71a` it fails on the height (120), the gap (30.4) and the duplicated methods.

**Verified:** `npm run check` passes (strict typecheck, 250 unit tests, build, bundle scan). `npm run test:e2e` passes **77** tests, four of them new. `docs/images/settings-{light,dark,zoom-200}.png`, `docs/images/sheet-method-{light,dark}.png` and `docs/images/sheet-sound-{light,dark}.png` are regenerated. The other twelve sheet images and `docs/images/zoom-200.png` decode to **identical pixels** before and after (checked by converting both to BMP and comparing bytes), so the frozen Times screen did not move.

**Revisit if:** Ali wants a long value to wrap, in which case that row exceeds 64 px and the height test needs to allow it.

## D-036: the badge and reminders (Step 7)

**Decided:** Step 7 of `docs/UX-PLAN.md` (Badge and reminders, `PLAN.md` §7) ships the toolbar badge, the Reminder before prayer setting and the Suhoor reminder, plus two P3 fixes carried over from the Step 6 PASS review. One commit.

1. **Toolbar badge.** `src/core/badge.ts` builds the badge from `nextPrayer`: the text is the wait rounded up to the nearest minute, "54m", "5m" or "1m" under an hour, "1h54" or "9h05" from an hour to under ten, "11h" from ten hours, never "0m" and never more than four characters. The background and the white text are built in code from their RGB parts (0x0b, 0x5a, 0x43 and white) with a local `hex()` helper, because the bundle scan forbids a literal colour outside `tokens.css`. The tooltip is "SajdaTime: Maghrib in 1 hour 54 minutes (5:59 pm)". Before setup the badge text is cleared and the tooltip reads "SajdaTime: set up your prayer times". The badge is a repeating one minute `badge` alarm that the worker keeps alive on every rebuild, so the countdown stays current even when prayer alerts are off.

2. **Reminder before prayer.** A new Alerts group Row, off by default, offering 5, 10, 15, 20 or 30 minutes in a Sheet built on the Step 6 Row, Sheet and ChoiceRow components. It fires a silent notification (no sound, no requireInteraction) that many minutes ahead of a prayer the user enabled, only while alerts are on.

3. **Suhoor reminder.** A new Row in the Ramadan group, off by default, offering 15, 30, 45 or 60 minutes before Fajr. It is independent of the alerts master switch and is scheduled for today and tomorrow whenever `isRamadan` holds, firing at Fajr minus the minutes. The notification plays the chosen sound and carries a "Stop sound" button, like a prayer alert.

4. **Alarm names.** The `AlarmName` union grew three kinds, all built from fixed words and parsed strictly before any `prayer:` fallback: `badge` (one fixed word), `reminder:<date>:<slot>` and `suhoor:<date>`. `SECURITY.md` R11 is unchanged; `parseAlarmName` handles the new kinds and the unit tests cover malformed names.

**Wording (flag to reviewer, two places).** The reminder title is "<Prayer> in <n> minutes" and its body "<Prayer> begins at <time>", which follows `PLAN.md` §7's "Asr in 15 minutes style" rather than the phone's "Asr at <time>" notification title. The suhoor title is "Suhoor ends at <time>" and its body "Fajr begins in <n> minutes", spelling "minutes" in full because the extension has no "%d minute(s)" plural helper; the phone spells it "minute(s)". Neither wording is invented: both are `PLAN.md` §7 or the phone's own strings.

**Two P3 fixes from the Step 6 PASS review, done here.**

5. **Disclaimer value fits.** The Disclaimer row value is shortened to "A helper, not a religious authority." (dropping "Worth reading."), so it draws at 228 px wide and no longer ends in an ellipsis. The full disclaimer text, which keeps "Worth reading.", is untouched. The Credits value ("GeoNames, adhan-js, adhan recordings", 256 px) still ends in an ellipsis; that was not in the review's ask.

6. **Every group title uses one inset.** The `.switch-row` had no horizontal padding, so the "Prayer alerts" switch title sat at about 24 px while the group headings sat at about 33 px and the rows at about 36 px. `.switch-row` now has `padding: 8px 12px`, the same as `.row`, so switch content lines up with every other row's content. The group headings keep their 8 px padding, so a heading draws about 3 px left of its card's rows; that small hanging offset is the design already in place for every group and was not part of the review's complaint.

**Not done, deliberately:** `PLAN.md` §7 also writes that the Makkah-fallback badge tooltip ends "for Makkah". The extension does not store whether the place came from the fallback or was chosen by name, so there is no flag to hang that wording on; the badge simply works for Makkah like any other place. Adding a stored "fallback" flag would widen the storage schema for a tooltip, which was not in the Step 7 scope.

**Verified:** `npm run check` passes (strict typecheck, 270 unit tests in 15 files, build, `check-bundle: 7 bundle files and the source are clean`). `npm run test:e2e` passes **78** tests, two of them new (the Suhoor reminder sheet in Ramadan, and the reminder sheet already counted in the sheets loop). The badge boundaries are unit-tested in `tests/unit/badge.test.ts` (over an hour, under an hour, under a minute, across midnight). `docs/privacy.html` now reads "your alert and reminder choices, and other display settings."

**Revisit if:** Ali wants the Makkah-fallback tooltip wording, which means first storing a flag for how the place was chosen.

## D-037: the daily refresh follows any alarm, not only prayer alerts

**Decided:** `scheduledAlarms` adds the once a day `refresh` alarm whenever the list holds any prayer, reminder or suhoor alarm, and returns an empty list when all of them are off. The push moved from inside the `alerts.enabled` branch to just before the return, guarded by `alarms.length > 0`.

**Why:** the refresh is the only thing that wakes the worker after local midnight to plan the next day. It was pushed only while `settings.alerts.enabled` held, so a user with prayer alerts off and the Suhoor reminder on received today's and tomorrow's suhoor alarms and nothing after that. There was no midnight wake-up, and the alarm came back only when Chrome restarted through `onStartup`, `onInstalled` or a settings change. Step 7 made the Suhoor reminder deliberately independent of the master switch (D-036), so this combination is supported on purpose, not an edge case.

**Rejected:** a second repeating alarm for suhoor alone, because it doubles the wake-ups and leaves two alarms doing one job. Pushing `refresh` unconditionally was rejected too. With everything off the worker should own nothing except the always-on `badge` alarm, which `tests/e2e/alerts.test.ts` already asserts as `['badge']`.

**Test that can fail:** `tests/unit/alerts.test.ts`, "keeps the daily refresh when prayer alerts are off but the suhoor reminder is on". It uses 20 February 2027, inside Ramadan 1448, and asserts both `suhoor:2027-02-21` and `refresh`. Against `86c5332` it fails with `expected [ 'suhoor:2027-02-21' ] to include 'refresh'`. Its companion, "gives an empty list when prayer alerts and the suhoor reminder are both off" on the same Ramadan date, guards the other half and passes before and after the fix.

**Verified:** `npm run check` passes (strict typecheck, 272 unit tests in 15 files, build, `check-bundle: 7 bundle files and the source are clean`). `npm run test:e2e` passes 78 tests, so the existing expectations that alerts off leaves only the badge alarm still hold.

**Revisit if:** a future setting schedules an alarm of its own without the refresh, or the worker gains a reason to wake daily with nothing scheduled.
