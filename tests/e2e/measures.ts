import type { Page } from '@playwright/test';

/** Controls whose rendered target is smaller than 44 CSS pixels in either axis. */
export async function undersizedControls(page: Page) {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('button, summary, select, input'));
    return nodes
      .filter((node) => {
        const element = node as HTMLElement;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((node) => {
        const element = node as HTMLElement;
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((control) => control.width < 44 || control.height < 44);
  });
}

/**
 * How many visual lines the countdown renders on. This runs in the browser via
 * `page.evaluate`, so it can reach `document` and `Range`.
 */
export function countdownLineCount(): number {
  const element = document.querySelector('.countdown');
  if (!element) return 0;
  const range = document.createRange();
  range.selectNodeContents(element);
  const tops = new Set<number>();
  for (const rect of Array.from(range.getClientRects())) tops.add(Math.round(rect.top));
  return tops.size;
}
