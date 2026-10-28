import { getLanguage, t } from '../i18n';
import type { MethodId, Sect } from '../core/types';
import type { Settings } from '../settings/types';

/**
 * The method names, hints, region groups, sound labels and the browser name, shared by
 * the Settings method sheet and the first-run "Other methods" step. The strings are the
 * phone's own (Ali's words), copied into the language files, so both screens can never
 * drift apart.
 *
 * Everything here is a function rather than a constant: a constant object would be filled
 * in once, at module load, and would still speak the first language after a change
 * (PLAN.md section 10).
 */

/**
 * The method ids do not spell themselves into keys safely: `north-america` and
 * `umm-al-qura` carry hyphens, and a flat `method.north-america` key is legal JSON but
 * hard to read beside `method.mwl`. One table, so a new method cannot half-appear.
 */
const METHOD_KEY: Record<MethodId, string> = {
  moonsighting: 'moonsighting',
  'north-america': 'northAmerica',
  karachi: 'karachi',
  mwl: 'mwl',
  'umm-al-qura': 'ummAlQura',
  egyptian: 'egyptian',
  dubai: 'dubai',
  kuwait: 'kuwait',
  qatar: 'qatar',
  turkey: 'turkey',
  singapore: 'singapore',
  jafari: 'jafari',
  tehran: 'tehran',
};

/** Every method, in the order the method tables list them. */
export const METHOD_IDS: readonly MethodId[] = Object.keys(METHOD_KEY) as MethodId[];

export function methodName(method: MethodId): string {
  return t(`method.${METHOD_KEY[method]}`);
}

export function methodHint(method: MethodId): string {
  return t(`methodHint.${METHOD_KEY[method]}`);
}

export function soundLabel(sound: Settings['alerts']['sound']): string {
  return t(`sound.${sound}`);
}

export function soundHint(sound: Settings['alerts']['sound']): string {
  return t(`sound.${sound}Hint`);
}

/** The three regions below "Suggested for", in the order the method sheet shows them. */
export type RegionId = 'europe' | 'middleEast' | 'asia' | 'shia';

// PLAN 6.3 "Other methods": the region groups that the method sheet shows below the
// "Suggested for <country>" group. North America has no group of its own in the plan, so
// ISNA sits with the other western far-from-the-equator methods under Europe (D-034).
export const REGION_GROUPS: ReadonlyArray<{ id: RegionId; methods: ReadonlyArray<MethodId> }> = [
  { id: 'europe', methods: ['moonsighting', 'mwl', 'north-america', 'turkey'] },
  {
    id: 'middleEast',
    methods: ['umm-al-qura', 'egyptian', 'dubai', 'kuwait', 'qatar'],
  },
  { id: 'asia', methods: ['karachi', 'singapore'] },
  { id: 'shia', methods: ['jafari', 'tehran'] },
];

export function regionTitle(id: RegionId): string {
  return t(`region.${id}`);
}

export function browserName(): 'Edge' | 'Chrome' {
  const data = (navigator as unknown as { userAgentData?: { brands?: Array<{ brand: string }> } })
    .userAgentData;
  return data?.brands?.some((entry) => entry.brand === 'Microsoft Edge') ? 'Edge' : 'Chrome';
}

/**
 * The country names that English puts "the" before when the name sits inside a sentence
 * ("Suggested for the United Kingdom") but not when the name stands alone ("United
 * Kingdom"). Ali's Step 8 review, 28 October 2026. The set holds the names `Intl` gives
 * for those codes in English, lowercased.
 */
const COUNTRIES_WITH_THE: ReadonlySet<string> = new Set([
  'united kingdom',
  'united states',
  'united arab emirates',
  'netherlands',
  'philippines',
  'czech republic',
  'maldives',
  'bahamas',
  'gambia',
  'central african republic',
  'dominican republic',
  'comoros',
]);

/**
 * A country name as it reads inside a sentence: "the Netherlands", "the United Kingdom",
 * but "Pakistan" and "Saudi Arabia" bare. Use it wherever a country sits inside a
 * sentence, and never for a line that is only the name. Safe to call twice, so a name
 * that already carries "the" is left alone. Only English needs this: the other four
 * languages have no word for "the" in front of a country.
 */
export function countryInSentence(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return trimmed;
  if (getLanguage() !== 'en') return trimmed;
  return COUNTRIES_WITH_THE.has(trimmed.toLowerCase()) ? `the ${trimmed}` : trimmed;
}

/**
 * The "Other methods" list, grouped the same way the Settings method sheet does. The
 * suggested methods form the first group and are left out of the region groups below,
 * so the UK does not see Moonsighting, ISNA and Karachi twice. A Sunni list never
 * reaches the Shia group; Shia gets the Shia group alone. PLAN 6.3 and D-034.
 */
export function methodGroupsFor(
  sect: Sect,
  suggested: MethodId,
  alternatives: ReadonlyArray<MethodId>,
  offered: ReadonlyArray<MethodId>,
  placeValue: string,
): Array<{ title: string; methods: ReadonlyArray<MethodId> }> {
  const groups: Array<{ title: string; methods: ReadonlyArray<MethodId> }> = [];
  if (sect === 'shia') {
    groups.push({ title: regionTitle('shia'), methods: ['jafari', 'tehran'] });
    return groups;
  }
  const first = [suggested, ...alternatives].filter((method) => offered.includes(method));
  const shown = new Set<MethodId>(first);
  if (first.length > 0) {
    // A country inside a sentence takes "the" where English wants it (D-039).
    groups.push({
      title: t('method.suggestedFor', { country: countryInSentence(placeValue) }),
      methods: first,
    });
  }
  for (const group of REGION_GROUPS) {
    if (group.id === 'shia') continue;
    const rest = group.methods.filter((method) => offered.includes(method) && !shown.has(method));
    if (rest.length === 0) continue;
    for (const method of rest) shown.add(method);
    groups.push({ title: regionTitle(group.id), methods: rest });
  }
  return groups;
}
