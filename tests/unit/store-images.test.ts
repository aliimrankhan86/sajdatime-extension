import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The store images are committed files the stores read by size, and a wrong size is a rejected
 * upload rather than a failed test somewhere. The sizes come from the PNG header, so this checks
 * the real file instead of trusting `tools/store-images.mjs` to have said so.
 */
const IMAGES = new URL('../../docs/store/images/', import.meta.url);

const EXPECTED = {
  'times-light.png': [1280, 800],
  'times-dark.png': [1280, 800],
  'method-step.png': [1280, 800],
  'ramadan.png': [1280, 800],
  'times-urdu.png': [1280, 800],
  'promo-tile-440x280.png': [440, 280],
  'logo-300.png': [300, 300],
} as const;

describe('store images', () => {
  for (const [file, [width, height]] of Object.entries(EXPECTED)) {
    it(`${file} exists at ${width} by ${height}`, () => {
      const path = new URL(file, IMAGES);
      expect(existsSync(path), `${file} is missing. Run npm run store-images`).toBe(true);
      const buffer = readFileSync(path);
      // The eight byte PNG signature, then the IHDR chunk with width and height.
      expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(buffer.readUInt32BE(16)).toBe(width);
      expect(buffer.readUInt32BE(20)).toBe(height);
      expect(buffer.byteLength).toBeGreaterThan(2000);
    });
  }

  it('leaves no working screenshot behind', () => {
    const names = readdirSync(IMAGES);
    expect(names.filter((name) => name.endsWith('.popup.png'))).toEqual([]);
  });
});
