# Publishing steps for Ali

**Status:** prepared 28 October 2026 for version 1.0.0. Nothing has been uploaded. You press the
buttons, and this file tells you what to type and what to click. If a screen asks something not
written here, stop and send me a screenshot rather than guessing.

I do not handle your Google account, your Microsoft account, your password, your two step codes or
the card payment. I prepare the zip, the words and the answers, and sit beside you screen by screen.

## One time setup, Chrome

1. Open <https://chrome.google.com/webstore/devconsole> in a browser where you are signed in to the
   same Google account you use for SajdaTime.
2. Accept the developer agreement. Pay the one time registration fee. It was 5 US dollars when the
   plan was written, and it is not refundable.
3. Turn on two step verification for that Google account if it is not already on. The store asks.
4. Fill in the developer name and the contact email. The email cannot be changed later without
   asking Google support, so use one you keep.
5. Answer the trader question honestly. SajdaTime is free, with no revenue and no business behind it.
6. Wait for the identity and email checks to clear. This can take a day or more.

## One time setup, Edge

Do this when the Chrome build is close to submission. Edge does not need to be first.

1. Open <https://partner.microsoft.com/dashboard/microsoftedge>.
2. Sign in with a personal Microsoft account. A work or school account causes trouble later.
3. Register as an Edge developer and complete the account checks.

## Build the upload

From the extension folder:

```bash
npm run release-check
npm run package
```

`npm run release-check` runs the type check, the unit tests, the build, the bundle scan, the whole
browser suite, the language file check, the listing length check and the manifest permission check.
It prints one line per check and stops at the first failure. Do not upload anything unless the last
line says every check passed.

`npm run package` writes `artifacts/sajdatime-1.0.0.zip` from the `dist` folder. The version comes
from `package.json` and must match `src/manifest.json`.

Before uploading, look inside the zip. It must contain:

- `manifest.json`
- `background/index.js`
- `popup/index.html`
- `print/index.html`
- `assets/` with the JavaScript and CSS for the popup and the printable page
- `_locales/en/messages.json` and the same file under `ar`, `tr` and `id`
- `audio/` with the beep and the two adhan recordings
- `data/` with the city list
- `icons/` with 16, 32, 48 and 128 PNG files
- `THIRD-PARTY-NOTICES.txt`

It must not contain `node_modules`, tests, source maps, `.DS_Store`, a Playwright profile, a `.git`
folder or the 300 pixel icon. `tests/e2e/package.test.ts` checks all of this on every run by opening
the zip in a fresh browser profile, so a bad package fails the suite rather than the store.

## Chrome submission, screen by screen

I will ask you to open one page and send a screenshot. Then I will tell you what to click on that
page. We repeat. Do not work from a numbered list for the whole flow, because screens change and the
list goes stale.

The order is normally:

1. **Developer Dashboard.** Press **New item**. Upload the zip.
2. **Store listing.** Paste the name, summary and description from `docs/store/listing.md`. Choose
   the category (Religious category if offered, otherwise Productivity). Add the five screenshots
   from `docs/store/images/` and the promo tile. Set English first, then Arabic, Turkish,
   Indonesian and Bengali. Do not add Urdu: Chrome does not offer it.
3. **Privacy practices.** Answer from the same file: tick **Location** and nothing else, tick the
   three certifications, say the data stays on the user's computer and the developer never receives
   it, and paste the privacy policy URL.
4. **Permissions.** Paste the five reasons from the same file. The install warning should say it can
   read your location and show notifications. If it mentions reading data on websites, stop: the
   manifest is wrong.
5. **Distribution.** Public, all regions. Do not choose trusted testers unless you want a private
   test first. A private test delays the public listing.
6. **Review and submit.** Read the summary. Press **Submit for review** yourself. I will not press
   it.

Chrome usually answers in a few days, and a new developer account can take longer. The result arrives
by email. There is no need to refresh the dashboard every hour.

## The privacy answers, in one place

This is `docs/SECURITY.md` R10 and PLAN.md section 12. Chrome's form counts data that stays on the
computer as handled, so the answer is **Location ticked, everything else not collected**.

- Location: used to calculate prayer times for the user's place. Stored in `chrome.storage.local` on
  this computer. Not sent to the developer or anyone else. Not sold. Not used for advertising.
- Personally identifiable information, health, financial, authentication, personal communications,
  web history, user activity, website content: not collected.
- Remote code: no. Every file that runs is in the zip.
- Sell or transfer to third parties: no.
- Use or transfer for anything outside the single purpose: no.
- Use to decide creditworthiness or for lending: no.
- Privacy policy: `https://aliimrankhan86.github.io/sajdatime-extension/privacy.html`

The privacy page must be live before you submit. It is served from the `docs` folder of `main`. If
that link opens a 404 in a private window, turn on GitHub Pages first and tell me.

## After Chrome is live

1. Open the public listing signed out of every Google account.
2. Install it in a clean Chrome profile. Check the popup, the shortcut and the privacy link.
3. Send me the listing address. I will replace the store search placeholders in the extension and the
   README with the real link in a commit, and update `docs/privacy.html`.
4. Start the Edge submission with the same zip, listing text and screenshots. Edge allows 250 to
   10,000 characters in the description, and ours is under 4,000.
5. Do not say "available on Edge" until the Edge listing is live.

## What can be rejected, and the honest fix

| Reason | Fix |
| --- | --- |
| Permission has no matching feature | Enable the feature or remove the permission. Do not write a longer justification for a feature that does not exist. |
| Privacy answer says no data, but location is used | Declare location. Match the privacy page. |
| Description promises something not in the build | Remove the promise, or ship the feature and update the listing. |
| Screenshot shows an older build | Retake it with `npm run store-images` from this commit. |
| Remote code | There is none. Point at the packaged files. Do not add a CDN later. |
| Missing or broken privacy policy | Turn on GitHub Pages and open the URL in a private window. |

## What I will never do

- Ask for your password, two step code, recovery code or card number.
- Sign in to your store account.
- Press Submit, Publish, Pay or Accept on your behalf.
- Upload a build I have not checked.
- Promise a review outcome or a date.
