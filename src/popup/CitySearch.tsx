import { useState } from 'preact/hooks';
import { countryName, CITY_SEARCH_LIMIT, loadCities, searchCities, type City } from '../core/cities';
import { t, localeTag } from '../i18n';

interface Props {
  onPick: (city: City) => void;
  disabled?: boolean;
  /** The field label. The location sheet says t('place.findPlace'); first run says t('firstRun.orTypePlace'). */
  label?: string;
}

/**
 * An offline town search. The list is loaded only when the field is first used, so a
 * person who allows location never waits for three megabytes they do not need.
 */
export function CitySearch({ onPick, disabled = false, label = t('place.findPlace') }: Props) {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ensureLoaded() {
    if (cities || loading) return;
    setLoading(true);
    loadCities()
      .then((list) => {
        setCities(list);
        setLoading(false);
      })
      .catch(() => {
        setError(t('place.listMissing'));
        setLoading(false);
      });
  }

  function change(value: string) {
    setQuery(value);
    ensureLoaded();
  }

  const trimmed = query.trim();
  const found =
    cities && trimmed.length >= 2
      ? searchCities(cities, trimmed, CITY_SEARCH_LIMIT + 1)
      : [];
  const results = found.slice(0, CITY_SEARCH_LIMIT);
  const hasMore = found.length > CITY_SEARCH_LIMIT;
  const locale = localeTag();

  return (
    <div class="city-search">
      <label class="field-label" for="city-search">
        {label}
      </label>
      <input
        class="search-input"
        id="city-search"
        type="search"
        value={query}
        disabled={disabled}
        autocomplete="off"
        spellcheck={false}
        aria-controls={results.length > 0 ? 'city-results' : undefined}
        aria-describedby="city-hint"
        onFocus={ensureLoaded}
        onInput={(event) => change(event.currentTarget.value)}
      />
      <p class="field-hint" id="city-hint" role="status">
        {trimmed.length === 1
          ? t('common.oneMoreLetter')
          : error
            ? error
            : loading
              ? t('place.loading')
              : trimmed.length === 0
                ? t('firstRun.typePlace')
                : results.length === 0
                  ? t('place.none')
                  : results.length === 1
                    ? t('place.onePlace', { count: 1 })
                    : hasMore
                      ? `Top ${CITY_SEARCH_LIMIT} places.`
                      : t('place.manyPlaces', { count: results.length })}
      </p>
      {results.length > 0 ? (
        <ul class="city-results" id="city-results" aria-label={t('place.placesFound')}>
          {results.map((city) => (
            <li key={`${city.name}-${city.countryCode}-${city.latitude}-${city.longitude}`}>
              <button
                class="city-result"
                type="button"
                disabled={disabled}
                onClick={() => onPick(city)}
              >
                <span class="city-name">{city.name}</span>
                <span class="city-country">{countryName(city.countryCode, locale)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
