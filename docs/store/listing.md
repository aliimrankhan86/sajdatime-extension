# Store listing

**Status:** ready for Ali to read, not submitted. Written 28 October 2026 for version 1.0.0, description rewritten 30 October 2026 to name every feature.
Every claim in this file is true of the build in this commit, and `tests/unit/listing.test.ts`
fails if a limit is broken or a required phrase goes missing.

## The rule for every release (Ali, 30 October 2026)

1. **The description always sells the whole extension.** It names every feature the build has,
   in plain words a first-time user understands at a glance. A feature added in a release gets
   its line in the description in that same release. Nothing is left out to save space without
   Ali's word.
2. **"What is new" names only what changed:** what was added and what was fixed in that
   version. Never a feature tour, never a description of the whole extension.
3. Never put an update note in place of the description.

Check both on every release day, before the zip is uploaded.

Both stores take the same zip. Chrome's short summary is 132 characters and its description
16,000. Edge's description must be between 250 and 10,000, so the text below stays under 10,000
and works in both.

## Name

SajdaTime

## Short summary, Chrome Web Store

Limit: 132 characters. The line below is the one to paste, and it is **126 characters**.

> Prayer times, adhan alerts and a live countdown in your browser. Private, works offline, no ads. Six languages including Urdu.

## Detailed description

Limit: 16,000 characters on Chrome, 250 to 10,000 on Edge. The text below is **under 4,000
characters**, so the same paste works in both stores.

```
SajdaTime puts today's prayer times one click away in your browser toolbar. See the next prayer
and a live countdown, hear a gentle alert or the adhan when it is time, and print a month of
times. Free, with no account, no ads and no analytics.

Highlights

- The next prayer at a glance, with a countdown that updates every second and the time left
  shown on the toolbar icon.
- All six times for your place: Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha.
- Prayer alerts with a soft beep, the full adhan or silent, plus an optional reminder a few
  minutes before each prayer. Stop the sound from the alert itself, and send a test alert to
  check it works.
- Match your mosque: move any prayer a few minutes earlier or later so the times agree with
  your local mosque.
- Ramadan made easy: Suhoor ends and Iftar on the main screen, a suhoor reminder, a notice in the
  days before Ramadan begins and an Eid Mubarak greeting.
- Save as PDF: a printable month of prayer times on one A4 page, or a full Ramadan timetable.
- Six languages: English, Urdu, Arabic, Turkish, Indonesian and Bengali. Urdu and Arabic read
  right to left. Each language is shown in its own script with its English name beside it.
- Works offline: times are worked out on your computer, and a search of about 70,000 towns and
  cities is built in.
- Light and dark themes that follow your computer, or pick one yourself.
- Keyboard shortcut: Alt+Shift+S opens SajdaTime.

For every Muslim, wherever you are

- Sunni and Shia. 13 calculation methods, including Muslim World League, ISNA, Umm al-Qura,
  University of Karachi, Egyptian General Authority, Diyanet, Moonsighting Committee, Jafari
  and Tehran.
- Hanafi or Shafi'i Asr time.
- A method suggested for your country when you set up, with today's Fajr and Isha shown beside
  each method so you can compare with your mosque.
- The Hijri date from the Umm al-Qura calendar, which you can move one or two days earlier or
  later to match your community.
- Careful handling of high latitudes such as northern Europe, where twilight can last all night
  in summer.

Set up in a minute

Choose Sunni or Shia, your Asr school and your place, by location or by typing your town.
Confirm the suggested method and turn alerts on if you want them. There is no sign in, ever.
If you skip the location, SajdaTime uses Makkah and says so clearly.

Private by design

SajdaTime makes no network requests. Prayer times are worked out on your computer with the open
source adhan-js library. The city list is built into the extension, so searching a town works
offline too. There is no account, no analytics, no advertising and no remote code.

Your place and settings are stored in your browser's local extension storage. When you press Use
my location, the browser supplies the coordinates and SajdaTime keeps them on your computer.
SajdaTime does not send them anywhere. The developer never receives them.

A helper, not a religious authority

The times are an aid and they are not supplied by any mosque, scholar or authority. They can
differ from your mosque by a minute or two because of the method, the rounding or the high
latitude rule. Follow your mosque where the two differ, and ask a scholar you trust if you are
unsure.

Free, with no ads

SajdaTime is free, has no advertising, and is a separate product from the SajdaTime app for
Android.

Built with

adhan-js 4.4.6, MIT licence, by Batoul Apps.
Preact, MIT licence.
City data from GeoNames, Creative Commons Attribution 4.0 International licence.
Sunni adhan recording by Adam-synagda, CC0. Shia adhan sung by Saeed Hatamzadeh-Varmazyar,
CC BY-SA 4.0, both via Wikimedia Commons.
The full notices ship inside the extension.
```

