# Store listing draft

**Status:** working draft, 27 October 2026. Nothing here has been submitted. Every claim must be checked against the build before Ali uploads it.

## Name

SajdaTime

## Summary, Chrome Web Store

Limit: 132 characters.

> Quiet prayer times in your browser, with a countdown and the Hijri date. No account, no ads, no tracking.

That is 107 characters.

## Detailed description

Limit: 16,000 characters on Chrome. Edge allows 250 to 10,000.

> **Prayer times, without the noise.**
>
> SajdaTime sits in your browser toolbar and shows the next prayer, a calm countdown and the whole day at a glance. Open it, see where you are in the day, close it.
>
> **What you get**
>
> - Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha for your place.
> - The next prayer with a countdown that updates every second.
> - The Hijri date from the Umm al-Qura calendar.
> - A place chosen from your location or an offline search of about 70,000 towns and cities, with a clear fallback to Makkah.
> - A Settings screen for your place, 13 calculation methods, the Hanafi or Shafi'i Asr school, and a Hijri date shift.
> - Light and dark themes that follow your computer.
> - A popup designed to fit without scrolling, with large readable times.
>
> **Private by design**
>
> SajdaTime makes no network requests. Prayer times are worked out on your computer with the open source adhan-js library. The city list is built into the extension, so searching a town is also offline. There is no account, no advertising, no analytics and no remote code.
>
> Your place and settings are stored in your browser's local extension storage. When you choose **Use my location**, the browser supplies the coordinates and SajdaTime keeps them on your computer. SajdaTime does not send them anywhere.
>
> **A helper, not a religious authority**
>
> Prayer times are an aid. They can differ from your mosque by a minute or two because of the method, the rounding or the high latitude rule. Follow your mosque where the two differ. If you are unsure, ask a scholar you trust.
>
> SajdaTime is free and has no ads. It is a separate product from the SajdaTime app for Android.
>
> **Coming next**
>
> Prayer alerts, a countdown badge, a Ramadan timetable, and Urdu, Arabic, Turkish and Indonesian. The listing will be updated when those are ready. Do not install this build expecting them yet.

## What is new

First development build. Not for public use yet.

## Permission explanations

Chrome shows these in the install prompt and asks for a reason during review.

| Permission | Why SajdaTime asks | When it is used |
| --- | --- | --- |
| `storage` | Save your place and settings in the browser profile. | When you finish first run or change a setting. |
| `geolocation` | Work out times for where you are when you choose **Use my location**. | Only after you press that button and grant permission. |

No host permissions. No content scripts. No access to tabs, history, bookmarks or page content. Alerts are not in this build, so the extension does not ask for alarm, notification or audio permission yet.

## Single purpose

Show the user's daily prayer times in a browser popup, with the next prayer and a countdown.

## Privacy practices answers, Chrome Web Store

These are the answers to the dashboard's data and privacy form. They must match `docs/privacy.html` and the build.

- **Single purpose:** as above.
- **Location:** yes. Used to calculate prayer times for the user's place. Stored locally in `chrome.storage.local`. Not transmitted to the developer or any third party. Not sold. Not used for advertising.
- **Personally identifiable information:** no.
- **Health information:** no.
- **Financial and payment information:** no.
- **Authentication information:** no.
- **Personal communications:** no.
- **Web history:** no.
- **User activity:** no.
- **Website content:** no.
- **Remote code:** no. All code is in the uploaded package.
- **Selling data:** no.
- **Using data for unrelated purposes:** no.
- **Using data to decide creditworthiness:** no.
- **Privacy policy URL:** `https://aliimrankhan86.github.io/sajdatime-extension/privacy.html` (live from the `docs` folder on `main`).

The dashboard wording changes from time to time. Answer the question it asks, using these facts. Do not tick "no data" just because the data never leaves the computer. Location is handled by the extension and must be declared.

## Screenshots

Chrome needs at least one, up to five, at 1280 by 800. Edge accepts the same set. Five planned:

1. **Times, light.** The whole popup, next prayer and countdown. Caption: "The next prayer, the whole day, and a quiet countdown."
2. **Times, dark.** The same screen in dark mode. Caption: "Follows your computer's light or dark theme."
3. **First run.** The location step with city search. Caption: "Use your location, or find a town offline."
4. **Settings.** Method and Asr school. Caption: "13 methods, Hanafi or Shafi'i Asr, and a place of your choice."
5. **Ramadan.** The timetable month. Caption: "A Ramadan timetable that prints." **Only when that screen exists.**

Until screenshot 5 is real, submit the four that exist. The store needs at least one.

## Promotional images

- Chrome small promo tile: 440 by 280, PNG or JPEG. Use the green field, the sand mihrab mark and the words SajdaTime.
- Edge logo: 300 by 300. Reuse `public/icons/icon-300.png`.
- No video until the alerts work.

## Listing languages

At submission: English first. Add Arabic, Turkish and Indonesian once the UI has those languages. Urdu is added where the store offers it. Do not publish a listing language the extension cannot show.

## Review notes for the reviewer

Short note in the submission form:

> SajdaTime calculates prayer times locally with adhan-js. It makes no network requests, has no analytics and no ads. Location is used only after the user presses "Use my location" and is stored in local extension storage. If the user refuses location, the extension offers a built-in offline city search and a clearly labelled Makkah fallback. The privacy policy explains local storage and the browser's own location service.

This build asks only for `storage` and `geolocation`. Alarm, notification and audio permissions are added with the first working alert, not before.

## Before hitting Submit

- [ ] Every feature named in the description exists in the build.
- [ ] The privacy policy URL loads in a private window with no sign in.
- [ ] The privacy answers match `docs/privacy.html`.
- [ ] Screenshots show the current build, not an older one.
- [ ] The zip contains no source maps, no test files, no `node_modules`, no `.DS_Store`.
- [ ] Version in `manifest.json` and `package.json` agree.
- [ ] Ali has read the listing and pressed Submit himself.
