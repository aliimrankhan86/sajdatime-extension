import type { ComponentChildren } from 'preact';

/**
 * The Settings notice: a round mark, a title, one sentence, and an optional row of
 * solid buttons. Two tones: `warning` (amber) for the blocked-alerts notice, `quiet`
 * (soft green) for the browser-not-open notice. Settings notices have no close button and
 * stay until the condition they describe is fixed.
 *
 * Scoped with its own class names so it never inherits the dismissable Times notice's
 * top margin or its space reserved for a close button.
 */
interface NoticeProps {
  tone: 'warning' | 'quiet';
  title: string;
  line: string;
  details?: string;
  mark: ComponentChildren;
  children?: ComponentChildren;
}

export function Notice({ tone, title, line, details, mark, children }: NoticeProps) {
  return (
    <div class={`settings-notice settings-notice-${tone}`} role={tone === 'warning' ? 'alert' : undefined}>
      <span class="settings-notice-mark" aria-hidden="true">
        {mark}
      </span>
      <div class="settings-notice-body">
        <p class="settings-notice-title">{title}</p>
        <p class="settings-notice-line">{line}</p>
        {details ? <p class="settings-notice-details">{details}</p> : null}
        {children}
      </div>
    </div>
  );
}
