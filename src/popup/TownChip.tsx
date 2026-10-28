import { t } from '../i18n';
export function TownChip({ name, onChange }: { name: string; onChange: () => void }) {
  return (
    <button
      class="town-chip"
      type="button"
      // WCAG 2.5.3 (Label in Name): the accessible name has to contain the visible words,
      // so it is the town and the translated Change joined the same way the screen joins
      // them. A comma or a different order would fail the check in languages where the
      // two words are not already in that order.
      aria-label={`${name} ${t('common.change')}`}
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
      <span class="place">{name}</span>{' '}
      <span class="town-change">{t('common.change')}</span>
    </button>
  );
}
