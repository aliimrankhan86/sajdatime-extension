export function TownChip({ name, onChange }: { name: string; onChange: () => void }) {
  return (
    <button
      class="town-chip"
      type="button"
      // "London, change location" keeps the visible words ("London" then "Change")
      // in the accessible name, which WCAG 2.5.3 (Label in Name) requires.
      aria-label={`${name}, change location`}
      onClick={onChange}
    >
      <svg
        class="town-pin"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5A2.5,2.5 0 1,1 12,6.5a2.5,2.5 0 0,1 0,5z" />
      </svg>
      <span class="place">{name}</span>
      {/* A zero-width space keeps "London" and "Change" as separate words for
          WCAG 2.5.3 (Label in Name). Flex `gap` is visual only, so without it the
          two spans read as one word "LondonChange" and axe fails the mismatch. */}
      {'\u200B'}
      <span class="town-change">Change</span>
    </button>
  );
}