## What is new in 1.0.0

First public version. Prayer times, the next prayer and countdown, a printable month with a
Ramadan timetable, prayer alerts and a reminder before each prayer, the toolbar badge, six
languages with right to left for Urdu and Arabic, and light and dark themes.

## Single purpose

Use this statement exactly. It is PLAN.md section 12 and Chrome asks for it in its own box.

> Shows Islamic prayer times for the user's location and alerts at each prayer.

## Permission reasons

Chrome and Edge ask for a reason for each permission. Use these words, which are PLAN.md
section 12, and which match the build.

| Permission | Reason to paste |
| --- | --- |
| `alarms` | To alert at prayer times and refresh the countdown. |
| `notifications` | To show the prayer alert. |
| `storage` | To keep settings on this computer. |
| `offscreen` | To play the alert sound, which a service worker cannot do. |
| `geolocation` | To work out prayer times for where the user is, only when the user asks. |

There are no host permissions and no content scripts. The install warning should name storage,
location, alarms and notifications only. If it mentions reading data on websites, stop and say
so: the manifest is wrong.

## Data use answers, Chrome Web Store

Chrome counts data that stays on the device as handled, so **Location** is ticked and nothing
else is. This is `docs/SECURITY.md` R10 and PLAN.md section 12.

- **Single purpose:** as above.
- **Location:** ticked. Used to calculate prayer times for the user's place, stored in
  `chrome.storage.local` on this computer, never sent to the developer or anyone else, never
  sold, never used for advertising.
- **Personally identifiable information, health, financial, authentication, personal
  communications, web history, user activity, website content:** not collected.
- **Remote code:** no. All code is in the uploaded package.
- **Sell or transfer to third parties:** no.
- **Use or transfer for purposes unrelated to the single purpose:** no.
- **Use to decide creditworthiness or for lending:** no.
- **Privacy policy URL:** `https://aliimrankhan86.github.io/sajdatime-extension/privacy.html`

Then tick the three certifications the form asks for. In plain words: the data is not sold, it is
not used or transferred for anything outside the single purpose, and it is not used for
creditworthiness or lending. The data is stored on the user's own computer and the developer
never receives it. Edge asks the same questions in its own words, so answer from this list.

## Screenshots

Five at 1280 by 800, generated from the built extension by `npm run store-images`, in
`docs/store/images/`. They show the current build and nothing drawn by hand.

| File | What it shows | Caption to paste |
| --- | --- | --- |
| `times-light.png` | Times in the light theme | The next prayer, the whole day, and a quiet countdown. |
| `times-dark.png` | Times in the dark theme | Follows your computer's light or dark theme. |
| `method-step.png` | The first run's method step | 13 methods, with a suggestion for your country. |
| `ramadan.png` | Times during Ramadan | Suhoor ends and Iftar, next to the usual times. |
| `times-urdu.png` | Times in Urdu, right to left | Urdu and Arabic read right to left. Times do not. |

## Promotional images

- Chrome small promo tile: 440 by 280, `docs/store/images/promo-tile-440x280.png`, built from the
  extension's own green, mark and name.
- Edge store logo: 300 by 300, `docs/store/images/logo-300.png`, copied from the extension's own
  `icon-300.png`.
- No video.

## Listing languages

English, Arabic, Turkish, Indonesian and Bengali in both stores, from
`public/_locales/{en,ar,tr,id,bn}/messages.json`. **Urdu is added only if the store offers Urdu as
an interface language.** Chrome does not (R13), and the extension's Urdu is complete inside the
popup either way. Do not publish a listing language the extension cannot show.

## Review notes for the reviewer

The submission form has a box for notes. Paste this:

> SajdaTime calculates prayer times locally with adhan-js and makes no network requests. It has
> no analytics and no advertising. Location is used only after the user presses Use my location,
> and it is stored in local extension storage. If the user refuses location, the extension offers
> an offline city search and a clearly labelled Makkah fallback. Alerts are off until the user
> turns them on; they use alarms, notifications and an offscreen page for the sound. The privacy
> policy explains local storage and the browser's own location service.

## Before pressing Submit

- [ ] The zip is `artifacts/sajdatime-1.0.0.zip` and `npm run release-check` passed in this commit.
- [ ] The version in `package.json` and `src/manifest.json` both read 1.0.0.
- [ ] The privacy policy URL loads in a private window with no sign in.
- [ ] The privacy answers above match `docs/privacy.html`.
- [ ] The screenshots show this build, not an older one.
- [ ] The description claims nothing that is not in the build.
- [ ] Ali has read the listing and presses Submit himself.
