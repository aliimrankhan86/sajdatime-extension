import type { ComponentChildren } from 'preact';

/**
 * One Settings row: a 36px icon tile, title, current value under it, then a chevron.
 * The whole row is the button, so it is keyboard reachable and the hit target is the
 * full height. `rowId` is the data attribute the caller uses to return focus on close.
 */
interface RowProps {
  icon: ComponentChildren;
  title: string;
  value?: string;
  chevron?: boolean;
  onClick?: () => void;
  rowId?: string;
}

export function Row({ icon, title, value, chevron = true, onClick, rowId }: RowProps) {
  const label = value ? `${title}, ${value}` : title;
  return (
    <button class="row" type="button" data-row={rowId} aria-label={label} onClick={onClick}>
      <span class="row-icon" aria-hidden="true">
        {icon}
      </span>
      <span class="row-copy">
        {/*
          A zero-width space keeps the title and value as separate words for
          WCAG 2.5.3 (Label in Name). It lives inside the title span, not between
          the spans: a bare text node between them becomes an anonymous flex item
          in the column and claims a whole line box plus two column gaps, so every
          row with a value grows by about 27px.
        */}
        <span class="row-title">{value ? `${title}\u200B` : title}</span>
        {value ? <span class="row-value">{value}</span> : null}
      </span>
      {chevron ? (
        <svg
          class="row-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      ) : null}
    </button>
  );
}
