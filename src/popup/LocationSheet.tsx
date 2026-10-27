import { useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { MAKKAH, placeFromBrowser, placeFromCity } from '../settings/place';
import type { Place } from '../settings/types';
import { CitySearch } from './CitySearch';

interface Props {
  current: Place | null;
  onClose: () => void;
  onSaved: (place: Place) => void;
}

export function LocationSheet({ current, onClose, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = navigator.language || 'en-GB';

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('This browser cannot read your location. Find a place below instead.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place = placeFromBrowser(
          position.coords.latitude,
          position.coords.longitude,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        );
        setBusy(false);
        onSaved(place);
      },
      () => {
        setBusy(false);
        setError('We could not read your location. Allow location for this browser, then try again, or find a place below.');
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  }

  return (
    <main class="sheet">
      <header class="sheet-head">
        <h1 class="sheet-title">Location</h1>
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
