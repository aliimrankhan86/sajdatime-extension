/**
 * A word in a new language is sometimes longer than the room the design gave it. For the
 * one line labels, shrink the text a pixel at a time until it fits, and never below 14
 * pixels (CLAUDE.md: nothing below 14). If it still does not fit at 14 the existing
 * ellipsis takes over, so a long word never breaks the layout.
 *
 * Only labels that are meant to stay on one line are listed. Text that wraps cannot
 * overflow sideways, so it is left alone. Add a selector here when a new one line label
 * is added to styles.css.
 */
export const FIT_SELECTOR = [
  '.date',
  '.hijri',
  '.place',
  '.footer-actions .action',
  '.row-title',
  '.row-value',
  '.method-chooser-label',
].join(',');

export const FIT_FLOOR_PX = 14;

function fitOne(el: HTMLElement): void {
  el.style.removeProperty('font-size');
  if (el.clientWidth === 0) return;
  let size = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth && size > FIT_FLOOR_PX) {
    size -= 1;
    el.style.fontSize = `${size}px`;
  }
}

export function fitAll(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(FIT_SELECTOR).forEach(fitOne);
}

/** Refit after every screen change. Only text and structure are watched, never style. */
export function startFitting(target: HTMLElement): void {
  let queued = false;
  const run = (): void => {
    queued = false;
    fitAll(target);
  };
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }).observe(target, { childList: true, characterData: true, subtree: true });
  run();
}
