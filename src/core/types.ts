/**
 * The words the rest of the extension uses for prayer times.
 *
 * A "slot" is one line on the Times screen. Sunrise is shown but is never a prayer:
 * it marks the end of Fajr and the start of the morning, so it is in `SLOTS` but not
 * in `PRAYERS`.
 */
export const SLOTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export type PrayerSlot = (typeof SLOTS)[number];

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export type Prayer = (typeof PRAYERS)[number];

export type Sect = 'sunni' | 'shia';

/** The two Asr schools adhan models. The other two Sunni schools use Shafi. */
export type Madhab = 'hanafi' | 'shafii';

/**
 * Stable storage identifiers. Never reuse one for a different method: a user's saved
 * settings survive updates, and a renamed id would silently change their times.
 */
export type MethodId =
  | 'moonsighting'
  | 'north-america'
  | 'karachi'
  | 'mwl'
  | 'umm-al-qura'
  | 'egyptian'
  | 'dubai'
  | 'kuwait'
  | 'qatar'
  | 'turkey'
  | 'singapore'
  | 'jafari'
  | 'tehran';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CalculationPrefs {
  method: MethodId;
  madhab: Madhab;
  /** IANA name, for example "Europe/London". Times are displayed in this zone. */
  timeZone: string;
  /** The user's Hijri shift, -2 to +2. Moves Ramadan and the Eid notices too. */
  hijriOffsetDays?: number;
  /** Minutes to move each time, -30 to +30. */
  adjustments?: Partial<Record<PrayerSlot, number>>;
}

export interface DayTimes {
  /** The civil date in `timeZone`, as YYYY-MM-DD. */
  date: string;
  times: Record<PrayerSlot, Date>;
  /**
   * True when the sun does not rise or set on this date. The six times are then
   * worked out from the nearest ordinary day; the Times screen says so in one line.
   */
  isPolar: boolean;
}

export interface NextPrayer {
  slot: Prayer;
  at: Date;
  /** True when the prayer falls on the next civil date in the place's zone. */
  isTomorrow: boolean;
}

export interface HijriDay {
  day: number;
  month: number;
  year: number;
}

export interface RamadanInfo {
  hijriYear: number;
  /** The Gregorian date on which this user's calendar reads 1 Ramadan. */
  firstDay: string;
  lastDay: string;
  length: number;
  /** 1 to `length` while today is inside Ramadan, otherwise null. */
  dayNumber: number | null;
}

export type Eid = 'fitr' | 'adha';
