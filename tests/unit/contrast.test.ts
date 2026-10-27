import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/popup/tokens.css', import.meta.url), 'utf8');
const lightBlock = css.slice(0, css.indexOf('@media'));
const darkBlock = css.slice(css.indexOf('@media'));

function token(block: string, name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block);
  if (!match?.[1]) throw new Error(`Missing ${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
}

function ratio(a: string, b: string): number {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}

describe('token contrast', () => {
  for (const [scheme, block] of [
    ['light', lightBlock],
    ['dark', darkBlock],
  ] as const) {
    it(`keeps the action button readable in ${scheme}`, () => {
      const text = token(block, 'on-primary');
      expect(ratio(token(block, 'primary-strong'), text)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(token(block, 'primary-hover'), text)).toBeGreaterThanOrEqual(4.5);
    });

    it(`keeps the brand text readable on the page in ${scheme}`, () => {
      expect(ratio(token(block, 'primary'), token(block, 'paper'))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
