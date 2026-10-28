/**
 * A two or three way choice drawn as equal parts (School, Asr school, Theme). The
 * selected part gets the solid fill. Each part is a button with `aria-pressed`, so it is
 * reachable by keyboard and announced as pressed or not.
 */
interface SegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** id of the heading that names this group for a screen reader. */
  labelledBy: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  labelledBy,
}: SegmentedProps<T>) {
  return (
    <div class="segmented" role="group" aria-labelledby={labelledBy}>
      {options.map((option) => (
        <button
          class={value === option.value ? 'segment is-selected' : 'segment'}
          type="button"
          aria-pressed={value === option.value}
          aria-disabled={disabled}
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
