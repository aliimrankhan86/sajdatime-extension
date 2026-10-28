import { useEffect, useRef, useState } from 'preact/hooks';
import { countryName } from '../core/cities';
import { MAKKAH, placeFromCity, placeFromGeolocation } from '../settings/place';
import type { Place } from '../settings/types';
import { Brand } from './Brand';
import { CitySearch } from './CitySearch';
import { LocationFound } from './LocationFound';
import { t, localeTag } from '../i18n';

interface Props {
  current: Place | null;
  onClose: () => void;
  onSaved: (place: Place) => void;
}

export function LocationSheet({ current, onClose, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Place | null>(null);
  const locale = localeTag();
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (found) onSaved(found);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [found, onClose, onSaved]);

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError(t('firstRun.noLocation'));
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // placeFromGeolocation never rejects: when the city list will not load it falls
        // back to My location itself, so there is no error branch to show here.
        placeFromGeolocation(
          position.coords.latitude,
          position.coords.longitude,
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        ).then((place) => {
          setBusy(false);
          setFound(place);
        });
      },
      () => {
        setBusy(false);
        setError('We could not read your location. Allow location for this browser, then try again, or find a place below.');
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  }

  // Done saves and closes back to Settings. The header's close control and Escape commit
  // the found place the same way, so the confirmation cannot be thrown away by accident.
  if (found) {
    return (
      <main class="sheet">
        <Brand />
        <header class="sheet-head">
          <h1 class="sheet-title" ref={title} tabIndex={-1}>
            Location
          </h1>
          <button
            class="icon-button"
            type="button"
            aria-label={t('place.close')}
            onClick={() => onSaved(found)}
          >
            ×
          </button>
        </header>
        <LocationFound place={found} action={t('common.done')} onAction={() => onSaved(found)} />
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
        <button class="icon-button" type="button" aria-label={t('place.close')} onClick={onClose}>
          ×
        </button>
      </header>

      {current ? (
        <section class="current-place" aria-label={t('place.currentPlace')}>
          <p class="field-label">{t('place.timesFor')}</p>
          <p class="current-name">{current.name}</p>
          <p class="current-meta">
            {current.countryCode === 'ZZ'
              ? t('settings.fromThisComputer')
              : countryName(current.countryCode, locale)}
          </p>
        </section>
      ) : null}

      <button class="action" type="button" onClick={useMyLocation} disabled={busy}>
        {busy ? t('firstRun.finding') : t('firstRun.useLocation')}
      </button>
      <p class="field-hint">
        {t('location.browserNote')}
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
          {t('location.useMakkah')}
        </button>
      </div>
    </main>
  );
}
