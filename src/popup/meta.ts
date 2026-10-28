import type { MethodId, Sect } from '../core/types';
import type { Settings } from '../settings/types';

/**
 * The method names, hints, region groups, sound labels and the browser name, shared by
 * the Settings method sheet and the first-run "Other methods" step. The strings are the
 * phone's own (Ali's words), kept verbatim, so both screens can never drift apart.
 */

// The method names and hints are the phone's own strings (Ali's words), kept verbatim.
export const METHOD_NAMES: Record<MethodId, string> = {
  moonsighting: 'Moonsighting Committee',
  'north-america': 'ISNA, North America',
  karachi: 'University of Karachi',
  mwl: 'Muslim World League',
  'umm-al-qura': 'Umm al-Qura, Makkah',
  egyptian: 'Egyptian General Authority',
  dubai: 'Dubai',
  kuwait: 'Kuwait',
  qatar: 'Qatar',
  turkey: 'Diyanet, Turkey',
  singapore: 'Kemenag & MUIS, Indonesia and Singapore',
  jafari: 'Jafari (Ithna Ashari)',
  tehran: 'Institute of Geophysics, Tehran',
};

export const METHOD_HINTS: Record<MethodId, string> = {
  mwl: 'A general convention used in many countries. The standard here.',
  egyptian: "Egypt's official method.",
  karachi: 'Common across Pakistan and South Asia.',
  'umm-al-qura': 'The official method in Saudi Arabia. Isha is set at a fixed time after Maghrib.',
  dubai: 'A convention used in the Gulf.',
  moonsighting: 'A seasonal rule made for places far from the equator. Followed by some mosques in Britain.',
  'north-america':
    'The Islamic Society of North America. Used by many mosques in the United States and Canada.',
  kuwait: 'The convention used in Kuwait.',
  qatar: 'The convention used in Qatar.',
  singapore: 'The official bodies of Indonesia and Singapore.',
  turkey: "Turkey's Presidency of Religious Affairs, with its precaution minutes.",
  jafari: "The usual Shia convention. Maghrib is a little after sunset, once the redness has left the sky.",
  tehran: "The University of Tehran, whose calendar Iran's official times follow.",
};

// PLAN 6.3 "Other methods": the region groups that the method sheet shows below the
// "Suggested for <country>" group. North America has no group of its own in the plan, so
// ISNA sits with the other western far-from-the-equator methods under Europe (D-034).
export const REGION_GROUPS: ReadonlyArray<{ title: string; methods: ReadonlyArray<MethodId> }> = [
  { title: 'Europe', methods: ['moonsighting', 'mwl', 'north-america', 'turkey'] },
  {
    title: 'Middle East and Africa',
    methods: ['umm-al-qura', 'egyptian', 'dubai', 'kuwait', 'qatar'],
  },
  { title: 'South and East Asia', methods: ['karachi', 'singapore'] },
  { title: 'Shia', methods: ['jafari', 'tehran'] },
];

export const SOUND_LABELS: Record<Settings['alerts']['sound'], string> = {
  beep: 'Soft beep',
  adhan: 'Adhan',
  silent: 'Silent',
};

export const SOUND_HINTS: Record<Settings['alerts']['sound'], string> = {
  beep: 'Short and gentle',
  adhan: 'The full call to prayer',
  silent: 'The message only',
};

export function browserName(): 'Edge' | 'Chrome' {
  const data = (navigator as unknown as { userAgentData?: { brands?: Array<{ brand: string }> } })
    .userAgentData;
  return data?.brands?.some((entry) => entry.brand === 'Microsoft Edge') ? 'Edge' : 'Chrome';
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
    groups.push({ title: 'Shia', methods: ['jafari', 'tehran'] });
    return groups;
  }
  const first = [suggested, ...alternatives].filter((method) => offered.includes(method));
  const shown = new Set<MethodId>(first);
  if (first.length > 0) {
    groups.push({ title: `Suggested for ${placeValue}`, methods: first });
  }
  for (const group of REGION_GROUPS) {
    if (group.title === 'Shia') continue;
    const rest = group.methods.filter((method) => offered.includes(method) && !shown.has(method));
    if (rest.length === 0) continue;
    for (const method of rest) shown.add(method);
    groups.push({ title: group.title, methods: rest });
  }
  return groups;
}
