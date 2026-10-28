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
 * hold every translated paragraph against the phone's own paragraph, with only the
 * rename from app to extension and from phone to computer allowed, so a later edit has
 * to be made on purpose, in both repositories.
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

/**
 * The phone's own six paragraphs, from `values-{ur,ar,tr,id}/strings.xml`, with its
 * fourth paragraph (the watch) left out. The extension may only rename itself and the
 * device: every other word has to be the phone's. `PHONE_SWAPS` is that rename, in
 * order, and the test applies it before comparing, so a change to the phone's wording
 * has to be copied here on purpose.
 */
const PHONE_FULL: Record<string, string[]> = {
  ur: [
    "SajdaTime ایک مددگار ہے، کوئی دینی اتھارٹی نہیں۔",
    "یہ اوقات مجھے کسی مسجد، کسی عالم یا کسی اتھارٹی نے نہیں دیے۔ آپ کا فون انہیں سورج کی پوزیشن سے نکالتا ہے، اور اس کے لیے حساب کے وہ طریقے استعمال کرتا ہے جو اسلامی اداروں اور علماء نے شائع کیے ہیں۔ میں نہ مفتی ہوں، نہ عالم، نہ فقہ کا ماہر، اور یہ ایپ مصنوعی ذہانت کی مدد سے بنائی گئی ہے۔ سافٹ ویئر میں خرابیاں ہو سکتی ہیں، فون میں غلط مقام یا غلط وقت ہو سکتا ہے، بیٹری بچاتے ہوئے فون کسی الرٹ میں تاخیر کر سکتا ہے، اور میں خود بھی غلط ہو سکتا ہوں۔",
    "اس لیے براہِ کرم جو کچھ آپ یہاں دیکھیں اسے ایک حساب سمجھیں، کوئی شرعی فیصلہ نہیں۔ جہاں SajdaTime اور آپ کی مسجد میں اختلاف ہو، وہاں اپنی مسجد کی پیروی کریں۔ اگر کوئی وقت یا سمت آپ کو غلط لگے، یا آپ کو یقین نہ ہو، تو اپنی مسجد سے یا کسی اور اہل شخص سے پوچھ لیں جو آپ کی رہنمائی کر سکے۔ یہ ایپ مفت ہے اور جیسی ہے ویسی ہی دی جا رہی ہے، کسی ضمانت اور درستگی کے کسی وعدے کے بغیر۔ اس لیے جہاں بالکل درست ہونا آپ کے لیے اہم ہو، وہاں براہِ کرم صرف اسی پر بھروسہ نہ کریں۔",
    "سب مساجد اس پر متفق نہیں کہ نماز کا وقت کب شروع ہوتا ہے۔ سب سے زیادہ فرق عشاء میں ہوتا ہے۔ برطانیہ میں اور اس سے آگے شمال میں ایک طریقے اور دوسرے کے درمیان فرق ایک گھنٹے سے زیادہ ہو سکتا ہے، کیونکہ علماء شفق کے ختم ہونے کو مختلف طرح سے ناپتے ہیں۔ میں یہ معاملہ طے نہیں کر سکتا، اور ایپ بھی اس کی کوشش نہیں کرتی۔ اگر یہاں کے اوقات آپ کی مسجد سے نہیں ملتے تو ان سے پوچھیں کہ وہ کون سا طریقہ استعمال کرتے ہیں، اور اسے ترتیبات میں “حساب کا طریقہ” کے تحت منتخب کریں۔ اگر اس کے بعد بھی چند منٹ کا فرق رہے تو “اپنی مسجد سے ملائیں” کے ذریعے آپ ہر نماز کو، اور تاریخ کو بھی، خود آگے پیچھے کر سکتے ہیں۔ جہاں پھر بھی فرق باقی رہے، وہاں اپنی مسجد کی پیروی کریں۔",
    "ایک بات اور۔ یہ ایپ بتاتی ہے کہ نماز کا وقت کب شروع ہوتا ہے۔ پھر آپ کی مسجد جماعت کا اپنا وقت مقرر کرتی ہے، جو عموماً تھوڑا بعد میں ہوتا ہے، اس لیے وہاں کے بورڈ اور یہاں کے اوقات میں اکثر فرق ہوگا۔ دونوں میں سے کوئی بھی غلط نہیں۔",
    "اور ایک گزارش، اگر آپ کر سکیں: براہِ کرم مجھے، میرے گھر والوں کو اور میرے والدین کو اپنی دعاؤں میں یاد رکھیں۔",
  ],
  ar: [
    "SajdaTime مساعد، وليس مرجعًا دينيًا.",
    "هذه الأوقات لم يعطني إياها مسجد ولا عالم ولا أي جهة. يحسبها هاتفك من موقع الشمس، مستخدمًا طرق حساب نشرتها هيئات إسلامية وعلماء. لست مفتيًا ولا عالمًا ولا خبيرًا في الفقه، وقد بُني هذا التطبيق بمساعدة الذكاء الاصطناعي. قد يحتوي البرنامج على أخطاء، وقد يحمل الهاتف موقعًا خاطئًا أو ساعة خاطئة، وقد يؤخر الهاتف تنبيهًا حين يوفّر البطارية، وقد أكون أنا مخطئًا.",
    "لذا أرجو أن تعدّ ما تراه هنا حسابًا لا حكمًا شرعيًا. وحيث يختلف SajdaTime ومسجدك، فاتبع مسجدك. إن بدا لك وقت أو اتجاه غير صحيح، أو لم تكن متأكدًا، فاسألهم أو اسأل شخصًا آخر مؤهلًا لينصحك. التطبيق مجاني ويُقدَّم كما هو، دون أي ضمان ودون أي وعد بالدقة، فحيث تهمّك الدقة التامة، أرجو ألا تعتمد عليه وحده.",
    "لا تتفق المساجد كلها على وقت بدء الصلاة. والعشاء أكثرها اختلافًا. وفي بريطانيا وما يقع شمالها قد يزيد الفرق بين طريقة وأخرى على ساعة، لأن العلماء يقيسون اختفاء الشفق بطرق مختلفة. لا أستطيع أن أحسم ذلك، ولا يحاول التطبيق ذلك. إن لم تطابق الأوقات هنا مسجدك، فاسألهم عن الطريقة التي يتبعونها واخترها في الإعدادات، تحت طريقة الحساب. وإن بقيت بينكما بضع دقائق بعد ذلك، فإن خيار «طابِق مسجدك» يتيح لك أن تعدّل كل صلاة، والتاريخ أيضًا، بيدك. وحيث يبقى اختلاف، فاتبع مسجدك.",
    "أمر أخير. يبيّن هذا التطبيق متى يدخل وقت الصلاة. ثم يحدد مسجدك وقته الخاص لصلاة الجماعة، وغالبًا ما يكون بعده بقليل، لذا سيختلف لوح المسجد عن الأوقات هنا في كثير من الأحيان. وليس أيٌّ منهما خاطئًا.",
    "وطلب واحد، إن تكرّمت: أرجو أن تذكرني وعائلتي ووالديّ في دعائك.",
  ],
  tr: [
    "SajdaTime bir yardımcıdır, dinî bir otorite değildir.",
    "Bu vakitler bana bir cami, bir âlim ya da herhangi bir otorite tarafından verilmedi. Telefonunuz bunları güneşin konumundan hesaplar. Bunu yaparken İslami otoritelerin ve âlimlerin yayımladığı hesaplama yöntemlerini kullanır. Ben bir müftü, bir âlim ya da fıkıh uzmanı değilim. Bu uygulama yapay zekâ yardımıyla yapıldı. Yazılımda hata olabilir. Telefonda yanlış konum ya da yanlış saat kayıtlı olabilir. Pil tasarrufu yapan bir telefon bir uyarıyı geciktirebilir. Ben de düpedüz yanılıyor olabilirim.",
    "Bu yüzden lütfen burada gördüklerinizi dinî bir hüküm olarak değil, bir hesaplama olarak kabul edin. SajdaTime ile caminiz farklı söylüyorsa caminize uyun. Bir vakit ya da yön size yanlış görünüyorsa veya emin değilseniz, caminize ya da size yol gösterebilecek ehil başka birine danışın. Uygulama ücretsizdir ve olduğu gibi sunulur. Hiçbir garanti ya da doğruluk vaadi yoktur. Bu yüzden tam doğruluğun sizin için önemli olduğu durumlarda lütfen yalnızca uygulamaya güvenmeyin.",
    "Camiler bir namazın ne zaman başladığı konusunda her zaman aynı görüşte değildir. En çok fark Yatsı vaktindedir. Britanya'da ve daha kuzeyde bir yöntemle diğeri arasındaki fark bir saati aşabilir, çünkü âlimler alacakaranlığın kayboluşunu farklı ölçer. Bu konuyu ben çözemem, uygulama da çözmeye çalışmaz. Buradaki vakitler caminizle uyuşmuyorsa, onlara hangi yöntemi kullandıklarını sorun ve Ayarlar bölümünde, Hesaplama yöntemi altında o yöntemi seçin. Bundan sonra da birkaç dakikalık fark kalırsa, Camiye göre ayarla bölümünde her vakti ve tarihi elle düzeltebilirsiniz. Bir fark yine kalırsa caminize uyun.",
    "Bir şey daha. Bu uygulama bir namaz vaktinin ne zaman girdiğini gösterir. Caminiz ise cemaat için kendi saatini belirler ve bu genellikle biraz daha geçtir. Bu yüzden camideki vakit çizelgesi ile buradaki vakitler çoğu zaman farklı olur. İkisi de yanlış değildir.",
    "Bir de ricam var, uygun görürseniz: lütfen beni, ailemi ve anne babamı dualarınızda anın.",
  ],
  id: [
    "SajdaTime adalah alat bantu, bukan otoritas agama.",
    "Waktu-waktu ini tidak diberikan kepada saya oleh masjid, ulama, atau otoritas mana pun. Ponsel Anda menghitungnya dari posisi matahari, dengan metode perhitungan yang diterbitkan oleh otoritas dan ulama Islam. Saya bukan mufti, bukan alim, dan bukan ahli fikih, dan aplikasi ini dibuat dengan bantuan kecerdasan buatan (AI). Perangkat lunak bisa mengandung kesalahan, ponsel bisa menyimpan lokasi atau jam yang salah, ponsel yang sedang menghemat baterai bisa menunda pengingat, dan saya pun bisa saja keliru.",
    "Jadi, mohon anggap apa yang Anda lihat di sini sebagai hasil perhitungan, bukan sebagai fatwa atau hukum. Jika SajdaTime dan masjid Anda berbeda, ikutilah masjid Anda. Jika suatu waktu atau arah tampak tidak tepat, atau Anda ragu, tanyakan kepada mereka atau kepada orang lain yang berwenang memberi nasihat. Aplikasi ini gratis dan diberikan apa adanya, tanpa jaminan apa pun dan tanpa janji ketepatan. Jadi, bila ketepatan penting bagi Anda, mohon jangan hanya mengandalkan aplikasi ini.",
    "Tidak semua masjid sepakat kapan waktu salat dimulai. Isya paling bervariasi. Di Inggris dan wilayah lebih ke utara, selisih antara satu metode dan lainnya bisa lebih dari satu jam, karena ulama mengukur memudarnya cahaya senja dengan cara berbeda. Saya tidak bisa memutuskan hal itu, dan aplikasi ini tidak mencoba memutuskannya. Jika waktu di sini tidak cocok dengan masjid Anda, tanyakan metode yang mereka pakai lalu pilih metode itu di Pengaturan, pada Metode perhitungan. Jika setelah itu masih ada selisih beberapa menit, Sesuaikan dengan masjid memungkinkan Anda mengatur setiap waktu salat, juga tanggalnya, secara manual. Jika masih ada perbedaan, ikutilah masjid Anda.",
    "Satu hal lagi. Aplikasi ini menunjukkan kapan waktu salat masuk. Masjid Anda lalu menentukan sendiri waktu salat berjamaahnya, biasanya sedikit lebih lambat, sehingga papan jadwal di sana dan waktu di sini sering berbeda. Keduanya tidak salah.",
    "Dan satu permohonan, bila Anda berkenan: mohon ingat saya, keluarga saya, dan orang tua saya dalam doa-doa Anda.",
  ],
};

