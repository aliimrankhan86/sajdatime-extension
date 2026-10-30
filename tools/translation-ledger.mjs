#!/usr/bin/env node
/**
 * Remembers which translations were already reviewed, so a session reviews only what changed.
 *
 * Ali, 30 Oct 2026: "have a mechanism not to retest the translation which you have already done".
 * A unit is one key in a language file other than English: `src/i18n/<lang>.json` (the popup and
 * the printable page) or `public/_locales/<lang>/messages.json` (the store name and summary).
 * Each is hashed together with its English, so a changed English sentence counts as changed too.
 * Review what `check` lists, then run `stamp` in the same commit. `stamp` records everything, so
 * run it only when the list holds nothing the review did not pass. The mechanical checks still
 * run every time: tests/unit/i18n.test.ts in the unit suite, and tools/check-i18n.mjs at release.
 *
 * Run from the repository root: node tools/translation-ledger.mjs   (exit 1 if anything is new or changed)
 *      node tools/translation-ledger.mjs stamp
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const LEDGER = 'docs/translation-reviewed.json';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const hash = (...parts) => createHash('sha256').update(parts.join('\0')).digest('hex').slice(0, 16);

function units() {
  const out = {};
  const add = (prefix, english, bundle) => {
    for (const [key, value] of Object.entries(bundle)) {
      out[`${prefix}:${key}`] = hash(JSON.stringify(english[key] ?? ''), JSON.stringify(value));
    }
  };
  const en = read('src/i18n/en.json');
  for (const file of readdirSync('src/i18n').filter((f) => f.endsWith('.json') && f !== 'en.json').sort()) {
    add(`i18n/${file}`, en, read(`src/i18n/${file}`));
  }
  const storeEn = read('public/_locales/en/messages.json');
  for (const lang of readdirSync('public/_locales').filter((l) => l !== 'en' && !l.startsWith('.')).sort()) {
    add(`_locales/${lang}`, storeEn, read(`public/_locales/${lang}/messages.json`));
  }
  return out;
}

const now = units();
if (process.argv[2] === 'stamp') {
  const sorted = Object.fromEntries(Object.entries(now).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(LEDGER, `${JSON.stringify(sorted, null, 1)}\n`);
  console.log(`stamped ${Object.keys(now).length} units as reviewed`);
} else {
  const old = existsSync(LEDGER) ? read(LEDGER) : {};
  const todo = Object.keys(now).filter((k) => old[k] !== now[k]).sort();
  for (const k of todo) console.log(`${k in old ? 'CHANGED' : 'NEW    '} ${k}`);
  console.log(`${todo.length} to review, ${Object.keys(now).length - todo.length} already reviewed`);
  process.exitCode = todo.length ? 1 : 0;
}
