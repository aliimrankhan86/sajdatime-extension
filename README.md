# SajdaTime for Chrome and Edge

Prayer times in a quiet browser popup: Fajr to Isha, a calm countdown, and the Hijri date. Worked out on your computer with no account, no ads, and no tracking.

This is a separate product from the [SajdaTime Android app](https://github.com/aliimrankhan86/SajdaTime). The two share a name and a design language, nothing else.

> **Status: early build.** Version 0.1.0 is not in any store. The engine, the first run and the Times popup work. Settings, alerts, the badge, Ramadan, the five languages and the store listing are still to come. See [the handover](docs/HANDOVER.md) for exactly what is done.

![The Times popup in light mode](docs/images/times-light.png)

## What works today

- Prayer times with 13 calculation methods in the engine, including Jafari and Tehran.
- The next prayer with a countdown that updates every second.
- Sunrise, the current prayer and the whole day at a glance.
- The Hijri date from the Umm al-Qura calendar.
- A first run that asks for location, then keeps the place on this computer, with a clearly labelled Makkah fallback if location is refused.
- Light and dark themes that follow the computer.
- A popup that fits 380 by 600 pixels without scrolling.

## What is not built yet

- A settings screen, so the calculation method and Asr school cannot be chosen yet. They are selected for the user from the place.
- City search, and changing the place after first run.
- Prayer alerts, the countdown badge, and the offscreen audio page.
- Ramadan notices, the suhoor timer, Eid notices and the timetable page.
- Urdu, Arabic, Turkish and Indonesian, with right-to-left layout.
- Store screenshots, the final listing and the submission checks.

## Build it

You need Node 22 or newer and a Chromium browser that supports Manifest V3.

```bash
npm install
npm run build
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked**, and pick the `dist` folder. The popup opens from the SajdaTime icon or with **Alt+Shift+S**.

For Edge, open `edge://extensions` and load the same `dist` folder.

## Checks

```bash
npm run typecheck   # TypeScript, strict
npm test            # engine, Hijri and suggestion tests
npm run check       # typecheck, unit tests, production build
npm run test:e2e    # builds, then drives the real extension in Chromium
```

The end-to-end tests use Chrome for Testing from the Playwright cache. Change the path in `tests/e2e/extension.ts` if yours is different. The geolocation permission bubble cannot be driven from Playwright for an extension origin, so that one test supplies a known fix and checks what the extension does with it.

## How it is put together

```
src/core/       prayer engine, methods, Hijri calendar, method suggestions
src/settings/   versioned settings and chrome.storage.local
src/popup/      Preact popup, Quiet Glass tokens
src/background/ service worker (empty until the alerts step)
src/manifest.json
tests/unit/     Vitest
tests/e2e/      Playwright against the built extension
tools/          icon generation
docs/           plan, decisions, handover, privacy, store copy
```

The engine is pure TypeScript and has no DOM dependency. The popup works everything out from `chrome.storage.local` when it opens, so it does not depend on the service worker staying alive. The service worker will own alarms, notifications and the badge in a later step.

## Privacy

SajdaTime makes no network requests. It has no analytics, no accounts and no remote code. Your place, method and other settings live in `chrome.storage.local` on this computer. When you choose **Use my location**, the browser supplies the coordinates and SajdaTime stores them locally. It does not send them anywhere.

Read the full [privacy policy](docs/privacy.html). The hosted copy is [aliimrankhan86.github.io/sajdatime-extension/privacy.html](https://aliimrankhan86.github.io/sajdatime-extension/privacy.html).

## The rules this build follows

- Manifest V3, TypeScript strict, Preact, adhan-js pinned to 4.4.6.
- Permissions only: `storage`, `geolocation`. Alarm, notification and offscreen permissions arrive with the first working alert. No host permissions, no content scripts, no `tabs`, no remote code.
- No Qibla. No network. No tracking.
- The religious disclaimer is never softened or hidden. It arrives with the settings screen.
- Quiet Glass: solid green pill buttons, white bold text, tabular numbers, nothing below 14 pixels.
- UK English, plain words, no en or em dashes.

## Documents

- [Plan](docs/PLAN.md)
- [Decisions](docs/DECISIONS.md)
- [Handover](docs/HANDOVER.md)
- [Privacy policy](docs/privacy.html), also hosted at [aliimrankhan86.github.io/sajdatime-extension/privacy.html](https://aliimrankhan86.github.io/sajdatime-extension/privacy.html)
- [Store listing draft](docs/store/listing.md)
- [Publishing steps for the owner](docs/store/PUBLISHING.md)
