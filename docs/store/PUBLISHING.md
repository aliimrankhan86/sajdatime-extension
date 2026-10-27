# Publishing steps for Ali

**Status:** draft. Do not start until the build passes every check and the screenshots exist. Nothing in this file is a promise that the extension is ready.

You press the buttons. I do not handle your Google account, your Microsoft account, your password, your two step codes or the card payment. I can prepare the zip, write the listing and sit beside you while you go screen by screen.

## One time setup, Chrome

1. Open <https://chrome.google.com/webstore/devconsole> in a browser where you are signed in to the same Google account you use for SajdaTime.
2. Accept the developer agreement. Pay the one time registration fee. It was 5 US dollars when the plan was written. The fee is not refundable.
3. Turn on two step verification for that Google account if it is not already on. The store will ask.
4. Fill in the developer name and the contact email. The email cannot be changed later without asking Google support, so use one you will keep.
5. Confirm the trader question honestly. SajdaTime is free, with no revenue and no business entity behind it. Answer as the form asks and do not describe it as a business.
6. Wait for the identity and email checks to clear. This can take a day or more.

## One time setup, Edge

Do this later, when the Chrome build is close to submission. Edge does not need to be first.

1. Open <https://partner.microsoft.com/dashboard/microsoftedge>.
2. Sign in with a personal Microsoft account. A work account can cause problems later.
3. Register as an Edge developer and complete the account checks.

## Build the upload

From the extension folder:

```bash
npm run check
npm run test:e2e
npm run package
```

`npm run package` writes `artifacts/sajdatime-0.1.0.zip` from the `dist` folder. The version comes from `package.json` and must match `src/manifest.json`.

Before uploading, look inside the zip. It must contain:

- `manifest.json`
- `background/index.js`
- `popup/index.html`
- `assets/` with the popup JavaScript and CSS
- `_locales/en/messages.json`
- `icons/` with 16, 32, 48 and 128 PNG files

It must not contain `node_modules`, tests, source maps, `.DS_Store`, a Playwright profile or a `.git` folder. If it does, stop and fix the package script. Do not upload a zip you have not looked inside.

## Chrome submission, screen by screen

I will ask you to open one page and send a screenshot. Then I will tell you what to click on that page. We repeat. Do not work from a numbered list for the whole flow, because screens change and the list goes stale.

The order is normally:

1. **Developer Dashboard.** Press **New item**. Upload the zip.
2. **Store listing.** Paste the name, summary and description from `docs/store/listing.md`. Choose the category. Add the five screenshots and the promo tile. Choose the listing language.
3. **Privacy.** Open the privacy practices tab. Answer each question from the same file. Paste the privacy policy URL. Save.
4. **Permissions.** Add the reason for each permission from the same file. Review the install warning. It should mention only storage, location, notifications and alarms. If it mentions reading data on websites, stop. The manifest is wrong.
5. **Distribution.** Choose public, all regions. Do not choose trusted testers unless you want a private test first. A private test delays the public listing.
6. **Review and submit.** Read the summary. Press **Submit for review** yourself. I will not press it.

Chrome usually answers in a few days. A new developer account can take longer. The listing shows a status. The result arrives by email. There is no need to refresh the dashboard every hour.

## After Chrome is live

1. Open the public listing signed out of every Google account.
2. Install it in a clean Chrome profile. Check the popup, the shortcut and the privacy link.
3. Update the store links in the extension and the README from search placeholders to the real listing.
4. Start the Edge submission with the same zip, listing text and screenshots. Edge allows 250 to 10,000 characters in the description. Our draft is inside that range.
5. Do not say "available on Edge" until the Edge listing is live.

## What can be rejected, and the honest fix

| Reason | Fix |
| --- | --- |
| Permission has no matching feature | Enable the feature or remove the permission. Do not write a longer justification for a feature that does not exist. |
| Privacy answer says no data, but location is used | Declare location. Match the privacy page. |
| Description promises alerts or Ramadan | Remove the promise until those screens exist. |
| Screenshot shows a feature that is not in the build | Retake the screenshot from the current build. |
| Remote code | There is none. Point to the packaged files. Do not add a CDN later. |
| Missing privacy policy | Turn on GitHub Pages and check the URL in a private window. |

## What I will never do

- Ask for your password, two step code, recovery code or card number.
- Sign in to your store account.
- Press Submit, Publish, Pay or Accept on your behalf.
- Upload a build I have not checked.
- Promise a review outcome or a date.
