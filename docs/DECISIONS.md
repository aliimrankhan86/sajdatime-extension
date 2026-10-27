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

**Evidence:** extension unit tests pin London 10 April 2026 at 04:12 and London 21 June 2026 at 02:31 and 23:27, matching the phone's shipped engine. Tromso and Longyearbyen on 21 December 2026, and McMurdo on 21 June 2026, are polar, finite and strictly ordered. A Dhuhr +30 and Asr -30 correction at 59.9 degrees cannot reverse the day.

**Revisit if:** the phone changes its high latitude rule or its reference latitudes, or a scholar Ali trusts shows this is wrong for a community he serves.

## D-003: Turkey's Diyanet offsets are not added twice

**Decided:** use adhan-js's `CalculationMethod.Turkey()` with no extra offsets.

**Why:** adhan-js already carries Sunrise minus 7, Dhuhr plus 5, Asr plus 4 and Maghrib plus 7. The phone uses the same library settings through adhan-java. Adding them again would move four times by up to 14 minutes.

**Evidence:** adhan-js 4.4.6 carries the offsets inside `CalculationMethod.Turkey()`. `src/core/methods.ts` calls that factory and adds nothing to `methodAdjustments`, so the offsets are applied once. The extension has no separate Turkey test yet, so the next golden fixture pass covers it.

**Revisit if:** the phone starts using a different Turkish source.

## D-004: Golden values come from the phone engine, not the phone's test file

**Decided:** extension fixtures use the values the phone engine produces after adhan's nearest-minute rounding. They do not copy the phone test file's expected numbers, because those numbers came from the Aladhan API with a two-minute tolerance.

**Why:** the phone's `PrayerEngineTest` calls Aladhan while developing and asserts within two minutes. Its expected Makkah Asr is 15:37, the phone engine gives 15:38. Copying the API values would make the extension test fail against the library the app actually uses, or hide a one-minute disagreement behind a tolerance.

**Rounding:** adhan-js 4.4.6 rounds its exact time to the nearest minute by default. The phone's `instantOf` truncates adhan-java's exact time to the minute. The two libraries do not produce identical seconds, so the same place, date and method can land one minute apart when the seconds fall on different sides of the boundary. The extension keeps the library default. It does not hide the difference behind a wide tolerance.

**Known one minute case:** Makkah, 15 January 2026, Singapore method. The extension gives Dhuhr 12:32 and Isha 19:18. The Java reference gives 12:31 and 19:17, and the phone truncates to those. This is a library rounding difference, not a wrong angle. The plan's same-minute rule cannot be met everywhere without copying adhan-java's exact seconds, which adhan-js does not expose. Every fixture the extension pins agrees with the phone.

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

**Decided:** the manifest asks for `storage` and `geolocation`. Nothing else. `alarms`, `notifications` and `offscreen` are deliberately absent until an alert actually works.

**Why:** the extension never reads a page, never calls a server and never needs a tab. Every extra permission makes the install warning longer and the store review harder. Declaring notification and alarm permission for a feature that cannot fire asks the user to trust a promise the build does not keep. The review of 27 October 2026 found this, and the first build should ask only for what it uses.

**Revisit only with:** the first working alert, in the same change that uses the permission, the service worker and the settings screen. A future feature that needs a host permission must bring a written reason and Ali's agreement.

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

## D-013: The popup follows a smaller viewport

**Decided:** the popup is `width: 100%` with a `max-width` of 380 pixels, not a fixed 380 pixels.

**Why:** browser zoom shrinks the layout viewport. At 150 percent the fixed width left a 380 pixel layout inside 253 pixels, so the labels stayed and every time was cut off on the right. A maximum keeps the intended size at normal zoom and lets the column shrink instead of clipping.

**Evidence:** a Playwright test sets the viewport to 253 by 600 and asserts `scrollWidth === clientWidth` with the time values still visible.

**Revisit if:** the popup grows a control that genuinely cannot shrink. Even then it may scroll, but it must not clip.

## D-014: Coordinates are rounded to about one kilometre

**Decided:** the place saved from the browser is rounded to two decimal places before it is stored.

**Why:** PLAN.md asks for two places to be kinder to privacy. Six or seven decimal places describe a building; two describe a neighbourhood, which is all prayer times need.

**Revisit if:** city search replaces the browser fix and stores a city centre instead.

## D-015: The countdown is written as "9 h 23 m 59 s"

**Decided:** the countdown uses spaced hour, minute and second units. It does not use the plan's `h:mm:ss`.

**Why:** the spaced form is easier to read at a glance in a small popup, and it fits the available width. The plan's compact form saves space but reads like a timer on a machine, not a prayer time.

**Revisit if:** a later layout gives the countdown a wider column and the shorter form becomes the calmer choice.
