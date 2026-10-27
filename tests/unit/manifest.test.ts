import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * docs/SECURITY.md R1 and R2. The manifest is the only place this extension can widen
 * what it can reach, so every key and every permission is asserted here: an addition has
 * to be made on purpose, with a decision in DECISIONS.md, and not as part of another diff.
 */
const manifest = JSON.parse(
  readFileSync(new URL('../../src/manifest.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

const ALLOWED_KEYS = [
  'action',
  'author',
  'background',
  'commands',
  'content_security_policy',
  'default_locale',
  'description',
  'homepage_url',
  'icons',
  'manifest_version',
  'minimum_chrome_version',
  'name',
  'permissions',
  'short_name',
  'version',
];

/** Keys that would let a web page reach the extension or the extension reach a page. */
const FORBIDDEN_KEYS = [
  'content_scripts',
  'externally_connectable',
  'host_permissions',
  'key',
  'optional_permissions',
  'update_url',
  'web_accessible_resources',
];

describe('manifest', () => {
  it('asks only for storage and geolocation', () => {
    expect(manifest.permissions).toEqual(['storage', 'geolocation']);
  });

  it('has no top level key that was not agreed', () => {
    expect(Object.keys(manifest).sort()).toEqual(ALLOWED_KEYS);
  });

  it('cannot be reached from, or reach, a web page', () => {
    for (const key of FORBIDDEN_KEYS) expect(manifest).not.toHaveProperty(key);
  });

  it('sets the strict content security policy', () => {
    expect(manifest.content_security_policy).toEqual({
      extension_pages: "script-src 'self'; object-src 'none'; base-uri 'none'",
    });
  });

  it('keeps the service worker module and the popup inside the extension', () => {
    expect(manifest.action).toMatchObject({ default_popup: 'popup/index.html' });
    expect(manifest.background).toEqual({ service_worker: 'background/index.js', type: 'module' });
  });
});
