import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  LANGUAGES,
  LANGUAGE_CHOICES,
  LANGUAGE_NAMES,
  RTL_LANGUAGES,
  applyDocumentLanguage,
  bundle,
  getLanguage,
  isRtl,
  keys,
  localeTag,
  resolveChoice,
  resolveLanguage,
  setLanguage,
  t,
} from '../../src/i18n';
import { firstSettings } from '../../src/settings/create';
import { isSettings, migrateSettings } from '../../src/settings/types';

/**
 * docs/PLAN.md section 10. Five languages, one key list.
 *
 * The words come from the phone app wherever a sentence already exists there, and the
 * disclaimer in particular must be the phone's own translated text: it is the one thing
 * in this project that is never rewritten by anybody, in any language. The tests below
 * hold the first paragraph and the closing dua against the phone's strings, so a later
 * edit to those two sentences has to be made on purpose, in both repositories.
 */

const LOCALES = ['en', 'ar', 'tr', 'id'] as const;

/** The phone's own opening sentence, from its translated string files. */
const PHONE_OPENING: Record<string, string> = {
  en: 'SajdaTime is a helper, not a religious authority.',
  ur: 'SajdaTime ایک مددگار ہے، کوئی دینی اتھارٹی نہیں۔',
  ar: 'SajdaTime مساعد، وليس مرجعًا دينيًا.',
  tr: 'SajdaTime bir yardımcıdır, dinî bir otorite değildir.',
  id: 'SajdaTime adalah alat bantu, bukan otoritas agama.',
};

/** The phone's closing dua, which stays the last paragraph and asks for nothing else. */
const PHONE_DUA: Record<string, string> = {
  en: 'And one request, if you would: please remember me, my family, and my parents in your duas.',
  ur: 'اور ایک گزارش، اگر آپ کر سکیں: براہِ کرم مجھے، میرے گھر والوں کو اور میرے والدین کو اپنی دعاؤں میں یاد رکھیں۔',
  ar: 'وطلب واحد، إن تكرّمت: أرجو أن تذكرني وعائلتي ووالديّ في دعائك.',
  tr: 'Bir de ricam var, uygun görürseniz: lütfen beni, ailemi ve anne babamı dualarınızda anın.',
  id: 'Dan satu permohonan, bila Anda berkenan: mohon ingat saya, keluarga saya, dan orang tua saya dalam doa-doa Anda.',
};

describe('translation files', () => {
  it('list the same keys in all five languages', () => {
    const english = keys();
    expect(english.length).toBeGreaterThan(200);
    for (const language of LANGUAGES) {
      expect(Object.keys(bundle(language)).sort()).toEqual([...english].sort());
    }
  });

  it('say something in every key of every language', () => {
    for (const language of LANGUAGES) {
      for (const [key, value] of Object.entries(bundle(language))) {
        expect(value.trim(), `${language} ${key}`).not.toBe('');
      }
    }
  });

  it('keeps every placeholder in every language, and no extra one', () => {
    for (const language of LANGUAGES) {
      for (const key of keys()) {
        const wanted = (bundle('en')[key] ?? '').match(/\{\w+\}/g) ?? [];
        const found = (bundle(language)[key] ?? '').match(/\{\w+\}/g) ?? [];
        expect([...found].sort(), `${language} ${key}`).toEqual([...wanted].sort());
      }
    }
  });

  it('keeps every sentence free of semicolons and dashes', () => {
    for (const language of LANGUAGES) {
      for (const [key, value] of Object.entries(bundle(language))) {
        expect(value, `${language} ${key}`).not.toMatch(/;|[–—]| - /);
      }
    }
  });
});

describe('the disclaimer in every language', () => {
  it('opens with the phone app sentence, unchanged', () => {
    for (const language of LANGUAGES) {
      expect(bundle(language)['disclaimer.full.1']).toBe(PHONE_OPENING[language] ?? '');
    }
  });

  it('ends with the phone app dua, unchanged, as the last paragraph', () => {
    for (const language of LANGUAGES) {
      const dua = PHONE_DUA[language] ?? '';
      expect(bundle(language)['disclaimer.full.6']).toBe(dua);
      expect((bundle(language)['disclaimer.short'] ?? '').endsWith(dua)).toBe(true);
    }
  });

  it('keeps six paragraphs, none empty, with the two mosque paragraphs', () => {
    for (const language of LANGUAGES) {
      for (let index = 1; index <= 6; index += 1) {
        expect((bundle(language)[`disclaimer.full.${index}`] ?? '').length).toBeGreaterThan(30);
      }
      expect(bundle(language)['disclaimer.full.4']).toMatch(/Isha|عشاء|العشاء|Yatsı|Isya/);
    }
  });
});

