# Security and privacy rules

**Written:** 27 October 2026, by Claude (Opus), at Ali's request: "ensure the security is of top quality and safe from hackers or information leakage".
**Applies to:** every change to this extension, by any person or model. Each rule says what to do and how it is checked. A rule with no check is a wish, so every rule here has one.

## What we are protecting

SajdaTime holds very little, and that is the main defence. Keep it that way.

| What | Where | Why it matters |
| --- | --- | --- |
| The user's place: town name and coordinates rounded to 2 decimals (about 1 km) | `chrome.storage.local`, this computer only | Location is personal. It must never leave the computer through SajdaTime. |
| School (Sunni or Shia), method, Asr school, Hijri shift, alert choices | `chrome.storage.local` | Religious belief is special category data. It must never leave the computer. |

There is no account, no server, no password, no payment and no message content. **Do not add any.**

What an attacker could try, and the rule that stops it:

| Threat | Rule |
| --- | --- |
| A web page reads or changes SajdaTime's data | R1, R4 |
| Code loaded from the internet runs inside the extension | R2, R3 |
| Location or school is sent somewhere | R5, R6 |
| A place name or stored value is turned into running code or HTML | R7 |
| A poisoned npm package ships inside the build | R9 |
| Stored settings are tampered with to crash or mislead the popup | R8 |
| A secret is committed | R10 |

---

## R1. Permissions: the smallest possible set

- `src/manifest.json` may ask only for: `storage`, `geolocation`, and (from Step 2 of `BUILD-NEXT.md`) `alarms`, `notifications`, `offscreen`. **Nothing else.**
- Never add: `host_permissions`, `content_scripts`, `tabs`, `scripting`, `webRequest`, `cookies`, `history`, `downloads`, `<all_urls>`, `externally_connectable`, `key`, `update_url`, `optional_permissions`.
- `web_accessible_resources` stays absent. No web page may load any file from the extension.
- **Check:** a unit test `tests/unit/manifest.test.ts` reads `src/manifest.json` and asserts the exact set of top-level keys and the exact `permissions` list. Any addition fails the build until the test is changed on purpose, with a decision in `DECISIONS.md`.

## R2. Content Security Policy

- Add an explicit policy to the manifest, stricter than Chrome's default:
  ```json
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none'; base-uri 'none'"
  }
  ```
- Never add `'unsafe-eval'`, `'unsafe-inline'`, `'wasm-unsafe-eval'`, a hash, a nonce or any remote origin to it.
- **Check:** the manifest test asserts this exact string. The e2e suite already loads every page, so any inline script would fail to run and be caught.

## R3. No remote code, no dynamic code

- Every script, style, font, image and sound ships inside the extension. Nothing is loaded from a URL.
- Never use `eval`, `new Function`, `setTimeout` or `setInterval` with a string, `import()` of anything but a bundled path, `document.write`, or `chrome.scripting`.
- No CDN, no Google Fonts, no remote analytics or error reporting script.
- **Check:** a unit test `tests/unit/bundle.test.ts` runs after `npm run build` (add it to `npm run check` after the build) and scans every `.js` and `.html` file in `dist/` for `eval(`, `new Function`, `document.write`, `importScripts(`, and for `http://` or `https://` outside the allowlist in R6. Any hit fails.

## R4. Messages between the extension's parts

- Only `chrome.runtime.onMessage` is used. **Never** register `chrome.runtime.onMessageExternal` or `onConnectExternal`.
- Every message handler:
  1. ignores the message unless `sender.id === chrome.runtime.id`;
  2. ignores it unless `sender.url` starts with `chrome.runtime.getURL('')`;
  3. accepts only a fixed list of message types (for example `play-beep`, `play-adhan-sunni`, `play-adhan-shia`, `stop`, `test-alert`), checked with a `switch` that has a `default` doing nothing;
  4. never uses a field of the message as a URL, file path, alarm name prefix or HTML. A sound is chosen from the fixed list, never by a file name sent in the message.
