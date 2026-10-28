/**
 * The disclaimer in its two forms. The short one is the four substance points plus the
 * dua, shown on the first-run disclaimer step and in the Settings disclaimer sheet. The
 * full one is the phone's own text adapted for the extension: the watch paragraph is
 * dropped (there is no watch), "app" becomes "extension", "phone" becomes "computer",
 * the Qibla mention goes (there is no Qibla), and the per-prayer "Match your mosque"
 * minutes clause is held back until that feature ships. Neither may ever be removed,
 * softened or hidden (docs/SECURITY.md, docs/UX-PLAN.md).
 */

export const SHORT_DISCLAIMER =
  'SajdaTime is a helper, not a religious authority. These times are worked out on this ' +
  'computer from the position of the sun, using published calculation methods. They are ' +
  'not given by a mosque, a scholar, or any authority. I am not a Mufti, an Aalim, or an ' +
  'expert in fiqh, and this extension was built with the help of artificial intelligence. ' +
  'Software can carry faults, the computer can hold the wrong place or the wrong clock, ' +
  'and I can be wrong. Take what you see as a calculation, not a ruling. Where SajdaTime ' +
  'and your mosque disagree, follow your mosque. If something looks wrong or you are ' +
  'unsure, ask someone qualified. SajdaTime is free and given as it is, with no warranty ' +
  'and no promise of accuracy. Please remember me, my family, and my parents in your duas.';

/** Paragraphs, in order. The dua is the last paragraph and lives only here. */
export const FULL_DISCLAIMER: string[] = [
  'SajdaTime is a helper, not a religious authority.',
  'These times are not given to me by a mosque, a scholar, or any authority. Your computer ' +
    'works them out from the position of the sun, using calculation methods that Islamic ' +
    'authorities and scholars have published. I am not a Mufti, Aalim, or an expert in fiqh, ' +
    'and this extension was built with the help of artificial intelligence. Software can carry ' +
    'faults, a computer can hold the wrong location or the wrong clock, a closed browser or a ' +
    'sleeping computer can delay an alert, and I can simply be wrong.',
  'So please take what you see here as a calculation and not a ruling. Where SajdaTime and ' +
    'your mosque disagree, follow your mosque. If a time looks off to you, or you are unsure, ' +
    'ask them or someone else qualified to advise you. The extension is free and is given as ' +
    'it is, with no warranty and no promise of accuracy, so where being exact matters to you, ' +
    'please do not rely on it alone.',
  'Mosques do not all agree on when a prayer starts. Isha varies the most. In Britain and ' +
    'further north the gap between one method and another can be over an hour, because ' +
    'scholars measure the fading of the twilight differently. I cannot settle that, and the ' +
    'extension does not try to. If the times here do not match your mosque, ask them which ' +
    'method they use and pick it in Settings, under Calculation method. Where a difference ' +
    'remains, follow your mosque.',
  'One more thing. This extension shows when a prayer becomes due. Your mosque then sets its ' +
    'own time for the congregation, usually a little later, so the board there and the times ' +
    'here will often differ. Neither is wrong.',
  'And one request, if you would: please remember me, my family, and my parents in your duas.',
];