/** Only these swaps separate the phone's disclaimer from the extension's. */
const PHONE_SWAPS: Record<string, Array<[string, string]>> = {
  ur: [["فون", "کمپیوٹر"], ["ایپ", "ایکسٹینشن"]],
  ar: [["الهاتف", "الحاسوب"], ["هاتفك", "حاسوبك"], ["بُني هذا التطبيق", "بُنيت هذه الإضافة"], ["ولا يحاول التطبيق", "ولا تحاول الإضافة"], ["التطبيق مجاني ويُقدَّم كما هو", "الإضافة مجانية وتُقدَّم كما هي"], ["ألا تعتمد عليه وحده", "ألا تعتمد عليها وحدها"], ["يبيّن هذا التطبيق", "تبيّن هذه الإضافة"]],
  tr: [["Telefonunuz", "Bilgisayarınız"], ["Telefonda", "Bilgisayarda"], ["bir telefon", "bir bilgisayar"], ["uygulama", "uzantı"], ["Uygulama", "Uzantı"]],
  id: [["Ponsel", "Komputer"], ["ponsel", "komputer"], ["aplikasi", "ekstensi"], ["Aplikasi", "Ekstensi"]],
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

  it("matches the phone paragraph for paragraph, after only the app and device rename", () => {
    for (const language of ['ur', 'ar', 'tr', 'id'] as const) {
      const phone = PHONE_FULL[language] ?? [];
      expect(phone).toHaveLength(6);
      for (let index = 0; index < phone.length; index += 1) {
        let expected = phone[index] ?? '';
        for (const [from, to] of PHONE_SWAPS[language] ?? []) {
          expected = expected.split(from).join(to);
        }
        expect(bundle(language)[`disclaimer.full.${index + 1}`], `${language} ${index + 1}`).toBe(
          expected,
        );
      }
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
