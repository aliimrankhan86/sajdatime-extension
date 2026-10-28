import { describe, expect, it } from 'vitest';
import { countryInSentence, METHOD_NAMES } from '../../src/popup/meta';

/**
 * English puts "the" before twelve country names when the name sits inside a sentence,
 * and never when the name stands alone. The Step 8 review found "Suggested for United
 * Kingdom" on the method step. `countryInSentence` is the one helper that fixes it, and
 * it must be idempotent so a caller cannot double the word by applying it twice.
 */
describe('countryInSentence', () => {
  it('adds "the" to each of the twelve names that take it', () => {
    const withThe: Array<[string, string]> = [
      ['United Kingdom', 'the United Kingdom'],
      ['United States', 'the United States'],
      ['United Arab Emirates', 'the United Arab Emirates'],
      ['Netherlands', 'the Netherlands'],
      ['Philippines', 'the Philippines'],
      ['Czech Republic', 'the Czech Republic'],
      ['Maldives', 'the Maldives'],
      ['Bahamas', 'the Bahamas'],
      ['Gambia', 'the Gambia'],
      ['Central African Republic', 'the Central African Republic'],
      ['Dominican Republic', 'the Dominican Republic'],
      ['Comoros', 'the Comoros'],
    ];
    for (const [name, expected] of withThe) {
      expect(countryInSentence(name), name).toBe(expected);
    }
  });

  it('leaves every other name bare', () => {
    for (const name of ['Pakistan', 'Saudi Arabia', 'Turkey', 'Egypt', 'Indonesia', 'France']) {
      expect(countryInSentence(name), name).toBe(name);
    }
  });

  it('is idempotent, so a second call changes nothing', () => {
    expect(countryInSentence(countryInSentence('United Kingdom'))).toBe('the United Kingdom');
    expect(countryInSentence(countryInSentence('Pakistan'))).toBe('Pakistan');
  });

  it('trims surrounding space and keeps an empty name empty', () => {
    expect(countryInSentence('  Netherlands ')).toBe('the Netherlands');
    expect(countryInSentence('')).toBe('');
  });

  it('covers the names the method sheet can show for the UK and the US', () => {
    // The two countries the extension's own fixtures use must both take "the".
    expect(countryInSentence('United Kingdom')).toMatch(/^the /);
    expect(countryInSentence('United States')).toMatch(/^the /);
  });
});

describe('the method names', () => {
  it('names all thirteen methods, and none of them is a phrase about a country', () => {
    const names = Object.values(METHOD_NAMES);
    expect(names).toHaveLength(13);
    for (const name of names) {
      expect(name.length).toBeGreaterThan(0);
      expect(name.startsWith('Suggested')).toBe(false);
    }
  });
});
