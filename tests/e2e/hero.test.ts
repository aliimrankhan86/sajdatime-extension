import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LONDON, launchExtension, seedSettings, setTheme } from './extension';

/**
 * The Step 5 review measured a Time screen that passed its tests and still looked wrong:
 * a clipped date, a faded hero, a bar running off the card, a countdown in the wrong
 * shape, a squeezed hierarchy and a notice sliding under the header. Every one of those
 * findings is measured here, in all four states and both themes, so none can come back
 * unnoticed.
 */

const STATES = [
  { name: 'normal', iso: '2026-10-27T11:00:00Z', notice: false },
  { name: 'ramadan', iso: '2027-02-20T11:00:00Z', notice: false },
  { name: 'coming', iso: '2027-02-06T11:00:00Z', notice: true },
  { name: 'eid', iso: '2027-03-09T11:00:00Z', notice: true },
] as const;

type Box = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

type Probe = {
  scrollHeight: number;
  scrollWidth: number;
  clientWidth: number;
  hero: Box;
  heroPaddingTop: number;
  date: Box & { textWidth: number; lines: number };
  hijri: Box & { textWidth: number; lines: number };
  chip: Box;
  notice: Box | null;
  card: Box & { padTop: number; padLeft: number; padRight: number; gradient: string };
  label: Box | null;
  row: Box | null;
  countdown: Box | null;
  note: Box | null;
  barsBox: Box | null;
  compact: Box | null;
  bars: { left: number; right: number; width: number }[];
  inks: { name: string; color: string; opacity: number; contrast: number[] }[];
  countColor: string;
  nameColor: string;
  noteColor: string;
  timeColor: string;
  countdownText: string;
  countdownTabs: string;
  compactLabel: string | null;
  paint: { name: string; hit: string }[];
  clipped: string[];
};