- **Check:** a unit test calls each handler with a wrong `sender.id`, a wrong `sender.url`, an unknown type and a type with extra fields, and asserts nothing happens. The bundle test asserts `onMessageExternal` does not appear in `dist/`.

## R5. Location is used and kept with care

- Ask the browser for a position **only** when the user presses "Use my location". Never on install, never in the background, never on a timer.
- Use `enableHighAccuracy: false`, a 15 second `timeout`, and `maximumAge` of at most 10 minutes.
- Round latitude and longitude to 2 decimals **before** anything else touches them: before storage, before naming the place, before computing times. Never keep the raw values in a variable that outlives the handler.
- Never log coordinates, the place name, the school or the method with `console.*`. No `console.log` in shipped code at all; `console.error` only for a fixed message with no user data.
- Never put location or settings in a URL, a notification button, an alarm name, a file name or a page title.
- **Check:** a unit test asserts the rounding happens in `placeFromBrowser`. The bundle test fails on `console.log` in `dist/`. Review reads every new `console.*` call.

## R6. No network, with a short list of user-pressed links

- The extension makes **no network request** of its own: no `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon` or remote `<img>`, `<audio>` or `<link>`. The only `fetch` allowed is of `chrome.runtime.getURL(...)`, which reads a file inside the extension.
- Links the user presses may point only to:
  - `https://aliimrankhan86.github.io/sajdatime-extension/` (privacy page and, later, the help page)
  - `https://www.geonames.org/`
  - `https://creativecommons.org/licenses/by-sa/4.0/`
  - `https://github.com/aliimrankhan86/sajdatime-extension`
