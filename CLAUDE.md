# Instructions for any AI working on SajdaTime for Chrome and Edge

Read this file, then [README.md](README.md), [docs/PLAN.md](docs/PLAN.md), [docs/DECISIONS.md](docs/DECISIONS.md) and [docs/HANDOVER.md](docs/HANDOVER.md) before changing anything.

## What this is

A Manifest V3 browser extension for Chrome and Edge. Prayer times in a popup, worked out on the computer with adhan-js. It is a **separate product** from the SajdaTime Android app. Do not mix the two repositories, branches, release notes or store listings. The phone repository is read only for reference. Never change it from here.

## The owner

Ali Imran Khan. Not technical. Explain in plain words. He presses Submit, Publish, Merge and any payment or consent button. Never handle his passwords, keys, tokens or store credentials.

## Non-negotiables

- **No network requests from the extension.** No Aladhan calls, no fonts, no analytics, no remote code. Times are calculated locally.
- **Permissions stay exactly:** `alarms`, `notifications`, `storage`, `offscreen`, `geolocation`. No host permissions, no content scripts, no `tabs`. Adding one needs Ali's agreement and a store review note.
- **No Qibla.** Not in this product.
- **No tracking and no ads.** Never add an analytics library or an event.
- **Location stays local.** Never write that location "never leaves the device", because the browser's own location service may use the network. Say what SajdaTime does: it stores the coordinates on this computer and does not send them anywhere.
- **The religious disclaimer is never removed, softened or hidden.** When it is added, keep all four substance points and the final dua request. Follow the mosque where the two differ.
- **Quiet Glass only.** Colours come from `tokens.css`. Solid green pill buttons with bold white text. No two icon buttons side by side. Every dismissable dialog has a close X. No greyed placeholder buttons. Times use tabular numbers. Nothing below 14 pixels.
- **UK English, plain short words.** No en or em dashes. No semicolons in user-facing copy. No AI clichés.
- **Never call work done unless it was run.** Paste the commands and the real result. Say what was not tested.

## Branches and commits

- `main` is the public, working branch. Do not force push, reset or clean it without Ali's explicit approval.
- For anything larger than a small fix, work on a short branch and open a pull request. Do not merge without Ali.
- Write the commit message for the reason, not the file list: what was wrong, why this change, what was verified, what was rejected.
- Keep `docs/HANDOVER.md` current. A decision changes: add it to `docs/DECISIONS.md` in the same commit.
- Never commit `dist/`, `node_modules/`, a profile, a token, a store key or a screenshot with personal data.

## Checks before saying a change is ready

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The end-to-end test needs Chrome for Testing. If it cannot run, say so. A typecheck alone is not a test of the popup.

## The current step

Read the first section of [docs/HANDOVER.md](docs/HANDOVER.md). Do not invent work from the plan's later milestones. If the handover says there is nothing ready, ask Ali what he wants next.
