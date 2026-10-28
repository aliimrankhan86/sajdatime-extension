export type NoticeTone = 'warning' | 'quiet';

function Mark({ tone }: { tone: NoticeTone }) {
  const d =
    tone === 'warning'
      ? 'M12,3.5L2.5,20h19L12,3.5zM12,9.5v4M12,16.4v0.2'
      : 'M12,12a9,9 0 1,0 0,18a9,9 0 0,0 0,-18zM12,11v6M12,7.5v0.2';
  return (
    <svg
      class="notice-mark"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

export function Notice({
  tone,
  title,
  line,
  onClose,
}: {
  tone: NoticeTone;
  title: string;
  line: string;
  onClose: () => void;
}) {
  return (
    <section class={`notice notice-${tone}`}>
      <Mark tone={tone} />
      <div class="notice-body">
        <h2 class="notice-title">{title}</h2>
        <p class="notice-line">{line}</p>
      </div>
      <button class="notice-close" type="button" aria-label="Close" onClick={onClose}>
        ×
      </button>
    </section>
  );
}