async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => {
    const round = (value: number): number => Math.round(value * 10) / 10;
    const box = (node: Element | null): Box | null => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        top: round(rect.top),
        bottom: round(rect.bottom),
        left: round(rect.left),
        right: round(rect.right),
        width: round(rect.width),
        height: round(rect.height),
      };
    };
    const textWidth = (node: Element): number => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = Array.from(range.getClientRects());
      if (rects.length === 0) return 0;
      const left = Math.min(...rects.map((rect) => rect.left));
      const right = Math.max(...rects.map((rect) => rect.right));
      return round(right - left);
    };
    const lineCount = (node: Element): number => {
      const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight);
      return Math.round(node.getBoundingClientRect().height / lineHeight);
    };
    // WCAG relative luminance and contrast ratio, over the three gradient stops.
    const rgb = (value: string): number[] => {
      const channels = value.match(/\d+(\.\d+)?/g);
      if (channels !== null && value.trim().startsWith('rgb')) {
        return channels.slice(0, 3).map((channel) => Number.parseFloat(channel));
      }
      const hex = value.trim().replace('#', '');
      const full =
        hex.length === 3
          ? hex
              .split('')
              .map((part) => part + part)
              .join('')
          : hex.slice(0, 6);
      return [0, 2, 4].map((index) => Number.parseInt(full.slice(index, index + 2), 16));
    };
    const luminance = (channels: number[]): number => {
      const parts = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (parts[0] ?? 0) + 0.7152 * (parts[1] ?? 0) + 0.0722 * (parts[2] ?? 0);
    };
    const contrast = (a: number[], b: number[]): number => {
      const first = luminance(a);
      const second = luminance(b);
      return round((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05));
    };

    const card = document.querySelector('.next-card') as HTMLElement | null;
    if (!card) throw new Error('the hero card is missing');
    const cardStyle = getComputedStyle(card);
    const stopNames = ['--hero-gradient-start', '--hero-gradient-middle', '--hero-gradient-end'];
    const stops = stopNames.map((name) => rgb(cardStyle.getPropertyValue(name)));

    // The sheen and the rim must paint under the words. elementFromPoint never returns a
    // pseudo element, so the two overlays are first allowed to take pointer events: an
    // overlay painted above the text then answers the hit itself, through its card.
    const style = document.createElement('style');
    style.textContent = '.next-card::before, .next-card::after { pointer-events: auto; }';
    document.head.append(style);

    const centreHit = (node: Element): string => {
      const rect = node.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (hit === null) return 'none';
      if (hit === node) return 'self';
      if (node.contains(hit)) return 'child';
      return hit.tagName.toLowerCase() + '.' + String(hit.className);
    };

    const inkSelectors = ['.next-label', '.next-name', '.next-time', '.countdown', '.countdown-note'];
    const inks = inkSelectors.flatMap((selector) => {
      const node = document.querySelector(selector);
      if (node === null) return [];
      const computed = getComputedStyle(node);
      const colour = rgb(computed.color);
      return [
        {
          name: selector,
          color: computed.color,
          opacity: Number(computed.opacity),
          contrast: stops.map((stop) => contrast(colour, stop)),
        },
      ];
    });

    const paintSelectors = [...inkSelectors, '.day-bars'];
    const paint = paintSelectors.flatMap((selector) => {
      const node = document.querySelector(selector);
      return node === null ? [] : [{ name: selector, hit: centreHit(node) }];
    });

    style.remove();

    // Nothing may be cut off inside its own box.
    const clipped = Array.from(
      document.querySelectorAll(
        '.date, .hijri, .next-name, .next-time, .countdown, .next-compact-name, .next-compact-time, .next-compact-count, .time-value',
      ),
    )
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.className + ': ' + node.scrollWidth + ' > ' + node.clientWidth);

    const countdown = document.querySelector('.countdown');
    const countStyle = countdown === null ? null : getComputedStyle(countdown);
    const compact = document.querySelector('.next-compact');
    const date = document.querySelector('.date') as HTMLElement | null;
    const hijri = document.querySelector('.hijri') as HTMLElement | null;
    const name = document.querySelector('.next-name');
    const time = document.querySelector('.next-time');
    const note = document.querySelector('.countdown-note');
    const hero = document.querySelector('.hero') as Element;

    return {
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hero: box(hero) as Box,
      heroPaddingTop: Number.parseFloat(getComputedStyle(hero).paddingTop),
      date: {
        ...(box(date) as Box),
        textWidth: date === null ? 0 : textWidth(date),
        lines: date === null ? 0 : lineCount(date),
      },
      hijri: {
        ...(box(hijri) as Box),
        textWidth: hijri === null ? 0 : textWidth(hijri),
        lines: hijri === null ? 0 : lineCount(hijri),
      },
      chip: box(document.querySelector('.town-chip')) as Box,
      notice: box(document.querySelector('.notice')),
      card: {
        ...(box(card) as Box),
        padTop: Number.parseFloat(cardStyle.paddingTop),
        padLeft: Number.parseFloat(cardStyle.paddingLeft),
        padRight: Number.parseFloat(cardStyle.paddingRight),
        gradient: cardStyle.backgroundImage,
      },
      label: box(document.querySelector('.next-label')),
      row: box(document.querySelector('.next-row')),
      countdown: box(countdown),
      note: box(note),
      barsBox: box(document.querySelector('.day-bars')),
      compact: box(compact),
      bars: Array.from(document.querySelectorAll('.day-bar')).map((node) => {
        const rect = node.getBoundingClientRect();
        return { left: round(rect.left), right: round(rect.right), width: round(rect.width) };
      }),
      inks,
      countColor: countStyle === null ? '' : countStyle.color,
      nameColor: name === null ? '' : getComputedStyle(name).color,
      noteColor: note === null ? '' : getComputedStyle(note).color,
      timeColor: time === null ? '' : getComputedStyle(time).color,
      countdownText: countdown === null ? '' : (countdown.textContent ?? '').trim(),
      countdownTabs: countStyle === null ? '' : countStyle.fontVariantNumeric,
      compactLabel: compact === null ? null : compact.getAttribute('aria-label'),
      paint,
      clipped,
    };
  });
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Every gap the popup draws comes from 4, 8, 12, 16 or 24. */
const GAPS = [4, 8, 12, 16, 24];

