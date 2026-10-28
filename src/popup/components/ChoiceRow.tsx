/**
 * One option in a list of choices (the sound sheet). Selected = a soft green fill
 * (primaryContainer) plus a tick at the end. The whole row is the button.
 */
interface ChoiceRowProps {
  selected: boolean;
  title: string;
  hint?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export function ChoiceRow({ selected, title, hint, disabled, onSelect }: ChoiceRowProps) {
  return (
    <button
      class={selected ? 'choice-row is-selected' : 'choice-row'}
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={onSelect}
    >
      <span class="choice-copy">
        <span class="choice-title">{title}</span>
        {hint ? <span class="choice-hint">{hint}</span> : null}
      </span>
      {selected ? (
        <svg
          class="choice-tick"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </button>
  );
}
