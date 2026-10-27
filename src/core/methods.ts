import {
  CalculationMethod,
  CalculationParameters,
  HighLatitudeRule,
  Madhab as AdhanMadhab,
  PolarCircleResolution,
} from 'adhan';
import type { Madhab, MethodId } from './types';

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
 * The parameters for one method.
 *
 * adhan-js has no Jafari method. The phone builds it from `Other` with Fajr 16, Isha 14
 * and Maghrib at 4 degrees below the horizon. `CalculationParameters` applies
 * `maghribAngle` whenever it is above zero, which is exactly the Jafari rule.
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
      ? new CalculationParameters('Other', 16, 14, 0, 4)
      : ADHAN_METHODS[method]();

  // The two Shia methods use their own Asr rule, which is Shafi in adhan's terms. A Hanafi
  // choice from a Shia user would contradict the method, so the method wins.
  params.madhab =
    isShiaMethod(method) || madhab === 'shafii' ? AdhanMadhab.Shafi : AdhanMadhab.Hanafi;

  // A place inside the polar circle must never produce an invalid time. The Times
  // screen still says the sun does not rise or set there today.
  params.polarCircleResolution = PolarCircleResolution.AqrabYaum;

  if (method !== 'moonsighting') {
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  }

  return params;
}
