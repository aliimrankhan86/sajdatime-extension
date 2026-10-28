import { describe, expect, it } from 'vitest';
import { BADGE_BACKGROUND, BADGE_TEXT, badgeText, humanDuration } from '../../src/core/badge';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe('badgeText', () => {
  it('is minutes with an m under an hour', () => {
    expect(badgeText(54 * MINUTE)).toBe('54m');
    expect(badgeText(5 * MINUTE)).toBe('5m');
    expect(badgeText(1 * MINUTE)).toBe('1m');
  });

  it('rounds up and never reads 0m under a minute', () => {
    expect(badgeText(30 * 1000)).toBe('1m');
    expect(badgeText(59 * 1000)).toBe('1m');
    expect(badgeText(0)).toBe('1m');
    expect(badgeText(-5000)).toBe('1m');
  });

  it('is hours and padded minutes from one hour to under ten hours', () => {
    expect(badgeText(1 * HOUR + 54 * MINUTE)).toBe('1h54');
    expect(badgeText(9 * HOUR + 5 * MINUTE)).toBe('9h05');
    expect(badgeText(1 * HOUR)).toBe('1h00');
  });

  it('rounds a wait just under an hour up to 1h00, not 60m', () => {
    expect(badgeText(59 * MINUTE + 1000)).toBe('1h00');
  });

  it('is just the hours at ten hours and beyond, across midnight', () => {
    expect(badgeText(10 * HOUR)).toBe('10h');
    expect(badgeText(11 * HOUR)).toBe('11h');
    expect(badgeText(11 * HOUR + 54 * MINUTE)).toBe('11h');
  });

  it('always fits four characters', () => {
    for (const wait of [0, 30 * 1000, 54 * MINUTE, 1 * HOUR, 6 * HOUR + 54 * MINUTE, 11 * HOUR]) {
      expect(badgeText(wait).length, `badgeText(${wait})`).toBeLessThanOrEqual(4);
    }
  });
});

describe('humanDuration', () => {
  it('matches the badge in words', () => {
    expect(humanDuration(54 * MINUTE)).toBe('54 minutes');
    expect(humanDuration(1 * MINUTE)).toBe('1 minute');
    expect(humanDuration(1 * HOUR)).toBe('1 hour');
    expect(humanDuration(1 * HOUR + 54 * MINUTE)).toBe('1 hour 54 minutes');
    expect(humanDuration(11 * HOUR)).toBe('11 hours');
  });
});

describe('badge colours', () => {
  it('are the primary green and white', () => {
    expect(BADGE_BACKGROUND).toBe('#0b5a43');
    expect(BADGE_TEXT).toBe('#ffffff');
  });
});
