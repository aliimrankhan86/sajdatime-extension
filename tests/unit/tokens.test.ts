import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * U1: tokens.css is named by Material role and carries the phone's exact values.
 *
 * The fixture is a byte copy of SajdaTime/docs/design-system/tokens/color.json, so a
 * drifted value fails here instead of shipping a slightly different green. If the phone
 * adds a role, this test fails until tokens.css carries it, which is the point.
 */

interface Colour {
  $value?: string;
  ref?: string;
  light?: { $value: string };
  dark?: { $value: string };
}

interface HeroTheme {
  stops: Colour[];
  ink: Record<string, Colour>;
  sheen: Colour;
  rim: Colour;
  rimBottom: Colour;
  glow: Colour;
}

interface ColourJson {
  roles: Record<string, Colour>;
  brand: Record<string, Colour>;
  gradients: {
    hero: {
      light: HeroTheme;
      dark: HeroTheme;
    };
  };
}

const css = readFileSync(new URL('../../src/popup/tokens.css', import.meta.url), 'utf8');
const fixture = JSON.parse(
  readFileSync(new URL('../fixtures/color.json', import.meta.url), 'utf8'),
) as ColourJson;

const DARK_AT = ":root[data-theme='dark'] {";

function blockOf(source: string): string {
  const open = source.indexOf('{');
  const close = source.indexOf('}', open);
  if (open < 0 || close < 0) throw new Error('tokens.css block not found');
  return source.slice(open, close);
}

const lightSource = css.slice(0, css.indexOf(DARK_AT));
const darkSource = css.slice(css.indexOf(DARK_AT));
const LIGHT = blockOf(lightSource);
const DARK = blockOf(darkSource);

function valueOf(block: string, name: string): string | undefined {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  return match?.[1]?.toLowerCase();
}

/** Like valueOf, but also accepts the word `transparent` (the dark hero glow). */
function valueOfFlex(block: string, name: string): string | undefined {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8}|transparent)`).exec(block);
  return match?.[1]?.toLowerCase();
}

/** onPrimaryContainer becomes on-primary-container, and so on. */
function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function expected(entry: Colour, theme: 'light' | 'dark'): string {
  const value = theme === 'light' ? entry.light?.$value : entry.dark?.$value;
  if (!value) throw new Error(`Fixture has no ${theme} value`);
  return value.toLowerCase();
}

function resolve(entry: Colour): string {
  if (entry.ref) {
    const [role, refTheme] = entry.ref.split('.');
    const target = role ? fixture.roles[role] : undefined;
    if (!target || (refTheme !== 'light' && refTheme !== 'dark')) {
      throw new Error(`Unresolved ref ${entry.ref}`);
    }
    return expected(target, refTheme);
  }
  if (!entry.$value) throw new Error('Fixture entry has no value');
  return entry.$value.toLowerCase();
}

const ROLE_NAMES = Object.keys(fixture.roles);

describe('tokens.css parity with the phone design system', () => {
  it('defines every role in both themes, and nothing extra in one of them', () => {
    const lightNames = [...LIGHT.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]).sort();
    const darkNames = [...DARK.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]).sort();
    expect(lightNames).toEqual(darkNames);
    for (const role of ROLE_NAMES) {
      expect(lightNames).toContain(kebab(role));
    }
  });

  it.each(ROLE_NAMES)('role %s matches the phone in light and dark', (role) => {
    const entry = fixture.roles[role] as Colour;
    expect(valueOf(LIGHT, kebab(role))).toBe(expected(entry, 'light'));
    expect(valueOf(DARK, kebab(role))).toBe(expected(entry, 'dark'));
  });

  it('carries the brand call to action, whose dark fill is its own green', () => {
    expect(valueOf(LIGHT, 'cta')).toBe(expected(fixture.brand.cta as Colour, 'light'));
    expect(valueOf(DARK, 'cta')).toBe(expected(fixture.brand.cta as Colour, 'dark'));
    expect(valueOf(LIGHT, 'on-cta')).toBe(resolve(fixture.brand.onCta as Colour));
    expect(valueOf(DARK, 'on-cta')).toBe(resolve(fixture.brand.onCta as Colour));
  });

  it('carries the fixed hero gradient and every ink on it', () => {
    const { light, dark } = fixture.gradients.hero;
    const stops = ['start', 'middle', 'end'];
    stops.forEach((stop, index) => {
      expect(valueOf(LIGHT, `hero-gradient-${stop}`)).toBe(resolve(light.stops[index] as Colour));
      expect(valueOf(DARK, `hero-gradient-${stop}`)).toBe(resolve(dark.stops[index] as Colour));
    });
    for (const [ink, token] of [
      ['prominent', 'on-hero'],
      ['label', 'on-hero-label'],
      ['secondary', 'on-hero-secondary'],
    ] as const) {
      expect(valueOf(LIGHT, token)).toBe(resolve(light.ink[ink] as Colour));
      expect(valueOf(DARK, token)).toBe(resolve(dark.ink[ink] as Colour));
    }
    // The overlays: sheen, rim, rim-bottom and glow. The dark glow is transparent,
    // which the hex-only valueOf cannot read, so glow uses the flexible matcher.
    for (const [overlay, token] of [
      ['sheen', 'hero-sheen'],
      ['rim', 'hero-rim'],
      ['rimBottom', 'hero-rim-bottom'],
    ] as const) {
      expect(valueOf(LIGHT, token)).toBe((light[overlay] as Colour).$value?.toLowerCase());
      expect(valueOf(DARK, token)).toBe((dark[overlay] as Colour).$value?.toLowerCase());
    }
    expect(valueOfFlex(LIGHT, 'hero-glow')).toBe((light.glow as Colour).$value?.toLowerCase());
    expect(valueOfFlex(DARK, 'hero-glow')).toBe((dark.glow as Colour).$value?.toLowerCase());
  });

  it('sets color-scheme in both themes, so native controls follow', () => {
    expect(LIGHT).toContain('color-scheme: light');
    expect(DARK).toContain('color-scheme: dark');
  });

  it('stays a token file: no !important and no text-transform', () => {
    expect(css).not.toContain('!important');
    expect(css).not.toContain('text-transform');
  });
});
