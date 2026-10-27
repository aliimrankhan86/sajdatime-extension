import {
  CalculationMethod,
  CalculationParameters,
  HighLatitudeRule,
  Madhab as AdhanMadhab,
  PolarCircleResolution,
  Rounding,
} from 'adhan';
import type { Madhab, MethodId, Sect } from './types';

/**
 * The 13 methods the extension offers, in the order the Settings sheet shows them.
 * The labels live in the message files, keyed by `method.<id>`, so the engine never
 * carries a translation.
 */
export const METHOD_IDS: readonly MethodId[] = [
  'moonsighting',
  'north-america',
  'karachi',
  'mwl',
  'umm-al-qura',
  'egyptian',
  'dubai',
  'kuwait',
  'qatar',
  'turkey',
  'singapore',
  'jafari',
  'tehran',
] as const;

const ADHAN_METHODS: Record<Exclude<MethodId, 'jafari'>, () => CalculationParameters> = {
  moonsighting: CalculationMethod.MoonsightingCommittee,
  'north-america': CalculationMethod.NorthAmerica,
  karachi: CalculationMethod.Karachi,
  mwl: CalculationMethod.MuslimWorldLeague,
  'umm-al-qura': CalculationMethod.UmmAlQura,
  egyptian: CalculationMethod.Egyptian,
  dubai: CalculationMethod.Dubai,
  kuwait: CalculationMethod.Kuwait,
  qatar: CalculationMethod.Qatar,
  turkey: CalculationMethod.Turkey,
  singapore: CalculationMethod.Singapore,
  tehran: CalculationMethod.Tehran,
};

export function isMethodId(value: unknown): value is MethodId {
  return typeof value === 'string' && (METHOD_IDS as readonly string[]).includes(value);
}

export function isShiaMethod(method: MethodId): boolean {
  return method === 'jafari' || method === 'tehran';
}

/**
 * Whether a method is one a user of [sect] should be offered at all. Jafari and Tehran
 * are Shia conventions (a Maghrib after sunset); the rest are Sunni. One definition,
 * used by the list the user picks from and by the School setter that has to discard a
 * method the new school was never offered, so the two cannot disagree. Mirrors the
 * phone's `CalcMethod.offeredTo`.
 */
export function isMethodOfferedTo(method: MethodId, sect: Sect): boolean {
  return sect === 'shia' ? isShiaMethod(method) : !isShiaMethod(method);
}

/** The methods the Settings list shows for [sect], in the same order as `METHOD_IDS`. */
export function methodsOfferedTo(sect: Sect): MethodId[] {
  return METHOD_IDS.filter((method) => isMethodOfferedTo(method, sect));
}

/**
 * The parameters for one method.
 *
 * adhan-js has no Jafari method. The phone builds it from `Other` with Fajr 16 and Isha 14.
 * The Shia Maghrib is not set here. adhan's `maghribAngle` also participates in the solar
 * day check, which would make a normal Oslo summer look like a broken polar day. The phone
 * keeps the main settings at sunset and computes the Shia Maghrib in a second pass. See
 * `computeDay` and DECISIONS D-002.
 *
 * The high latitude rule is the phone's TwilightAngle, not `recommended`. adhan-js applies
 * `recommended`'s one seventh of the night as a floor even when the angle is valid, which
 * would move London's 10 April Fajr from 04:11 to 04:50 and break the golden fixtures.
 * TwilightAngle uses the angle whenever it exists and only replaces it when the sun never
 * reaches it. That is the phone's shipped behaviour. See DECISIONS D-002.
 * Moonsighting Committee has its own seasonal rule and ignores the setting.
 */
export function parametersFor(method: MethodId, madhab: Madhab): CalculationParameters {
  const params =
    method === 'jafari'
      ? new CalculationParameters('Other', 16, 14)
      : ADHAN_METHODS[method]();

  // Tehran ships with a Maghrib angle. Clear it for the ordinary calculation: the day
  // check and the displayed sunset must both use the real sunset. The Shia Maghrib is
  // added separately in `computeDay`, exactly as the phone does it.
  if (isShiaMethod(method)) params.maghribAngle = 0;

  // The two Shia methods use their own Asr rule, which is Shafi in adhan's terms. A Hanafi
  // choice from a Shia user would contradict the method, so the method wins.
  params.madhab =
    isShiaMethod(method) || madhab === 'shafii' ? AdhanMadhab.Shafi : AdhanMadhab.Hanafi;

  // A place inside the polar circle must never produce an invalid time. The Times
  // screen still says the sun does not rise or set there today.
  params.polarCircleResolution = PolarCircleResolution.AqrabYaum;

  // adhan-java rounds every method to the nearest minute, but adhan-js sets Rounding.Up
  // for Singapore. Force nearest so the two libraries agree. See DECISIONS D-004.
  params.rounding = Rounding.Nearest;

  if (method !== 'moonsighting') {
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  }

  return params;
}
