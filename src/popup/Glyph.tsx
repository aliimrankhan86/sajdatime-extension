import type { PrayerSlot } from '../core/types';

const BASE = 1.8;
const STAR = 1.5;
const ASR_SHADOW = 3;

// Every path is the phone's own vector drawable pathData (24 by 24 viewport),
// stroke only, round caps and joins. Stroke widths are the phone's exact widths,
// not a uniform 2 px: asr has a heavier shadow line, isha a lighter star.
const PATHS: Record<PrayerSlot, Array<{ d: string; width?: number; opacity?: number }>> = {
  fajr: [
    { d: 'M3,16H21M12,6V9M6.3,8.8L7.9,10.4M17.7,8.8L16.1,10.4M3.5,12.5H5.5M18.5,12.5H20.5M8,20H16' },
  ],
  sunrise: [{ d: 'M3,19H21M7,19A5,5 0,0 1,17,19M12,3V10M9,6L12,3L15,6' }],
  dhuhr: [{ d: 'M15,6.5A3,3 0,1 1,9,6.5A3,3 0,1 1,15,6.5ZM4,21H20M12,21V15' }],
  asr: [
    { d: 'M8,6A2.5,2.5 0,1 1,3,6A2.5,2.5 0,1 1,8,6ZM3,20H21M10,20V13' },
    { d: 'M10,20H17', width: ASR_SHADOW, opacity: 0.55 },
  ],
  maghrib: [{ d: 'M3,19H21M7,19A5,5 0,0 1,17,19M12,3V10M9,7L12,10L15,7' }],
  isha: [
    { d: 'M17,16.5A7,7 0,0 1,8.5,6A7,7 0,1 0,17,16.5Z' },
    { d: 'M18,3.5V6.5M16.5,5H19.5', width: STAR },
  ],
};

export function Glyph({ slot, size = 20 }: { slot: PrayerSlot; size?: number }) {
  const paths = PATHS[slot];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((path) => (
        <path
          key={path.d}
          d={path.d}
          strokeWidth={path.width ?? BASE}
          opacity={path.opacity}
        />
      ))}
    </svg>
  );
}