for (const theme of ['light', 'dark'] as const) {
  test(`in ${theme} the header, the hero and the notice measure right in all four states`, async () => {
    const extension = await launchExtension();
    const page = extension.page;
    try {
      for (const state of STATES) {
        await seedSettings(extension, new Date(state.iso), LONDON);
        await setTheme(page, theme);
        const seen = await probe(page);
        const where = theme + ' ' + state.name;

        // Nothing may scroll: all four states fit 380 by 600 in both themes.
        expect(seen.scrollHeight, `${where}: the popup scrolls`).toBeLessThanOrEqual(600);
        expect(seen.scrollWidth, `${where}: the popup scrolls sideways`).toBeLessThanOrEqual(
          seen.clientWidth,
        );
        expect(seen.clipped, `${where}: something is cut off`).toEqual([]);

        // The header sits 16 from the top, in two rows: mark and date, then the chip.
        expect(seen.heroPaddingTop, `${where}: header top padding`).toBe(16);
        expect(seen.date.lines, `${where}: the date wraps`).toBe(1);
        expect(seen.hijri.lines, `${where}: the Hijri date wraps`).toBe(1);
        expect(seen.date.textWidth, `${where}: the date is truncated`).toBeLessThanOrEqual(
          seen.date.width + 0.5,
        );
        expect(seen.hijri.textWidth, `${where}: the Hijri date is truncated`).toBeLessThanOrEqual(
          seen.hijri.width + 0.5,
        );
        expect(seen.chip.top, `${where}: the chip is on row two`).toBeGreaterThan(seen.date.bottom);
        expect(seen.hero.bottom, `${where}: the chip is outside the header`).toBeGreaterThanOrEqual(
          seen.chip.bottom - 0.5,
        );

        // The first block after the header sits a full 16 below it, never under it.
        const firstBlockTop = seen.notice === null ? seen.card.top : seen.notice.top;
        expect(firstBlockTop, `${where}: the header overlaps the block below`).toBeGreaterThanOrEqual(
          seen.hero.bottom + 15.5,
        );

        // The card keeps its gradient on every day, notice or not.
        expect(seen.card.gradient, `${where}: the gradient is gone`).toContain('linear-gradient');

        if (state.notice) {
          // A notice day uses the compact card: one row, no label, no note, no bars.
          expect(seen.compact, `${where}: the compact row is missing`).not.toBeNull();
          expect(seen.label, `${where}: the label is still in the compact card`).toBeNull();
          expect(seen.countdown, `${where}: the big countdown is still in the card`).toBeNull();
          expect(seen.note, `${where}: the note is still in the compact card`).toBeNull();
          expect(seen.bars.length, `${where}: the bars are still in the card`).toBe(0);
          expect(seen.compact?.height, `${where}: the compact card is a row`).toBeLessThan(30);
          expect(seen.compactLabel, `${where}: the screen reader sentence`).toMatch(
            /^.+ at \d{1,2}:\d{2}( [AP]M)?, \d+ (hour|minute|second)/,
          );
          expect(seen.compactLabel, `${where}: the screen reader sentence`).toMatch(
            /until (it begins|suhoor ends|you break your fast)$/,
          );
          const parts = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.next-compact > *')).map((node) =>
              node.tagName.toLowerCase() === 'svg' ? 'glyph' : node.className,
            ),
          );
          expect(parts, `${where}: the compact row order`).toEqual([
            'glyph',
            'next-compact-name',
            'next-compact-time',
            'next-compact-count',
          ]);
        } else {
          // The full hero, top to bottom: label, glyph and name and time, the countdown,
          // "until it begins", the five bars.
          expect(seen.label, `${where}: the label is missing`).not.toBeNull();
          expect(seen.row, `${where}: the name row is missing`).not.toBeNull();
          expect(seen.countdown, `${where}: the countdown is missing`).not.toBeNull();
          expect(seen.note, `${where}: the note is missing`).not.toBeNull();
          expect(seen.barsBox, `${where}: the bars are missing`).not.toBeNull();
          if (seen.label && seen.row && seen.countdown && seen.note && seen.barsBox) {
            expect(seen.label.bottom, `${where}: label above the name row`).toBeLessThanOrEqual(
              seen.row.top + 0.5,
            );
            expect(seen.row.bottom, `${where}: name row above the countdown`).toBeLessThanOrEqual(
              seen.countdown.top + 0.5,
            );
            expect(seen.countdown.bottom, `${where}: countdown above its note`).toBeLessThanOrEqual(
              seen.note.top + 0.5,
            );
            expect(seen.note.bottom, `${where}: the note is above the bars`).toBeLessThanOrEqual(
              seen.barsBox.top + 0.5,
            );
            const gaps: [string, number][] = [
              ['label to name row', seen.row.top - seen.label.bottom],
              ['name row to countdown', seen.countdown.top - seen.row.bottom],
              ['countdown to note', seen.note.top - seen.countdown.bottom],
              ['note to bars', seen.barsBox.top - seen.note.bottom],
            ];
            for (const [label, gap] of gaps) {
              expect(GAPS, `${where}: ${label} gap ${Math.round(gap)}`).toContain(Math.round(gap));
            }
          }

          // A zero padded clock with tabular figures, and words under it.
          expect(seen.countdownText, `${where}: countdown shape`).toMatch(/^\d{2}:\d{2}:\d{2}$/);
          expect(seen.countdownTabs, `${where}: tabular figures`).toContain('tabular-nums');
          expect(seen.countdown?.height, `${where}: the countdown wraps`).toBeLessThan(40);
          expect([
            'until it begins',
            'until suhoor ends',
            'until you break your fast',
          ]).toContain(await page.locator('.countdown-note').innerText());
          expect(await page.locator('.countdown').getAttribute('aria-label')).toMatch(
            /^\d+ (hour|minute|second)s?( \d+ (hour|minute|second)s?)* until [A-Za-z ]+$/,
          );

          // Five bars, inside the card's padding box, equal width, equal gaps.
          expect(seen.bars.length, `${where}: five bars`).toBe(5);
          for (const bar of seen.bars) {
            expect(
              bar.left,
              `${where}: a bar starts outside the padding box`,
            ).toBeGreaterThanOrEqual(seen.card.left + seen.card.padLeft - 0.5);
            expect(bar.right, `${where}: a bar ends outside the padding box`).toBeLessThanOrEqual(
              seen.card.right - seen.card.padRight + 0.5,
            );
          }
          const widths = seen.bars.map((bar) => bar.width);
          expect(
            Math.max(...widths) - Math.min(...widths),
            `${where}: bar widths differ`,
          ).toBeLessThan(1);
          const barGaps = seen.bars
            .slice(1)
            .map((bar, index) => round1(bar.left - (seen.bars[index]?.right ?? 0)));
          expect(
            Math.max(...barGaps) - Math.min(...barGaps),
            `${where}: bar gaps differ`,
          ).toBeLessThan(1);
        }

        // The hero words are on top of the sheen and the rim, at full opacity, in ink
        // that clears 4.5 to 1 against every stop of the gradient.
        for (const ink of seen.inks) {
          expect(ink.opacity, `${where}: ${ink.name} is faded`).toBe(1);
          for (const ratio of ink.contrast) {
            expect(ratio, `${where}: ${ink.name} contrast`).toBeGreaterThanOrEqual(4.5);
          }
        }
        for (const entry of seen.paint) {
          expect(
            ['self', 'child'],
            `${where}: ${entry.name} is under an overlay (${entry.hit})`,
          ).toContain(entry.hit);
        }
        if (!state.notice) {
          expect(seen.countColor, `${where}: countdown ink`).toBe(seen.nameColor);
          expect(seen.noteColor, `${where}: note ink`).toBe(seen.timeColor);
        }
      }
    } finally {
      await extension.close();
    }
  });
}
