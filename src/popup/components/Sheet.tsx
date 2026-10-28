import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/**
 * A bottom-sheet style screen that replaces Settings while open. The title takes focus
 * first, Escape closes, and the foot carries a single solid "Done" (or "Close") action.
 * Focus moves back to the row that opened the sheet, which the caller does in onClose.
 */
interface SheetProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  /** The solid action at the foot. Defaults to "Done". */
  doneLabel?: string;
  /** Rendered instead of the foot, for sheets with no action (e.g. the method list). */
  noFoot?: boolean;
  /** A compact action in the header, beside the title (the Sound sheet's Play). */
  action?: ComponentChildren;
}

export function Sheet({ title, onClose, children, doneLabel = 'Done', noFoot = false, action }: SheetProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <main class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <header class="sheet-head">
        <h1 class="sheet-title" id="sheet-title" tabIndex={-1} ref={titleRef}>
          {title}
        </h1>
        {action ? <div class="sheet-action">{action}</div> : null}
        <button class="icon-button" type="button" aria-label="Close" onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>
      </header>
      {children}
      {noFoot ? null : (
        <footer class="sheet-foot">
          <button class="action" type="button" onClick={onClose}>
            {doneLabel}
          </button>
        </footer>
      )}
    </main>
  );
}
