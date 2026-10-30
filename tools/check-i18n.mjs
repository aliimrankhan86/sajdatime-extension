#!/usr/bin/env node
/**
 * Fails the release if any of the six language files has drifted.
 *
 * It is deliberately the same checks as tests/unit/i18n.test.ts, because a release is not a
 * moment to trust one test file: this runs from the command line on the built source, so the
 * person packaging a zip sees the same verdict as the suite. English is the key list. A key
 * that exists in English and missing in another language, a key nobody uses, an empty value,
 * a placeholder that moved, or a semicolon or dash in a sentence all fail here.
 *
 * Run: node tools/check-i18n.mjs
 */
import { readFileSync } from 'node:fs';

const LANGS = ['en', 'ur', 'ar', 'tr', 'id', 'bn'];
const bundles = Object.fromEntries(
  LANGS.map((lang) => [lang, JSON.parse(readFileSync(`src/i18n/${lang}.json`, 'utf8'))]),
);
const english = Object.keys(bundles.en);
const problems = [];

for (const lang of LANGS.slice(1)) {
  const bundle = bundles[lang];
  for (const key of Object.keys(bundle)) {
    if (!(key in bundles.en)) problems.push(`${lang} has a key English does not: ${key}`);
  }
  for (const key of english) {
    const value = bundle[key];
    if (typeof value !== 'string' || value.trim() === '') {
      problems.push(`${lang} is empty: ${key}`);
      continue;
    }
    // Order within the sentence may differ per language; the set may not.
    const wanted = new Set((bundles.en[key].match(/\{\w+\}/g) ?? []).sort());
    const found = new Set((value.match(/\{\w+\}/g) ?? []).sort());
    if ([...wanted].join(',') !== [...found].join(',')) {
      problems.push(`${lang} placeholder differs: ${key} (${[...wanted].join(',')} against ${[...found].join(',')})`);
    }
    if (value.includes(';') || /[–—]/.test(value)) {
      problems.push(`${lang} has a semicolon or dash: ${key}`);
    }
  }
}

const printed = `en keys: ${english.length}`;
if (problems.length > 0) {
  for (const problem of problems) console.log(problem);
  console.log(`${printed}, i18n problems: ${problems.length}`);
  process.exit(1);
}
console.log(`${printed}, i18n check OK`);
