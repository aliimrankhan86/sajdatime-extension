import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LONDON, launchExtension, seedSettings } from './extension';

/**
 * Measured, not looked at. The reviewer cannot be shown a live popup, so this test reads
 * the computed colours, the vertical order and the gaps in both themes and compares them
 * with the exact values in tokens.css. It also proves Times still fits 600 pixels.
 */

const EXPECTED = {
  light: {
    background: 'rgb(247, 245, 243)',
    primary: 'rgb(11, 90, 67)',
    surface: 'rgb(253, 252, 251)',
    outlineVariant: 'rgb(201, 207, 201)',
    primaryContainer: 'rgb(215, 234, 224)',
    onBackground: 'rgb(27, 33, 30)',
    onSurfaceVariant: 'rgb(90, 96, 92)',
    cta: 'rgb(11, 90, 67)',
    onCta: 'rgb(255, 255, 255)',
    onHero: 'rgb(10, 36, 25)',
    onHeroLabel: 'rgb(44, 74, 60)',
    onHeroSecondary: 'rgb(62, 92, 76)',
    hasGlowShadow: true,
  },
  dark: {
    background: 'rgb(16, 19, 18)',
    primary: 'rgb(79, 196, 143)',
    surface: 'rgb(23, 27, 26)',
    outlineVariant: 'rgb(42, 49, 46)',
    primaryContainer: 'rgb(20, 48, 40)',
    onBackground: 'rgb(231, 234, 232)',
    onSurfaceVariant: 'rgb(169, 178, 174)',
    cta: 'rgb(23, 128, 90)',
    onCta: 'rgb(255, 255, 255)',
    onHero: 'rgb(231, 234, 232)',
    onHeroLabel: 'rgb(143, 217, 184)',
    onHeroSecondary: 'rgb(184, 196, 190)',
    hasGlowShadow: false,
  },
} as const;

async function styles(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      color: style.color,
      background: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderTopColor,
      bottomBorderColor: style.borderBottomColor,
      boxShadow: style.boxShadow,
      rect: node.getBoundingClientRect().toJSON() as {
        top: number;
        bottom: number;
        left: number;
        right: number;
      },
    };
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`in ${theme} every colour is a token and the blocks stay in order`, async () => {
    const extension = await launchExtension();
    const page = extension.page;
    try {
      await seedSettings(extension, new Date('2026-10-27T11:00:00Z'), { ...LONDON, theme });
      const expected = EXPECTED[theme];

      const body = await styles(page, 'body');
      expect(body.background).toBe(expected.background);
      expect(body.color).toBe(expected.onBackground);

      const brand = await styles(page, '.brand');
      expect(brand.color).toBe(expected.primary);

      const place = await styles(page, '.place');
      expect(place.color).toBe(expected.onBackground);

      const hijri = await styles(page, '.hijri');
      expect(hijri.color).toBe(expected.onSurfaceVariant);

      // The hero card carries the one fixed gradient and its own ink, plus a glow in
      // light and none in dark (color.json gradients.hero).
      const card = await styles(page, '.next-card');
      expect(card.backgroundImage).toContain('linear-gradient');
      expect(card.boxShadow !== 'none').toBe(expected.hasGlowShadow);
      expect((await styles(page, '.next-label')).color).toBe(expected.onHeroLabel);
      expect((await styles(page, '.next-name')).color).toBe(expected.onHero);
      expect((await styles(page, '.next-time')).color).toBe(expected.onHeroSecondary);

      const times = await styles(page, '.times');
      expect(times.background).toBe(expected.surface);
      expect(times.borderColor).toBe(expected.outlineVariant);

      const row = await styles(page, '.time-row');
      expect(row.bottomBorderColor).toBe(expected.outlineVariant);

      const nextRow = await styles(page, '.time-row.is-next');
      expect(nextRow.background).toBe(expected.primaryContainer);

      const pill = await styles(page, '.next-pill');
      expect(pill.color).toBe(expected.onCta);
      expect(pill.background).toBe(expected.cta);

      const footer = await styles(page, '.footer');
      expect(footer.color).toBe(expected.onSurfaceVariant);

      // Vertical order: the card is above the list, the list is above the footer, and no
      // block crosses the 380 pixel edge.
      expect(card.rect.bottom).toBeLessThanOrEqual(times.rect.top + 0.5);
      expect(times.rect.bottom).toBeLessThanOrEqual(footer.rect.top + 0.5);
      for (const block of [brand, card, times, footer]) {
        expect(block.rect.left).toBeGreaterThanOrEqual(-0.5);
        expect(block.rect.right).toBeLessThanOrEqual(380.5);
      }

      // Gaps this step touched stay on the 4, 8, 12, 16, 24 scale. Section to section
      // is 16 since the Step 5 review, which had 8 and read as squeezed.
      expect(Math.round(times.rect.top - card.rect.bottom)).toBe(16);
      expect(Math.round(footer.rect.top - times.rect.bottom)).toBe(16);

      const fits = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(fits.scrollHeight).toBeLessThanOrEqual(600);
    } finally {
      await extension.close();
    }
  });
}
