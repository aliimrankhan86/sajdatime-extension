import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The store listing is a file the two stores read as one long string, so its limits are easy to
 * break by adding a sentence and impossible to notice by reading it. This test parses the file
 * the way Ali will paste it: the summary blockquote, the fenced description, and the phrases the
 * plan says a listing must carry. A failure here means the paste would be rejected or would
 * promise something the build does not do.
 */

const listing = readFileSync('docs/store/listing.md', 'utf8');

function section(heading: string): string {
  const start = listing.indexOf(`## ${heading}`);
  expect(start, `missing section: ${heading}`).toBeGreaterThan(-1);
  const next = listing.indexOf('\n## ', start + 3);
  return listing.slice(start, next === -1 ? undefined : next);
}

/** The first blockquote in a section, with its quote marks and line breaks removed. */
function blockquote(from: string): string {
  const lines = from.split('\n');
  const first = lines.findIndex((line) => line.startsWith('> '));
  expect(first, 'no blockquote in this section').toBeGreaterThan(-1);
  const quoted: string[] = [];
  for (const line of lines.slice(first)) {
    if (!line.startsWith('> ')) break;
    quoted.push(line.slice(2));
  }
  return quoted.join(' ').replace(/\s+/g, ' ').trim();
}

/** The fenced text block in a section, which is exactly what gets pasted into the store. */
function fenced(from: string): string {
  const open = from.indexOf('```');
  expect(open, 'no fenced description').toBeGreaterThan(-1);
  const close = from.indexOf('```', open + 3);
  expect(close, 'the description fence is not closed').toBeGreaterThan(-1);
  return from.slice(open + 3, close).replace(/^\n/, '').replace(/\n$/, '');
}

const summary = blockquote(section('Short summary, Chrome Web Store'));
const description = fenced(section('Detailed description'));

describe('store listing lengths', () => {
  it('fits the Chrome summary limit of 132 characters', () => {
    expect(summary.length).toBeGreaterThanOrEqual(20);
    expect(summary.length).toBeLessThanOrEqual(132);
  });

  it('fits both descriptions, so one paste works in both stores', () => {
    // Chrome allows 16,000 and Edge allows 250 to 10,000.
    expect(description.length).toBeGreaterThanOrEqual(250);
    expect(description.length).toBeLessThanOrEqual(10_000);
  });

  it('keeps the single purpose statement short enough for the form', () => {
    const purpose = blockquote(section('Single purpose'));
    expect(purpose).toBe('Shows Islamic prayer times for the user\'s location and alerts at each prayer.');
    expect(purpose.length).toBeLessThanOrEqual(200);
  });
});

describe('store listing claims', () => {
  it('carries the phrase the phone app uses about authority', () => {
    expect(description).toContain('not supplied by any mosque, scholar or authority');
  });

  it('names every credit with its licence', () => {
    expect(description).toContain('adhan-js 4.4.6');
    expect(description).toContain('MIT licence');
    expect(description).toContain('GeoNames');
    expect(description).toContain('Creative Commons Attribution 4.0');
    expect(description).toContain('CC0');
    expect(description).toContain('CC BY-SA 4.0');
  });

  it('claims nothing about the network, which the build does without', () => {
    expect(description).toContain('no network requests');
    expect(description).toContain('offline');
  });

  it('names the listing languages and keeps Urdu honest', () => {
    const languages = section('Listing languages');
    for (const language of ['English', 'Arabic', 'Turkish', 'Indonesian', 'Bengali']) {
      expect(languages).toContain(language);
    }
    expect(languages).toContain('Urdu is added only if the store offers Urdu');
    expect(languages).toContain('Chrome does not');
  });

  it('keeps the five permission reasons from the plan', () => {
    const reasons = section('Permission reasons');
    for (const permission of ['alarms', 'notifications', 'storage', 'offscreen', 'geolocation']) {
      expect(reasons).toContain(`\`${permission}\``);
    }
    expect(reasons).toContain('To alert at prayer times and refresh the countdown.');
    expect(reasons).toContain('To show the prayer alert.');
    expect(reasons).toContain('To keep settings on this computer.');
    expect(reasons).toContain('To play the alert sound, which a service worker cannot do.');
    expect(reasons).toContain('only when the user asks');
  });

  it('tells Ali to tick Location and nothing else, and never to tick no data', () => {
    const dataUse = section('Data use answers, Chrome Web Store');
    expect(dataUse).toContain('**Location** is ticked');
    expect(dataUse).toContain('the developer\nnever receives it');
    expect(dataUse).toContain('chrome.storage.local');
    expect(dataUse).toContain('privacy.html');
  });

  it('uses the same plain copy rules as the extension', () => {
    for (const text of [summary, description]) {
      expect(text).not.toContain(';');
      expect(text).not.toMatch(/[–—]/);
      expect(text).not.toMatch(/\b(tracking|premium|missing)\b/i);
    }
  });

  it('names the five store images the release actually produces', () => {
    const screenshots = section('Screenshots');
    for (const file of [
      'times-light.png',
      'times-dark.png',
      'method-step.png',
      'ramadan.png',
      'times-urdu.png',
    ]) {
      expect(screenshots).toContain(file);
    }
    expect(screenshots).toContain('1280 by 800');
  });
});