- Every link opening a new tab has `target="_blank"` **and** `rel="noopener noreferrer"`. (Today's About links have only `noreferrer`; add `noopener` as part of the first step that touches Settings.)
- **Check:** the existing e2e test that watches requests on the Times screen is extended to listen on the popup, Settings, the Location sheet, the service worker and the offscreen page (`context.on('request')`), through a full alert and a full "Use my location", and asserts every request URL starts with `chrome-extension://`. The bundle test enforces the link allowlist.

## R7. Text is text, never HTML

- Every user-visible value (place name, country, prayer name, time, Hijri date, notification text) is rendered by Preact as text. Never use `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `DOMParser` on anything.
- Notification titles and messages are plain strings built from fixed words and the stored place name. Cut the place name to 60 characters before using it in a notification.
- The city list is bundled data, but treat it as untrusted text anyway: never build a URL, selector or HTML from it.
- **Check:** the bundle test fails on `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `dangerouslySetInnerHTML` in `src/` (scan the source, because the bundled Preact itself may contain the words). A unit test saves a place named `<img src=x onerror=alert(1)>` and an e2e test asserts it shows as those literal characters and no `img` element appears.

## R8. Stored data is checked before it is trusted

- Everything read from `chrome.storage.local` goes through a validator (`isSettings` and its siblings) before use. A missing, damaged or out-of-range value falls back to safe defaults or to the first run, never to a crash or a half-drawn screen.
- Validators check types **and** ranges: latitude -90 to 90, longitude -180 to 180, Hijri shift -2 to 2, adjustments -30 to 30, method and sound from their fixed lists, place name a string of at most 200 characters.
- Only these keys are written: `sajdatime.settings.v1`, `sajdatime.setup.v1` (the first-run draft, removed the moment setup finishes) and the notice keys named in `BUILD-NEXT.md`. Nothing is written to `storage.sync`, `localStorage`, `sessionStorage`, IndexedDB or cookies.
- **Check:** unit tests feed each validator a wrong type, an out-of-range number, an over-long string and extra keys, and assert rejection. The bundle test fails on `storage.sync`, `localStorage`, `sessionStorage` and `indexedDB` in `dist/`.

## R9. Dependencies and the build

- **No new runtime dependency** without Ali's agreement and a `DECISIONS.md` entry. Today's runtime dependencies are `adhan` and `preact` only. A few lines of our own code beat a package.
- New dev dependencies only when a test needs one, pinned to an exact version (no `^` or `~`), and never one with an `install` or `postinstall` script.
- Always install with `npm ci`, never `npm install` in a check. `package-lock.json` is committed and changes only on purpose.
- `npm audit --omit=dev` must report **0 vulnerabilities** before every commit; paste its last line in the report. A high or critical finding in a dev dependency is reported, not ignored.
- `dist/` has no source maps (`sourcemap: false` stays) and is never committed.
- Bundled files from outside the project (the city list, the adhan recordings) keep their source, licence and SHA-256 in `DECISIONS.md`, and are copied unchanged.
- **Check:** the report pastes `npm audit --omit=dev`. Review compares `package.json` and `package-lock.json` diffs line by line.

## R10. No secrets, no personal data in the repository

- The repository never holds a key, token, password, signing file, `.pem`, `.crx` key or `.env` file. The extension needs none.
- No real user's location, screenshot with a real home, or email address other than the public contact goes into tests, fixtures or docs. Test places are public cities.
- **Check:** before each commit, run `git diff --cached` and search it for `key`, `token`, `secret`, `password`, `BEGIN`, `.pem` and an email pattern; report "secret scan clean". `.gitignore` covers `.env*`, `*.pem`, `*.crx` and `dist/`.

## R11. Notifications and sound

- `iconUrl` is a file inside the extension. Notification buttons do only the fixed actions written in `BUILD-NEXT.md`.
- The offscreen page plays only the bundled files `audio/adhan.ogg`, `audio/adhan_shia.ogg` or the beep made in code, chosen from a fixed map. It never plays a URL or a path sent in a message.
- Every alarm name is built from fixed words, an ISO date and a prayer slot. Parse names back with a strict pattern and ignore anything that does not match.
- **Check:** unit tests on the alarm name parser with malformed names.

## R12. Privacy promises stay true

- `docs/privacy.html` and every user-visible sentence about data must be true of the code in the same commit. Never write that location "never leaves the device": the browser's own location service may use the network. The approved wording is in `PLAN.md` §9.
- Any change that stores something new, asks for a new permission or opens a new link updates `docs/privacy.html` in the same commit.
- **Check:** review reads the privacy page against the diff.

---

## Every step's report must include this checklist

Copy it into the report and mark each line PASS or FAIL, with the command or test that proves it:

```
Security checklist
[ ] R1 manifest test passes; permissions are exactly: ...
[ ] R2 CSP unchanged and asserted
[ ] R3 bundle scan: no eval, new Function, document.write, remote URL
[ ] R4 message handlers check sender id, sender url and type
[ ] R5 location asked only on press; rounded first; no console.log in dist
[ ] R6 e2e: zero requests outside chrome-extension:// (popup, worker, offscreen)
[ ] R7 no innerHTML family in src; hostile place name renders as text
[ ] R8 validators reject wrong type, range, length and extra keys
[ ] R9 npm audit --omit=dev: <paste last line>; no new runtime dependency
[ ] R10 secret scan of the staged diff clean
[ ] R11 offscreen plays only the fixed map; alarm names parsed strictly
[ ] R12 privacy page true of this commit
```

A FAIL means the step is not finished. Do not commit around it.

## Order of work

1. **The next step from `BUILD-NEXT.md` you start** also adds the R1 manifest test, the R2 CSP, the R3 bundle test (with the R6 link allowlist, R7 source scan and R8 storage scan), the `noopener` fix, and the `.gitignore` lines from R10. These are small and protect every later step.
2. The R4 and R11 handler tests arrive with Step 2, which adds the messages and alarms they protect.
3. The R6 wide network test arrives with Step 2, when the worker and the offscreen page start doing work.
