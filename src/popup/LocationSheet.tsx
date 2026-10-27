import { useEffect, useRef, useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { MAKKAH, placeFromCity, placeFromGeolocation } from '../settings/place';
import type { Place } from '../settings/types';
import { Brand } from './Brand';
import { CitySearch } from './CitySearch';
import { LocationFound } from './LocationFound';

interface Props {
  current: Place | null;
  onClose: () => void;
  onSaved: (place: Place) => void;
}

export function LocationSheet({ current, onClose, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Place | null>(null);
  const locale = navigator.language || 'en-GB';
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('This browser cannot read your location. Find a place below instead.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        placeFromGeolocation(
          position.coords.latitude,
          position.coords.longitude,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        )
          .then((place) => {
            setBusy(false);
            setFound(place);
          })
          .catch(() => {
            setBusy(false);
            setError('We could not read your location. Allow location for this browser, then try again, or find a place below.');
          });
      },
      () => {
        setBusy(false);
        setError('We could not read your location. Allow location for this browser, then try again, or find a place below.');
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  }

  // Done saves and closes back to Settings. The header stays, so the close control and
  // Escape still work while the confirmation is showing.
  if (found) {
    return (
      <main class="sheet">
        <Brand />
        <header class="sheet-head">
          <h1 class="sheet-title" ref={title} tabIndex={-1}>
            Location
          </h1>
          <button class="icon-button" type="button" aria-label="Close location" onClick={onClose}>
            ×
          </button>
        </header>
        <LocationFound place={found} action="Done" onAction={() => onSaved(found)} />
      </main>
    );
  }

  return (
    <main class="sheet">
      <Brand />
      <header class="sheet-head">
        <h1 class="sheet-title" ref={title} tabIndex={-1}>
          Location
        </h1>
        <button class="icon-button" type="button" aria-label="Close location" onClick={onClose}>
          ×
        </button>
      </header>

      {current ? (
        <section class="current-place" aria-label="Current place">
          <p class="field-label">Times are for</p>
          <p class="current-name">{current.name}</p>
          <p class="current-meta">
            {current.countryCode === 'ZZ'
              ? 'From this computer'
              : countryName(current.countryCode, locale)}
          </p>
        </section>
      ) : null}

      <button class="action" type="button" onClick={useMyLocation} disabled={busy}>
        {busy ? 'Finding your place...' : 'Use my location'}
      </button>
      <p class="field-hint">
        Your browser asks its location service. SajdaTime only receives the coordinates.
      </p>

      {error ? (
        <p class="error" role="alert">
          {error}
        </p>
      ) : null}

      <CitySearch
        onPick={(city) => {
          onSaved(placeFromCity(city));
        }}
        disabled={busy}
      />

      <div class="sheet-foot">
        <button class="action action-small" type="button" onClick={() => onSaved(MAKKAH)} disabled={busy}>
          Use Makkah instead
        </button>
      </div>
    </main>
  );
}