describe('choosing a language', () => {
  it('recognises each of the five and falls back to English', () => {
    expect(resolveLanguage('ur-PK')).toBe('ur');
    expect(resolveLanguage('ar')).toBe('ar');
    expect(resolveLanguage('tr-TR')).toBe('tr');
    expect(resolveLanguage('id-ID')).toBe('id');
    expect(resolveLanguage('en-GB')).toBe('en');
    expect(resolveLanguage('fr-FR')).toBe('en');
    expect(resolveLanguage(undefined)).toBe('en');
  });

  it('offers Computer language first, then the five in their own names', () => {
    expect(LANGUAGE_CHOICES[0]).toBe('auto');
    expect([...LANGUAGE_CHOICES].slice(1)).toEqual([...LANGUAGES]);
    expect(LANGUAGE_NAMES.ur).toBe('اردو');
    expect(LANGUAGE_NAMES.ar).toBe('العربية');
  });

  it('treats only Urdu and Arabic as right to left', () => {
    expect([...RTL_LANGUAGES]).toEqual(['ur', 'ar']);
    expect(isRtl('ur')).toBe(true);
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('tr')).toBe(false);
    expect(isRtl('id')).toBe(false);
    expect(isRtl('en')).toBe(false);
  });

  it('asks Arabic for Western digits and leaves the others as their tag', () => {
    expect(localeTag('ar')).toBe('ar-u-nu-latn');
    expect(localeTag('ur')).toBe('ur');
    expect(localeTag('id')).toBe('id');
  });
});

describe('the t helper', () => {
  it('fills placeholders and leaves an unknown one as written', () => {
    setLanguage('en');
    expect(t('times.ramadanBegins', { date: '8 February 2027' })).toBe(
      'Ramadan begins on 8 February 2027',
    );
    expect(t('common.continue', { nobody: 'x' })).toBe('Continue');
  });

  it('reads the language it was pointed at', () => {
    setLanguage('ur');
    expect(getLanguage()).toBe('ur');
    expect(t('common.continue')).toBe('جاری رکھیں');
    setLanguage('en');
    expect(t('common.continue')).toBe('Continue');
  });

  it('falls back to English, then to the key, so a screen cannot render empty', () => {
    setLanguage('en');
    expect(t('not.a.key')).toBe('not.a.key');
    setLanguage('tr');
    expect(t('not.a.key')).toBe('not.a.key');
    setLanguage('en');
  });

  it('resolves auto through the browser tag, and a named choice directly', () => {
    expect(resolveChoice('ur')).toBe('ur');
    expect(resolveChoice(undefined)).toBe(resolveLanguage(navigator.language));
  });
});

describe('the document language', () => {
  it('puts lang and dir on the root for each language', () => {
    const root = {
      lang: '',
      dir: '',
      dataset: {} as Record<string, string>,
    };
    const saved = (globalThis as { document?: unknown }).document;
    (globalThis as { document?: unknown }).document = { documentElement: root };
    try {
      applyDocumentLanguage('ur');
      expect(root.lang).toBe('ur');
      expect(root.dir).toBe('rtl');
      expect(root.dataset.language).toBe('ur');
      applyDocumentLanguage('tr');
      expect(root.dir).toBe('ltr');
      setLanguage('en');
    } finally {
      (globalThis as { document?: unknown }).document = saved;
    }
  });
});

describe('the stored language', () => {
  it('is part of a complete setting, and an unknown one is refused', () => {
    const place = {
      name: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      timeZone: 'Europe/London',
      countryCode: 'GB',
    };
    const settings = firstSettings(place);
    expect(settings.language).toBe('auto');
    expect(isSettings(settings)).toBe(true);
    expect(isSettings({ ...settings, language: 'fr' })).toBe(false);
    expect(isSettings({ ...settings, language: 'ur' })).toBe(true);
  });

  it('is added to settings written before the language shipped', () => {
    const place = {
      name: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      timeZone: 'Europe/London',
      countryCode: 'GB',
    };
    const older = { ...firstSettings(place) } as Record<string, unknown>;
    delete older.language;
    const migrated = migrateSettings(older) as Record<string, unknown>;
    expect(migrated.language).toBe('auto');
    expect(isSettings(migrated)).toBe(true);
  });
});

describe('the store listing name and description', () => {
  const localesDir = fileURLToPath(new URL('../../public/_locales/', import.meta.url));
  const read = (locale: string): { appName?: { message: string }; appDescription?: { message: string } } =>
    JSON.parse(readFileSync(`${localesDir}${locale}/messages.json`, 'utf8')) as {
      appName?: { message: string };
      appDescription?: { message: string };
    };

  it('names the extension the same way in every locale we ship', () => {
    for (const locale of LOCALES) {
      expect(read(locale).appName?.message).toBe('SajdaTime');
    }
  });

  it('keeps every description inside Chrome\u2019s 132 characters', () => {
    for (const locale of LOCALES) {
      const text = read(locale).appDescription?.message ?? '';
      expect(text.length).toBeGreaterThan(40);
      expect(text.length).toBeLessThanOrEqual(132);
    }
  });

  it('has no Urdu locale, because Chrome does not list Urdu', () => {
    expect(LOCALES).not.toContain('ur');
    expect(() => read('ur')).toThrow();
  });
});
