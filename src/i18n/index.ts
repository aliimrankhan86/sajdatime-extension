import ar from './ar.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };
import id from './id.json' with { type: 'json' };
import tr from './tr.json' with { type: 'json' };
import ur from './ur.json' with { type: 'json' };

/**
 * The five languages the extension speaks, and the only place a language is named.
 *
 * PLAN.md section 10: English, Urdu, Arabic, Turkish and Indonesian, each named in its own
 * script in the picker, with the computer's own language first when it is one of the five.
 * The phone app carries the same five, so the words here are copied from its `values-ur`,
 * `values-ar`, `values-tr` and `values-in` wherever the sentence exists there, and
 * `docs/TRANSLATIONS-NEW.md` lists every sentence that is new to the extension.
 *
 * There is no i18n library. A flat JSON file per language and a `{name}` substitution is
 * all five languages need, and the brief forbids new dependencies. The key list is checked
 * by `tests/unit/i18n.test.ts`, which fails if a language is missing a key, if a value is
 * empty, or if a placeholder differs between languages.
 */

export type Language = 'en' | 'ar' | 'id' | 'tr' | 'ur';

/**
 * What the settings store: one of the five, or `auto` for "Computer language", which is
 * the default and follows the browser until the user picks a language by name.
 */
export type LanguageChoice = 'auto' | Language;

/** The picker's order, and the order the brief lists them in. */
export const LANGUAGES: readonly Language[] = ['en', 'ur', 'ar', 'tr', 'id'];

/** Each language in its own script, which is how the picker shows it. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ur: 'اردو',
  ar: 'العربية',
  tr: 'Türkçe',
  id: 'Bahasa Indonesia',
};

/** The picker's rows, "Computer language" first (PLAN.md section 10). */
export const LANGUAGE_CHOICES: readonly LanguageChoice[] = ['auto', ...LANGUAGES];

/** Right to left is a property of the writing system, not of the language choice. */
export const RTL_LANGUAGES: readonly Language[] = ['ur', 'ar'];

const BUNDLES: Record<Language, Record<string, string>> = { en, ur, ar, tr, id };

let current: Language = 'en';

/** A browser tag like `ur-PK` or `ar-EG` as one of the five, or English. */
export function resolveLanguage(tag: string | null | undefined): Language {
  const base = (tag ?? '').toLowerCase().split('-')[0] ?? '';
  return (LANGUAGES as readonly string[]).includes(base) ? (base as Language) : 'en';
}

/**
 * The language every `t()` call reads. Set once per screen, before it renders, from the
 * saved setting: the popup is one page, so there is only ever one screen talking.
 */
export function resolveChoice(choice: LanguageChoice | undefined): Language {
  if (choice && choice !== 'auto') return choice;
  return resolveLanguage(navigator.language);
}

/**
 * Point the screens at the saved choice. Every entry point calls this as soon as the
 * settings are read, so no screen ever renders in the previous language.
 */
export function setLanguage(choice: LanguageChoice | Language | undefined): void {
  current = resolveChoice(choice as LanguageChoice | undefined);
}

export function getLanguage(): Language {
  return current;
}

export function isRtl(language: Language = current): boolean {
  return RTL_LANGUAGES.includes(language);
}

/**
 * The tag to hand to `Intl`. Arabic asks for Latin digits (`ar-u-nu-latn`), the same choice
 * the phone makes in `AppLocale`: Arabic phones otherwise default to Arabic-Indic digits,
 * and the times in a table must line up whatever the language.
 */
export function localeTag(language: Language = current): string {
  if (language === 'ar') return 'ar-u-nu-latn';
  // English keeps whatever the browser is set to, so an en-GB computer still sees the
  // 24 hour clock and "Tuesday 27 October" it saw before the languages shipped. The other
  // four name their own tag, because that is where the month and day names come from.
  if (language === 'en') return navigator.language || 'en-GB';
  return language;
}

/**
 * A string in the current language. A missing key falls back to English and then to the
 * key itself, so a screen can never render empty. `{name}` placeholders are filled from
 * `params`; a placeholder with no value is left as written, which the tests catch.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const text = BUNDLES[current][key] ?? BUNDLES.en[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : whole,
  );
}

/**
 * Put the language on the document: `lang` for the screen reader and the font stack, `dir`
 * for the layout. Both live on `<html>` so a sheet that renders into a portal still reads
 * right to left. Called from a layout effect, once per screen, after paint.
 */
export function applyDocumentLanguage(language: Language = current): void {
  const root = document.documentElement;
  root.lang = language;
  root.dir = isRtl(language) ? 'rtl' : 'ltr';
  root.dataset.language = language;
}

/**
 * Language plus direction in one call, for the entry points that own a document: the
 * popup and the printable page. Background code only needs `setLanguage`, because a
 * service worker has no document to set attributes on.
 */
export function applyLanguage(choice: LanguageChoice | Language | undefined): void {
  setLanguage(choice);
  applyDocumentLanguage(current);
}

/** Every key in the English file, for the tests and the translation check. */
export function keys(): string[] {
  return Object.keys(BUNDLES.en);
}

/** The bundle for a language, so a test can read the stored words themselves. */
export function bundle(language: Language): Record<string, string> {
  return BUNDLES[language];
}
