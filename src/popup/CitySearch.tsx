import { useState } from 'preact/hooks';
import { countryName, CITY_SEARCH_LIMIT, loadCities, searchCities, type City } from '../core/cities';

interface Props {
  onPick: (city: City) => void;
  disabled?: boolean;
}

/**
 * An offline town search. The list is loaded only when the field is first used, so a
 * person who allows location never waits for three megabytes they do not need.
 */
export function CitySearch({ onPick, disabled = false }: Props) {
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
        setError('The town list could not be read. Try using your location instead.');
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
  const locale = navigator.language || 'en-GB';

  return (
    <div class="city-search">
      <label class="field-label" for="city-search">
        Or find a place
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
          ? 'Type one more letter.'
          : error
            ? error
            : loading
              ? 'Loading places...'
              : trimmed.length === 0
                ? 'Type the name of your town or city.'
                : results.length === 0
                  ? 'No place found. Try a larger town nearby.'
                  : results.length === 1
                    ? '1 place found.'
                    : hasMore
                      ? `Top ${CITY_SEARCH_LIMIT} places.`
                      : `${results.length} places found.`}
      </p>
      {results.length > 0 ? (
        <ul class="city-results" id="city-results" aria-label="Places found">
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
