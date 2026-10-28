#!/usr/bin/env node
// docs/SECURITY.md R3, R4, R5, R6, R7 and R8, checked against the built extension.
// Run after `npm run build`; `npm run check` does that. A hit here fails the build, so a
// remote URL, an eval, a console.log, a storage API or a link outside the allowlist cannot
// reach a release without this file being changed on purpose.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/**
 * Links the user may press (R6). The three www.w3.org entries are XML namespace names that
 * Preact writes into elements it creates; they are identifiers, never requests.
 */
const ALLOWED_PREFIXES = [
  'https://aliimrankhan86.github.io/sajdatime-extension/',
  'https://www.geonames.org/',
  'https://creativecommons.org/licenses/by-sa/4.0/',
  'https://github.com/aliimrankhan86/sajdatime-extension',
  'http://www.w3.org/1999/xhtml',
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1998/Math/MathML',
];

const BUNDLE_PATTERNS = [
  ['R3', /\beval\s*\(/, 'eval'],
  ['R3', /\bnew\s+Function\b/, 'new Function'],
  ['R3', /\bdocument\s*\.\s*write\b/, 'document.write'],
  ['R3', /\bimportScripts\s*\(/, 'importScripts'],
  ['R4', /\bon(?:Message|Connect)External\b/, 'external messaging'],
  ['R5', /\bconsole\s*\.\s*log\b/, 'console.log'],
  ['R8', /\bstorage\s*\.\s*sync\b/, 'storage.sync'],
  ['R8', /\blocalStorage\b/, 'localStorage'],
  ['R8', /\bsessionStorage\b/, 'sessionStorage'],
  ['R8', /\bindexedDB\b/, 'indexedDB'],
];

const SOURCE_PATTERNS = [
  ['R7', /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|\bdangerouslySetInnerHTML\b/, 'HTML insertion'],
  ['R7', /\bDOMParser\b/, 'DOMParser'],
  ['R4', /\bon(?:Message|Connect)External\b/, 'external messaging'],
];

/**
 * UX-PLAN section 5.2. One token file owns every colour, and no stylesheet or component
 * may set uppercase or !important. tokens.css is the only file allowed to name a colour.
 */
const STYLE_PATTERNS = [
  ['U1', /#[0-9a-fA-F]{3,8}\b/, 'a literal colour outside tokens.css'],
  ['U3', /text-transform\s*:/, 'text-transform'],
  ['U3', /!important/, '!important'],
];

const TOKEN_FILE = 'src/popup/tokens.css';

function filesUnder(directory, extensions) {
  const found = [];
  for (const entry of readdirSync(join(ROOT, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path, extensions));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) found.push(path);
  }
  return found;
}

const problems = [];
const report = (rule, file, detail) => problems.push(`${rule}  ${file}  ${detail}`);

const bundle = filesUnder('dist', ['.js', '.html']);
if (bundle.length === 0) {
  console.error('check-bundle: dist/ has no .js or .html files, run npm run build first');
  process.exit(1);
}

for (const file of bundle) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  for (const [rule, pattern, name] of BUNDLE_PATTERNS) {
    if (pattern.test(text)) report(rule, file, `contains ${name}`);
  }
  for (const [url] of text.matchAll(/https?:\/\/[^\s"'`)<>\\)]+/g)) {
    if (!ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      report('R6', file, `URL outside the allowlist: ${url}`);
    }
  }
}

for (const file of filesUnder('src', ['.ts', '.tsx'])) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  for (const [rule, pattern, name] of SOURCE_PATTERNS) {
    if (pattern.test(text)) report(rule, relative('.', join(ROOT, file)), `contains ${name}`);
  }
}

for (const file of filesUnder('src', ['.css', '.ts', '.tsx'])) {
  if (file === TOKEN_FILE) continue;
  const text = readFileSync(join(ROOT, file), 'utf8');
  for (const [rule, pattern, name] of STYLE_PATTERNS) {
    if (pattern.test(text)) report(rule, relative('.', join(ROOT, file)), `contains ${name}`);
  }
}

if (problems.length > 0) {
  console.error('check-bundle: docs/SECURITY.md violations');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`check-bundle: ${bundle.length} bundle files and the source are clean`);
