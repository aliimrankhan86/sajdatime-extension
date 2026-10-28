#!/usr/bin/env node
/**
 * The one command to run before a zip goes to a store.
 *
 * It runs the same things by hand in the same order: the type check, the unit tests, the build,
 * the bundle scan, the whole browser suite, the language files, the listing lengths and the
 * manifest. Each step prints one line here, so the last thing on screen is a verdict rather than
 * a wall of test output. A failure stops the run and says which check failed.
 *
 * The manifest check is deliberately written out instead of importing the test: this script is
 * the gate, and a gate that shares its expectation with the code it checks can drift with it.
 *
 * Run: node tools/release-check.mjs   (or npm run release-check)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REQUIRED_PERMISSIONS = ['alarms', 'geolocation', 'notifications', 'offscreen', 'storage'];
const results = [];

function step(name, run) {
  process.stdout.write(`\n[release-check] ${name}\n`);
  try {
    run();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
    report();
    process.exit(1);
  }
}

function npm(args) {
  execFileSync('npm', args, { stdio: 'inherit' });
}

function report() {
  const width = Math.max(...results.map((result) => result.name.length));
  process.stdout.write('\n[release-check] summary\n');
  for (const result of results) {
    process.stdout.write(`  ${result.ok ? 'pass' : 'FAIL'}  ${result.name.padEnd(width)}\n`);
    if (!result.ok && result.detail) process.stdout.write(`        ${result.detail}\n`);
  }
  process.stdout.write('\n');
}

step('check: typecheck, unit tests, build, bundle scan', () => npm(['run', 'check']));
step('browser suite: npm run test:e2e', () => npm(['run', 'test:e2e']));
step('language files: five languages, same keys', () =>
  execFileSync('node', ['tools/check-i18n.mjs'], { stdio: 'inherit' }),
);
step('listing limits: summary and description fit both stores', () =>
  execFileSync('npx', ['vitest', 'run', 'tests/unit/listing.test.ts'], { stdio: 'inherit' }),
);
step('manifest: version and the five permissions, nothing else', () => {
  const manifest = JSON.parse(readFileSync('src/manifest.json', 'utf8'));
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const problems = [];

  if (manifest.version !== packageJson.version) {
    problems.push(`manifest version ${manifest.version} is not package version ${packageJson.version}`);
  }
  const permissions = [...(manifest.permissions ?? [])].sort();
  if (JSON.stringify(permissions) !== JSON.stringify(REQUIRED_PERMISSIONS)) {
    problems.push(`permissions are ${permissions.join(', ')}, not ${REQUIRED_PERMISSIONS.join(', ')}`);
  }
  if (manifest.host_permissions?.length) problems.push('host permissions are present');
  if (manifest.content_scripts?.length) problems.push('content scripts are present');
  if (manifest.optional_permissions?.length) problems.push('optional permissions are present');
  if (manifest.default_locale !== 'en') problems.push('default_locale is not en');
  if (manifest.minimum_chrome_version !== '127') problems.push('minimum_chrome_version is not 127');
  if (manifest.content_security_policy?.extension_pages !== "script-src 'self'; object-src 'none'; base-uri 'none'") {
    problems.push('the extension page security policy has changed');
  }

  if (problems.length > 0) throw new Error(problems.join('; '));
  process.stdout.write(
    `version ${manifest.version}, permissions ${permissions.join(', ')}, no host permissions, ` +
      `no content scripts, policy unchanged\n`,
  );
});

report();
process.stdout.write('[release-check] every check passed. The zip for both stores is safe to package.\n');
