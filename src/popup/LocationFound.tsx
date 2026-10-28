import { useEffect, useRef } from 'preact/hooks';
import { countryName } from '../core/cities';
import type { Place } from '../settings/types';
import { t, localeTag } from '../i18n';

interface Props {
  place: Place;
  /**
   * The one action this panel offers: Continue on first run, Done in Settings. It is the
   * translated label itself, because a union of two translated strings would change with
   * the language.
   */
  action: string;
  onAction: () => void;
}

/**
 * The answer to "Use my location": the town the browser was near, said plainly, before
 * the user is taken on. It replaces the location controls rather than sitting beside
 * them, so there is one thing to read and one thing to press.
 *
 * The whole panel is a status region, so a screen reader announces the heading and the
 * place as soon as it appears, and focus is moved to its only button.
 */
export function LocationFound({ place, action, onAction }: Props) {
  const button = useRef<HTMLButtonElement>(null);
  const locale = localeTag();

  useEffect(() => {
    button.current?.focus();
  }, []);

  return (
    <section class="location-found" role="status">
      <svg
        class="location-found-icon"
        viewBox="0 0 32 32"
        width="32"
        height="32"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" stroke-width="2" />
        <path
          d="M9.5 16.5 L14 21 L22.5 11.5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <h2 class="location-found-title">{t('place.found')}</h2>
      <p class="location-found-place">
        {place.name}, {countryName(place.countryCode, locale)}
      </p>
      <p class="location-found-note">{t('place.foundNote')}</p>
      <button class="action" type="button" ref={button} onClick={onAction}>
        {action}
      </button>
    </section>
  );
}
