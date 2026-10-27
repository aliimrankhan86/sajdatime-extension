import type { MethodId, Sect } from './types';

export type Confidence = 'high' | 'medium-high' | 'medium' | 'low';

export interface MethodSuggestion {
  suggested: MethodId;
  /** The other two when the country has no single standard; empty otherwise. */
  alternatives: MethodId[];
  confidence: Confidence;
}

const ONE_METHOD: Record<string, { method: MethodId; confidence: Confidence }> = {
  SA: { method: 'umm-al-qura', confidence: 'high' },
  EG: { method: 'egyptian', confidence: 'high' },
  PK: { method: 'karachi', confidence: 'high' },
  IN: { method: 'karachi', confidence: 'medium' },
  BD: { method: 'karachi', confidence: 'medium' },
  AF: { method: 'karachi', confidence: 'medium' },
  TR: { method: 'turkey', confidence: 'high' },
  SG: { method: 'singapore', confidence: 'high' },
  MY: { method: 'singapore', confidence: 'medium' },
  ID: { method: 'singapore', confidence: 'medium' },
  BN: { method: 'singapore', confidence: 'medium' },
  KW: { method: 'kuwait', confidence: 'medium-high' },
  QA: { method: 'qatar', confidence: 'medium-high' },
  AE: { method: 'dubai', confidence: 'medium' },
  BH: { method: 'qatar', confidence: 'low' },
  OM: { method: 'qatar', confidence: 'low' },
  DZ: { method: 'mwl', confidence: 'medium' },
  TN: { method: 'karachi', confidence: 'medium' },
};

const THREE_METHODS = new Set(['GB', 'IE', 'US', 'CA']);

const UK_SUGGESTION = {
  suggested: 'moonsighting' as MethodId,
  alternatives: ['north-america', 'karachi'] as MethodId[],
};
const REST_SUGGESTION = {
  suggested: 'mwl' as MethodId,
  alternatives: ['moonsighting', 'karachi'] as MethodId[],
};

/**
 * What to suggest, from the user's tradition and the country of the chosen place only.
 * Never from distance on a map: that is how Berlin, Sydney and Lagos get the wrong
 * method. The UK, Ireland, the US and Canada get three because their mosques genuinely
 * differ by how early Fajr begins.
 */
export function suggestMethod(countryCode: string, sect: Sect): MethodSuggestion {
  if (sect === 'shia') {
    return countryCode.toUpperCase() === 'IR'
      ? { suggested: 'tehran', alternatives: [], confidence: 'high' }
      : { suggested: 'jafari', alternatives: [], confidence: 'high' };
  }

  const country = countryCode.toUpperCase();
  const one = ONE_METHOD[country];
  if (one) return { suggested: one.method, alternatives: [], confidence: one.confidence };

  if (THREE_METHODS.has(country)) {
    return { ...UK_SUGGESTION, confidence: 'high' };
  }

  return { ...REST_SUGGESTION, confidence: 'medium' };
}
