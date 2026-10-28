import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * WCAG 2.2 AA for every pair the popup actually paints, in both themes.
 *
 * Text and meaningful borders are held to 4.5:1. Button fills, focus rings and icons are
 * held to 3:1 (WCAG 1.4.11). Every ink on every hero-gradient stop is also 4.5:1, because
 * the gradient is fixed and its contrast can be asserted (PLAN.md line 206).
 *
 * outline-variant is deliberately below 3:1 in the phone's design system: it is a
 * decorative hairline, never text and never the only sign of something.
 */

const css = readFileSync(new URL('../../src/popup/tokens.css', import.meta.url), 'utf8');
const DARK_AT = ":root[data-theme='dark'] {";

function blockOf(source: string): string {
  const open = source.indexOf('{');
  const close = source.indexOf('}', open);
  if (open < 0 || close < 0) throw new Error('tokens.css block not found');
  return source.slice(open, close);
}

const BLOCKS = {
  light: blockOf(css.slice(0, css.indexOf(DARK_AT))),
  dark: blockOf(css.slice(css.indexOf(DARK_AT))),
} as const;

type Theme = keyof typeof BLOCKS;

function token(theme: Theme, name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(BLOCKS[theme]);
  if (!match?.[1]) throw new Error(`Missing ${name} in ${theme}`);
  return match[1];
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 0xff) +
    0.7152 * channel((n >> 8) & 0xff) +
    0.0722 * channel(n & 0xff)
  );
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background, minimum] pairs the popup paints. */
const TEXT_PAIRS: Array<[string, string, number]> = [
  ['on-background', 'background', 4.5],
  ['on-surface', 'background', 4.5],
  ['on-surface', 'surface', 4.5],
  ['on-surface', 'surface-container-high', 4.5],
  ['on-surface', 'accent-container', 4.5],
  ['on-surface-variant', 'background', 4.5],
  ['on-surface-variant', 'surface', 4.5],
  ['on-surface-variant', 'surface-container-high', 4.5],
  ['on-surface-variant', 'accent-container', 4.5],
  ['on-surface-variant', 'secondary-container', 4.5],
  ['primary', 'background', 4.5],
  ['primary', 'surface', 4.5],
  ['primary', 'surface-container-high', 4.5],
  ['primary', 'primary-container', 4.5],
  ['primary', 'accent-container', 4.5],
  ['on-primary', 'primary', 4.5],
  ['on-primary-container', 'primary-container', 4.5],
  ['on-secondary-container', 'secondary-container', 4.5],
  ['accent', 'accent-container', 4.5],
  ['on-accent', 'accent', 4.5],
  ['on-accent-container', 'accent-container', 4.5],
  ['on-cta', 'cta', 4.5],
];

/** Things that must be seen, but not read as body text. */
const UI_PAIRS: Array<[string, string, number]> = [
  ['cta', 'background', 3],
  ['cta', 'surface', 3],
  ['primary', 'background', 3],
  ['primary', 'surface', 3],
  ['outline', 'surface', 3],
  ['outline', 'background', 3],
];

const HERO_STOPS = ['hero-gradient-start', 'hero-gradient-middle', 'hero-gradient-end'];
const HERO_INKS = ['on-hero', 'on-hero-label', 'on-hero-secondary'];

describe('role contrast', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bg, min] of TEXT_PAIRS) {
      it(`${theme}: ${fg} on ${bg} is at least ${min}:1`, () => {
        expect(ratio(token(theme, fg), token(theme, bg))).toBeGreaterThanOrEqual(min);
      });
    }
    for (const [fg, bg, min] of UI_PAIRS) {
      it(`${theme}: ${fg} against ${bg} is at least ${min}:1`, () => {
        expect(ratio(token(theme, fg), token(theme, bg))).toBeGreaterThanOrEqual(min);
      });
    }
  }
});

describe('hero gradient contrast', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const stop of HERO_STOPS) {
      for (const ink of HERO_INKS) {
        it(`${theme}: ${ink} on ${stop} is at least 4.5:1`, () => {
          expect(ratio(token(theme, ink), token(theme, stop))).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }
});
