# Every sentence in the extension, in five languages

**Written:** 28 October 2026, Europe/London.

This is the table PLAN.md section 10 asks for. Every key in `src/i18n/en.json` appears once, with
the same key in Urdu, Arabic, Turkish and Indonesian beside it, so a reader can compare a sentence
across all five without opening five files.

**Where the words come from.** Prayer names, the Asr school names, the calculation method names, the
Hijri month names and the whole religious disclaimer are the phone app's own translated strings, copied
from `values-ur`, `values-ar`, `values-tr` and `values-in` in `~/Developer/SajdaTime`, which is read
only for this work. Nothing of that content was invented here. The disclaimer's opening sentence and
its closing dua are held against the phone's strings by `tests/unit/i18n.test.ts`, so an edit to either
has to be made on purpose, in both repositories.

The sentences that exist only in the extension — the printable page, the first run's own copy, the
Settings rows, the notices and the spoken labels — are translated here for the first time. They are
listed in this table without a mark of their own, because the table is complete: anything Ali wants to
read in any language is in it.

**No native speaker has read these yet.** That is the owner's standing decision of 9 October 2026 for
the phone app, and it carries here. Nothing anywhere in the product says a translation is waiting for
review, and no user is ever asked to check one.

**Rules kept in every language.** Sentence case. No semicolons, no em dashes, no spaced hyphens (the
banned-word test scans them, and a unit test scans the translation files too). Islamic words stay as
they are: Fajr, Dhuhr, Asr, Maghrib, Isha, Suhoor, Iftar, dua, madhab, mosque. The religious
disclaimer is never shortened, softened or moved.

## The table

| Key | English | اردو | العربية | Türkçe | Bahasa Indonesia |
| --- | --- | --- | --- | --- | --- |
| `app.loading` | Loading SajdaTime... | SajdaTime لوڈ ہو رہا ہے... | جارٍ تحميل SajdaTime... | SajdaTime yükleniyor... | Memuat SajdaTime... |
| `common.continue` | Continue | جاری رکھیں | متابعة | Devam | Lanjut |
| `common.back` | Back | واپس | رجوع | Geri | Kembali |
| `common.done` | Done | ہو گیا | تم | Tamam | Selesai |
| `common.close` | Close | بند کریں | إغلاق | Kapat | Tutup |
| `common.finish` | Finish | مکمل کریں | إنهاء | Bitir | Selesai |
| `common.begin` | Begin | شروع کریں | ابدأ | Başla | Mulai |
| `common.settings` | Settings | ترتیبات | الإعدادات | Ayarlar | Pengaturan |
| `common.play` | Play | سنیں | تشغيل | Dinle | Putar |
| `common.stop` | Stop | روکیں | إيقاف | Durdur | Hentikan |
| `common.change` | Change | تبدیل کریں | تغيير | Değiştir | Ubah |
| `common.off` | Off | بند | متوقف | Kapalı | Mati |
| `common.next` | Next | اگلا | التالي | Sonraki | Berikutnya |
| `common.now` | Now | اب | الآن | Şimdi | Sekarang |
| `common.language` | Language | زبان | اللغة | Dil | Bahasa |
| `common.computerLanguage` | Computer language | کمپیوٹر کی زبان | لغة الحاسوب | Bilgisayarın dili | Bahasa komputer |
| `common.readInFull` | Read in full | پوری پڑھیں | اقرأ النص كاملًا | Tamamını oku | Baca selengkapnya |
| `common.oneMoreLetter` | Type one more letter. | ایک حرف مزید لکھیں۔ | اكتب حرفًا آخر. | Bir harf daha yazın. | Ketik satu huruf lagi. |
| `common.saveError` | Your settings could not be saved. Try again. | آپ کی ترتیبات محفوظ نہیں ہو سکیں۔ دوبارہ کوشش کریں۔ | لم نتمكن من حفظ إعداداتك. حاول مرة أخرى. | Ayarlarınız kaydedilemedi. Tekrar deneyin. | Pengaturan Anda tidak dapat disimpan. Coba lagi. |
| `unit.hour` | {count} hour | {count} گھنٹہ | {count} ساعة | {count} saat | {count} jam |
| `unit.hours` | {count} hours | {count} گھنٹے | {count} ساعات | {count} saat | {count} jam |
| `unit.minute` | {count} minute | {count} منٹ | {count} دقيقة | {count} dakika | {count} menit |
| `unit.minutes` | {count} minutes | {count} منٹ | {count} دقائق | {count} dakika | {count} menit |
| `unit.second` | {count} second | {count} سیکنڈ | {count} ثانية | {count} saniye | {count} detik |
| `unit.seconds` | {count} seconds | {count} سیکنڈ | {count} ثوانٍ | {count} saniye | {count} detik |
| `times.nextPrayer` | Next prayer | اگلی نماز | الصلاة التالية | Sıradaki vakit | Salat berikutnya |
| `times.nextPrayerTomorrow` | Next prayer, tomorrow | اگلی نماز، کل | الصلاة التالية، غدًا | Sıradaki vakit, yarın | Salat berikutnya, besok |
| `times.today` | Today's prayer times | آج کے اوقاتِ نماز | أوقات صلاة اليوم | Bugünün namaz vakitleri | Waktu salat hari ini |
| `times.unavailable` | Times are not available for this place. | اس مقام کے اوقات دستیاب نہیں ہیں۔ | أوقات الصلاة غير متاحة لهذا المكان. | Bu yer için vakitler yok. | Waktu salat tidak tersedia untuk tempat ini. |
| `times.badPlace` | The location saved for SajdaTime cannot be used. Set your place again. | SajdaTime کے لیے محفوظ مقام استعمال نہیں ہو سکتا۔ اپنا مقام دوبارہ مقرر کریں۔ | الموقع المحفوظ لـ SajdaTime غير صالح. حدّد مكانك من جديد. | SajdaTime için kayıtlı konum kullanılamıyor. Yerinizi yeniden belirleyin. | Lokasi yang tersimpan untuk SajdaTime tidak dapat dipakai. Tentukan tempat Anda lagi. |
| `times.untilBegins` | until it begins | شروع ہونے تک | حتى يدخل وقتها | başlayana kadar | sampai masuk waktunya |
| `times.untilSuhoor` | until suhoor ends | سحری ختم ہونے تک | حتى ينتهي السحور | sahur bitene kadar | sampai sahur berakhir |
| `times.untilIftar` | until you break your fast | روزہ افطار کرنے تک | حتى تفطر | iftara kadar | sampai berbuka |
| `times.ramadanComing` | From the first day, the Ramadan card shows suhoor and iftar times here. You can turn it off in Settings. | پہلے دن سے رمضان کارڈ یہاں سحری اور افطار کے اوقات دکھاتا ہے۔ آپ اسے ترتیبات میں بند کر سکتے ہیں۔ | من اليوم الأول تعرض بطاقة رمضان هنا أوقات السحور والإفطار. يمكنك إيقافها من الإعدادات. | İlk günden itibaren ramazan kartı burada sahur ve iftar vakitlerini gösterir. Ayarlardan kapatabilirsiniz. | Mulai hari pertama, kartu ramadan menampilkan waktu sahur dan berbuka di sini. Anda dapat mematikannya di Pengaturan. |
| `times.eid` | Eid Mubarak | عید مبارک | عيد مبارك | Bayram mübarek olsun | Selamat Idulfitri |
| `times.eidNote` | Follow your mosque for the date of Eid. | عید کی تاریخ کے لیے اپنی مسجد کی پیروی کریں۔ | اتبع مسجدك في تاريخ العيد. | Bayram tarihi için caminize uyun. | Ikuti masjid Anda untuk tanggal Idulfitri. |
| `times.footerNote` | Worked out on this computer. No ads. | اسی کمپیوٹر پر حساب کیا گیا۔ کوئی اشتہار نہیں۔ | حُسبت على هذا الحاسوب. بلا إعلانات. | Bu bilgisayarda hesaplandı. Reklam yok. | Dihitung di komputer ini. Tanpa iklan. |
| `times.savePdf` | Save as PDF | PDF محفوظ کریں | حفظ بصيغة PDF | PDF olarak kaydet | Simpan sebagai PDF |
| `slot.fajr` | Fajr | فجر | الفجر | Sabah | Subuh |
| `slot.sunrise` | Sunrise | طلوعِ آفتاب | الشروق | Güneş | Terbit |
| `slot.dhuhr` | Dhuhr | ظہر | الظهر | Öğle | Zuhur |
| `slot.asr` | Asr | عصر | العصر | İkindi | Asar |
| `slot.maghrib` | Maghrib | مغرب | المغرب | Akşam | Magrib |
| `slot.isha` | Isha | عشاء | العشاء | Yatsı | Isya |
| `slot.suhoor` | Suhoor ends | سحری کا اختتام | نهاية السحور | Sahur bitişi | Sahur berakhir |
| `slot.iftar` | Iftar | افطار | الإفطار | İftar | Buka puasa |
| `hijri.1` | Muharram | محرم | محرم | Muharrem | Muharam |
| `hijri.2` | Safar | صفر | صفر | Safer | Safar |
| `hijri.3` | Rabi' al-Awwal | ربیع الاول | ربيع الأول | Rebiülevvel | Rabiulawal |
| `hijri.4` | Rabi' al-Thani | ربیع الثانی | ربيع الآخر | Rebiülahir | Rabiulakhir |
| `hijri.5` | Jumada al-Awwal | جمادی الاول | جمادى الأولى | Cemaziyelevvel | Jumadilawal |
| `hijri.6` | Jumada al-Thani | جمادی الثانی | جمادى الآخرة | Cemaziyelahir | Jumadilakhir |
| `hijri.7` | Rajab | رجب | رجب | Recep | Rajab |
| `hijri.8` | Sha'ban | شعبان | شعبان | Şaban | Syaban |
| `hijri.9` | Ramadan | رمضان | رمضان | Ramazan | Ramadan |
| `hijri.10` | Shawwal | شوال | شوال | Şevval | Syawal |
| `hijri.11` | Dhu al-Qi'dah | ذو القعدہ | ذو القعدة | Zilkade | Zulkaidah |
| `hijri.12` | Dhu al-Hijjah | ذو الحجہ | ذو الحجة | Zilhicce | Zulhijah |
| `school.sunni` | Sunni | سنی | سني | Sünni | Sunni |
| `school.shia` | Shia | شیعہ | شيعي | Şii | Syiah |
| `madhab.hanafi` | Hanafi | حنفی | حنفي | Hanefi | Hanafi |
| `madhab.shafii` | Shafi'i | شافعی | شافعي | Şafii | Syafii |
| `madhab.hanafiHint` | Asr begins when a shadow is twice its height. | عصر اس وقت شروع ہوتی ہے جب سایہ اپنی لمبائی سے دوگنا ہو جائے۔ | يبدأ العصر عندما يصبح الظل مثلي ارتفاعه. | İkindi, gölge kendi boyunun iki katına çıkınca başlar. | Asar masuk ketika bayangan menjadi dua kali tingginya. |
| `madhab.shafiiHint` | Asr begins when a shadow equals its height. | عصر اس وقت شروع ہوتی ہے جب سایہ اپنی لمبائی کے برابر ہو جائے۔ | يبدأ العصر عندما يصبح الظل مساويًا لارتفاعه. | İkindi, gölge kendi boyuna eşit olunca başlar. | Asar masuk ketika bayangan sama dengan tingginya. |
| `method.moonsighting` | Moonsighting Committee | مون سائیٹنگ کمیٹی | لجنة رؤية الهلال | Moonsighting Committee | Komite Moonsighting |
| `method.northAmerica` | ISNA, North America | ISNA، شمالی امریکہ | ISNA، أمريكا الشمالية | ISNA, Kuzey Amerika | ISNA, Amerika Utara |
| `method.karachi` | University of Karachi | جامعہ کراچی | جامعة كراتشي | Karaçi Üniversitesi | Universitas Karachi |
| `method.mwl` | Muslim World League | مسلم ورلڈ لیگ | رابطة العالم الإسلامي | Müslüman Dünya Birliği | Liga Muslim Dunia |
| `method.ummAlQura` | Umm al-Qura, Makkah | ام القریٰ، مکہ مکرمہ | أم القرى، مكة المكرمة | Ümmü'l-Kura, Mekke | Ummul Qura, Makkah |
| `method.egyptian` | Egyptian General Authority | مصر کی جنرل اتھارٹی | الهيئة المصرية العامة للمساحة | Mısır Genel Kurumu | Otoritas Umum Mesir |
| `method.dubai` | Dubai | دبئی | دبي | Dubai | Dubai |
| `method.kuwait` | Kuwait | کویت | الكويت | Kuveyt | Kuwait |
| `method.qatar` | Qatar | قطر | قطر | Katar | Qatar |
| `method.turkey` | Diyanet, Turkey | دیانت، ترکی | ديانت، تركيا | Diyanet, Türkiye | Diyanet, Turki |
| `method.singapore` | Kemenag & MUIS, Indonesia and Singapore | کیمیناگ اور MUIS، انڈونیشیا اور سنگاپور | كيميناغ وMUIS، إندونيسيا وسنغافورة | Kemenag ve MUIS, Endonezya ve Singapur | Kemenag dan MUIS, Indonesia dan Singapura |
| `method.jafari` | Jafari (Ithna Ashari) | جعفری (اثنا عشری) | الجعفري (الاثنا عشري) | Caferi (İsna Aşeri) | Jafari (Itsna Asyari) |
| `method.tehran` | Institute of Geophysics, Tehran | انسٹیٹیوٹ آف جیو فزکس، تہران | معهد الجيوفيزياء، طهران | Jeofizik Enstitüsü, Tahran | Institut Geofisika, Teheran |
| `methodHint.moonsighting` | A seasonal rule made for places far from the equator. Followed by some mosques in Britain. | خطِ استوا سے دور مقامات کے لیے موسمی اصول۔ برطانیہ کی کچھ مسجدیں اسی پر چلتی ہیں۔ | قاعدة موسمية للأماكن البعيدة عن خط الاستواء. تتبعها بعض المساجد في بريطانيا. | Ekvatordan uzak yerler için mevsimsel bir kural. Britanya'daki bazı camiler bunu izler. | Aturan musiman untuk tempat yang jauh dari khatulistiwa. Dipakai sebagian masjid di Inggris. |
| `methodHint.northAmerica` | The Islamic Society of North America. Used by many mosques in the United States and Canada. | اسلامک سوسائٹی آف نارتھ امریکہ۔ امریکہ اور کینیڈا کی بہت سی مسجدیں اسی کو استعمال کرتی ہیں۔ | الجمعية الإسلامية لأمريكا الشمالية. تستخدمها مساجد كثيرة في الولايات المتحدة وكندا. | Kuzey Amerika İslam Cemiyeti. Amerika Birleşik Devletleri ve Kanada'da birçok cami kullanır. | Islamic Society of North America. Dipakai banyak masjid di Amerika Serikat dan Kanada. |
| `methodHint.karachi` | Common across Pakistan and South Asia. | پاکستان اور جنوبی ایشیا میں عام۔ | شائعة في باكستان وجنوب آسيا. | Pakistan ve Güney Asya'da yaygın. | Umum di Pakistan dan Asia Selatan. |
| `methodHint.mwl` | A general convention used in many countries. The standard here. | بہت سے ممالک میں عام طریقہ۔ یہاں یہی معیار ہے۔ | اصطلاح عام في بلدان كثيرة. وهو المعيار هنا. | Birçok ülkede kullanılan genel bir kabul. Buradaki ölçüt. | Kebiasaan umum di banyak negara. Menjadi patokan di sini. |
| `methodHint.ummAlQura` | The official method in Saudi Arabia. Isha is set at a fixed time after Maghrib. | سعودی عرب کا سرکاری طریقہ۔ عشاء مغرب کے بعد ایک مقرر وقت پر رکھی جاتی ہے۔ | الطريقة الرسمية في السعودية. تُثبَّت العشاء بعد المغرب بمدة محددة. | Suudi Arabistan'ın resmî yöntemi. Yatsı, akşamdan sabit bir süre sonraya konur. | Metode resmi Arab Saudi. Isya ditetapkan pada waktu tetap setelah Magrib. |
| `methodHint.egyptian` | Egypt's official method. | مصر کا سرکاری طریقہ۔ | الطريقة الرسمية في مصر. | Mısır'ın resmî yöntemi. | Metode resmi Mesir. |
| `methodHint.dubai` | A convention used in the Gulf. | خلیج میں استعمال ہونے والا طریقہ۔ | اصطلاح مستخدم في الخليج. | Körfez'de kullanılan bir kabul. | Kebiasaan yang dipakai di Teluk. |
| `methodHint.kuwait` | The convention used in Kuwait. | کویت میں استعمال ہونے والا طریقہ۔ | الاصطلاح المستخدم في الكويت. | Kuveyt'te kullanılan kabul. | Kebiasaan yang dipakai di Kuwait. |
| `methodHint.qatar` | The convention used in Qatar. | قطر میں استعمال ہونے والا طریقہ۔ | الاصطلاح المستخدم في قطر. | Katar'da kullanılan kabul. | Kebiasaan yang dipakai di Qatar. |
| `methodHint.turkey` | Turkey's Presidency of Religious Affairs, with its precaution minutes. | ترکی کے ریاستی مذہبی امور کے ادارے کا طریقہ، اپنے احتیاطی منٹوں کے ساتھ۔ | رئاسة الشؤون الدينية في تركيا، مع دقائق الاحتياط فيها. | Türkiye Diyanet İşleri Başkanlığı, ihtiyat dakikalarıyla. | Kepresidenan Urusan Agama Turki, dengan menit kehati-hatiannya. |
| `methodHint.singapore` | The official bodies of Indonesia and Singapore. | انڈونیشیا اور سنگاپور کے سرکاری ادارے۔ | الهيئتان الرسميتان في إندونيسيا وسنغافورة. | Endonezya ve Singapur'un resmî kurumları. | Badan resmi Indonesia dan Singapura. |
| `methodHint.jafari` | The usual Shia convention. Maghrib is a little after sunset, once the redness has left the sky. | شیعہ حضرات کا عام طریقہ۔ مغرب غروبِ آفتاب کے تھوڑی دیر بعد، جب سرخی آسمان سے چلی جائے۔ | الاصطلاح الشيعي المعتاد. المغرب بعد الغروب بقليل، حين تزول الحمرة من السماء. | Şiilerin yaygın kabulü. Akşam, güneş battıktan biraz sonra, gökteki kızıllık gidince başlar. | Kebiasaan Syiah yang umum. Magrib sedikit setelah matahari terbenam, saat merah di langit sudah hilang. |
| `methodHint.tehran` | The University of Tehran, whose calendar Iran's official times follow. | جامعہ تہران، جس کے کیلنڈر پر ایران کے سرکاری اوقات چلتے ہیں۔ | جامعة طهران، التي تتبع أوقات إيران الرسمية تقويمها. | Tahran Üniversitesi, İran'ın resmî vakitleri bu takvimi izler. | Universitas Teheran, yang menjadi acuan waktu resmi Iran. |
| `region.europe` | Europe | یورپ | أوروبا | Avrupa | Eropa |
| `region.middleEast` | Middle East and Africa | مشرقِ وسطیٰ اور افریقہ | الشرق الأوسط وأفريقيا | Orta Doğu ve Afrika | Timur Tengah dan Afrika |
| `region.asia` | South and East Asia | جنوبی اور مشرقی ایشیا | جنوب وشرق آسيا | Güney ve Doğu Asya | Asia Selatan dan Timur |
| `region.shia` | Shia | شیعہ | الشيعة | Şii | Syiah |
| `method.suggestedFor` | Suggested for {country} | {country} کے لیے تجویز کردہ | المقترح لـ {country} | {country} için önerilen | Disarankan untuk {country} |
| `method.closest` | Closest methods | قریب ترین طریقے | أقرب الطرق | En yakın yöntemler | Metode terdekat |
| `method.other` | Other methods | دیگر طریقے | طرق أخرى | Diğer yöntemler | Metode lain |
| `sound.beep` | Soft beep | ہلکی آواز | تنبيه خفيف | Yumuşak bip | Bunyi lembut |
| `sound.adhan` | Adhan | اذان | الأذان | Ezan | Azan |
| `sound.silent` | Silent | خاموش | صامت | Sessiz | Senyap |
| `sound.beepHint` | Short and gentle | مختصر اور نرم | قصير ولطيف | Kısa ve yumuşak | Singkat dan lembut |
| `sound.adhanHint` | The full call to prayer | پوری اذان | الأذان كاملًا | Ezanın tamamı | Azan lengkap |
| `sound.silentHint` | The message only | صرف پیغام | الرسالة فقط | Yalnızca mesaj | Hanya pesan |
| `firstRun.note` | Free, with no ads and no account. Your times are worked out on this computer. | مفت، بغیر اشتہار اور بغیر اکاؤنٹ کے۔ آپ کے اوقات اسی کمپیوٹر پر حساب کیے جاتے ہیں۔ | مجاني، بلا إعلانات وبلا حساب. تُحسب أوقاتك على هذا الحاسوب. | Ücretsiz, reklamsız ve hesapsız. Vakitleriniz bu bilgisayarda hesaplanır. | Gratis, tanpa iklan dan tanpa akun. Waktu Anda dihitung di komputer ini. |
| `firstRun.understand` | I understand | میں سمجھ گیا | فهمت | Anladım | Saya mengerti |
| `firstRun.schoolTitle` | School | مسلک | المذهب | Mezhep | Mazhab |
| `firstRun.madhabTitle` | Asr school | عصر کا مسلک | مذهب العصر | İkindi mezhebi | Mazhab Asar |
| `firstRun.madhabNote` | It only changes when Asr begins. Every other time stays the same. | اس سے صرف عصر کے شروع ہونے کا وقت بدلتا ہے۔ باقی سب اوقات وہی رہتے ہیں۔ | لا يغيّر إلا وقت بدء العصر. أما بقية الأوقات فتبقى كما هي. | Yalnızca ikindinin başlangıcını değiştirir. Diğer vakitler aynı kalır. | Ini hanya mengubah kapan Asar masuk. Waktu lainnya tetap sama. |
| `firstRun.useLocation` | Use my location | میرا مقام استعمال کریں | استخدم موقعي | Konumumu kullan | Pakai lokasi saya |
| `firstRun.allowLocation` | Allow location | مقام کی اجازت دیں | اسمح بالموقع | Konuma izin ver | Izinkan lokasi |
| `firstRun.orTypePlace` | Or type a place | یا مقام لکھیں | أو اكتب مكانًا | Ya da bir yer yazın | Atau ketik tempat |
| `firstRun.typePlace` | Type the name of your town or city. | اپنے شہر یا قصبے کا نام لکھیں۔ | اكتب اسم مدينتك أو بلدتك. | Kasabanızın veya şehrinizin adını yazın. | Ketik nama kota atau kabupaten Anda. |
| `firstRun.finding` | Finding your place... | آپ کا مقام ڈھونڈا جا رہا ہے... | جارٍ البحث عن مكانك... | Yeriniz bulunuyor... | Mencari tempat Anda... |
| `firstRun.defaultMakkah` | Prayer times will be for Makkah until you set your location. | جب تک آپ مقام مقرر نہیں کرتے، اوقات مکہ مکرمہ کے ہوں گے۔ | ستكون الأوقات لمكة المكرمة حتى تحدد موقعك. | Konumunuzu belirleyene kadar vakitler Mekke'ye göre olur. | Waktu salat akan memakai Makkah sampai Anda menentukan lokasi. |
| `firstRun.willBeFor` | Your prayer times will be for this place. | آپ کے اوقاتِ نماز اس مقام کے ہوں گے۔ | ستكون أوقات صلاتك لهذا المكان. | Namaz vakitleriniz bu yere göre olacak. | Waktu salat Anda akan memakai tempat ini. |
| `firstRun.noLocation` | This browser cannot read your location. Find a place below instead. | یہ براؤزر آپ کا مقام نہیں پڑھ سکتا۔ نیچے سے مقام تلاش کریں۔ | هذا المتصفح لا يستطيع قراءة موقعك. ابحث عن مكان أدناه. | Bu tarayıcı konumunuzu okuyamıyor. Aşağıdan bir yer arayın. | Peramban ini tidak dapat membaca lokasi Anda. Cari tempat di bawah ini. |
| `firstRun.locationDenied` | We could not read your location. Allow location for this browser, then try again, or type a place below. | ہم آپ کا مقام نہیں پڑھ سکے۔ اس براؤزر کے لیے مقام کی اجازت دیں، پھر دوبارہ کوشش کریں، یا نیچے مقام لکھیں۔ | لم نتمكن من قراءة موقعك. اسمح بالموقع لهذا المتصفح ثم حاول مرة أخرى، أو اكتب مكانًا أدناه. | Konumunuzu okuyamadık. Bu tarayıcı için konuma izin verin, sonra tekrar deneyin ya da aşağıya bir yer yazın. | Kami tidak dapat membaca lokasi Anda. Izinkan lokasi untuk peramban ini, lalu coba lagi, atau ketik tempat di bawah ini. |
| `firstRun.chromeNote` | Chrome asks Google to estimate where you are. SajdaTime never receives it. | Chrome گوگل سے پوچھتا ہے کہ آپ کہاں ہیں۔ SajdaTime کو یہ کبھی نہیں ملتا۔ | يسأل Chrome شركة Google عن موقعك التقريبي. ولا يصل ذلك إلى SajdaTime. | Chrome, yerinizi tahmin etmesi için Google'a sorar. Bu bilgi SajdaTime'a hiç ulaşmaz. | Chrome meminta Google memperkirakan posisi Anda. SajdaTime tidak pernah menerimanya. |
| `firstRun.edgeNote` | Edge asks Microsoft to estimate where you are. SajdaTime never receives it. | Edge مائیکروسافٹ سے پوچھتا ہے کہ آپ کہاں ہیں۔ SajdaTime کو یہ کبھی نہیں ملتا۔ | يسأل Edge شركة Microsoft عن موقعك التقريبي. ولا يصل ذلك إلى SajdaTime. | Edge, yerinizi tahmin etmesi için Microsoft'a sorar. Bu bilgi SajdaTime'a hiç ulaşmaz. | Edge meminta Microsoft memperkirakan posisi Anda. SajdaTime tidak pernah menerimanya. |
| `firstRun.methodTitle` | Calculation method | حساب کا طریقہ | طريقة الحساب | Hesaplama yöntemi | Metode perhitungan |
| `firstRun.alertsTitle` | Alerts | الرٹ | التنبيهات | Uyarılar | Pengingat |
| `firstRun.alertsNote` | At each prayer you hear a sound and see a message. The message closes after 1 minute. | ہر نماز پر آپ کو آواز سنائی دے گی اور پیغام نظر آئے گا۔ پیغام ایک منٹ بعد بند ہو جاتا ہے۔ | عند كل صلاة تسمع صوتًا وترى رسالة. تُغلق الرسالة بعد دقيقة واحدة. | Her namazda bir ses duyar ve bir mesaj görürsünüz. Mesaj 1 dakika sonra kapanır. | Pada setiap salat Anda mendengar bunyi dan melihat pesan. Pesan menutup setelah 1 menit. |
| `firstRun.matchTitle` | Match my mosque | میری مسجد سے ملائیں | طابِق مسجدك | Camiye göre ayarla | Sesuaikan dengan masjid |
| `firstRun.matchNote` | Type the Fajr start time your mosque shows. | وہ فجر کا وقت لکھیں جو آپ کی مسجد دکھاتی ہے۔ | اكتب وقت بدء الفجر الذي يعرضه مسجدك. | Caminizin gösterdiği sabah başlangıç vaktini yazın. | Ketik waktu mulai Subuh yang ditampilkan masjid Anda. |
| `firstRun.matchStart` | Use the start time, not the jamaat time. | شروع کا وقت لکھیں، جماعت کا وقت نہیں۔ | استخدم وقت البدء، لا وقت الجماعة. | Başlangıç vaktini kullanın, cemaat vaktini değil. | Pakai waktu mulai, bukan waktu jamaah. |
| `settings.backToTimes` | Back to times | اوقات پر واپس | رجوع إلى الأوقات | Vakitlere dön | Kembali ke waktu salat |
| `settings.prayerTimes` | Prayer times | اوقاتِ نماز | أوقات الصلاة | Namaz vakitleri | Waktu salat |
| `settings.place` | Place | مقام | المكان | Yer | Tempat |
| `settings.fromThisComputer` | From this computer | اسی کمپیوٹر سے | من هذا الحاسوب | Bu bilgisayardan | Dari komputer ini |
| `settings.myLocation` | My location | میرا مقام | موقعي | Konumum | Lokasi saya |
| `settings.asrSchool` | Asr school | عصر کا مسلک | مذهب العصر | İkindi mezhebi | Mazhab Asar |
| `settings.hijriDate` | Hijri date | اسلامی تاریخ | التاريخ الهجري | Hicri tarih | Tanggal Hijriah |
| `settings.oneDayEarlier` | One day earlier | ایک دن پہلے | يوم قبل | Bir gün önce | Satu hari lebih awal |
| `settings.oneDayLater` | One day later | ایک دن بعد | يوم بعد | Bir gün sonra | Satu hari lebih lambat |
| `settings.ramadanCard` | Ramadan card | رمضان کارڈ | بطاقة رمضان | Ramazan kartı | Kartu ramadan |
| `settings.noChange` | No change | کوئی تبدیلی نہیں | بلا تغيير | Değişiklik yok | Tanpa perubahan |
| `settings.alerts` | Alerts | الرٹ | التنبيهات | Uyarılar | Pengingat |
| `settings.alertsBlocked` | Prayer alerts are blocked | نماز کے الرٹ بند ہیں | تنبيهات الصلاة محظورة | Namaz uyarıları engelleniyor | Pengingat salat diblokir |
| `settings.prayerAlerts` | Prayer alerts | نماز کے الرٹ | تنبيهات الصلاة | Namaz uyarıları | Pengingat salat |
| `settings.alertsNote` | A message and a sound at each prayer. | ہر نماز پر ایک پیغام اور ایک آواز۔ | رسالة وصوت عند كل صلاة. | Her namazda bir mesaj ve bir ses. | Pesan dan bunyi pada setiap salat. |
| `settings.reminder` | Reminder before prayer | نماز سے پہلے یاد دہانی | تنبيه قبل الصلاة | Namazdan önce hatırlatma | Pengingat sebelum salat |
| `settings.suhoorReminder` | Suhoor reminder | سحری کی یاد دہانی | تنبيه السحور | Sahur hatırlatması | Pengingat sahur |
| `settings.appearance` | Appearance | ظاہری شکل | المظهر | Görünüm | Tampilan |
| `settings.theme` | Theme | تھیم | السمة | Tema | Tema |
| `settings.themeSystem` | System | سسٹم | النظام | Sistem | Sistem |
| `settings.themeLight` | Light | روشن | فاتحة | Açık | Terang |
| `settings.themeDark` | Dark | گہرا | داكنة | Koyu | Gelap |
| `settings.language` | Language | زبان | اللغة | Dil | Bahasa |
| `settings.about` | About | تعارف | حول | Hakkında | Tentang |
| `settings.privacy` | Privacy policy | پرائیویسی پالیسی | سياسة الخصوصية | Gizlilik ilkesi | Kebijakan privasi |
| `settings.disclaimer` | Disclaimer | ڈس کلیمر | إخلاء المسؤولية | Sorumluluk reddi | Penafian |
| `settings.disclaimerHint` | A helper, not a religious authority. | ایک مددگار، کوئی دینی اتھارٹی نہیں۔ | مساعد، وليس مرجعًا دينيًا. | Bir yardımcı, dinî bir otorite değil. | Alat bantu, bukan otoritas agama. |
| `settings.credits` | Credits | حوالے | المصادر | Kaynaklar | Kredit |
| `settings.version` | Version | ورژن | الإصدار | Sürüm | Versi |
| `settings.versionLine` | SajdaTime {version} | SajdaTime {version} | SajdaTime {version} | SajdaTime {version} | SajdaTime {version} |
| `settings.methodNote` | This sets which calculation methods are offered. | یہ طے کرتا ہے کہ کون سے طریقے پیش کیے جائیں۔ | هذا يحدد طرق الحساب المعروضة. | Hangi hesaplama yöntemlerinin sunulacağını belirler. | Ini menentukan metode perhitungan yang ditawarkan. |
| `settings.madhabNote` | This only changes when Asr begins. | اس سے صرف عصر کے شروع ہونے کا وقت بدلتا ہے۔ | لا يغيّر إلا وقت بدء العصر. | Yalnızca ikindinin başlangıcını değiştirir. | Ini hanya mengubah kapan Asar masuk. |
| `settings.creditsEngines` | GeoNames, adhan-js, adhan recordings | GeoNames، adhan-js، adhan recordings | GeoNames وadhan-js وتسجيلات الأذان | GeoNames, adhan-js, adhan kayıtları | GeoNames, adhan-js, rekaman azan |
| `settings.creditAdhan` | Prayer times from adhan-js by Batoul Apps, MIT. | اوقاتِ نماز adhan-js از Batoul Apps، MIT۔ | أوقات الصلاة من adhan-js من Batoul Apps، رخصة MIT. | Namaz vakitleri Batoul Apps'in adhan-js kitaplığından, MIT. | Waktu salat dari adhan-js oleh Batoul Apps, MIT. |
| `settings.creditRecording` | Sunni adhan: recorded by Adam-synagda, CC0. | سنی اذان: Adam-synagda کی ریکارڈنگ، CC0۔ | أذان سني: تسجيل Adam-synagda، رخصة CC0. | Sünni ezan: Adam-synagda kaydı, CC0. | Azan Sunni: rekaman Adam-synagda, CC0. |
| `settings.creditCommons` | Both via Wikimedia Commons. | دونوں Wikimedia Commons کے ذریعے۔ | كلاهما عبر ويكيميديا كومنز. | İkisi de Wikimedia Commons üzerinden. | Keduanya melalui Wikimedia Commons. |
| `place.timesFor` | Times are for | اوقات برائے | الأوقات لمكان | Vakitler şu yer için | Waktu untuk |
| `place.currentPlace` | Current place | موجودہ مقام | المكان الحالي | Şu anki yer | Tempat saat ini |
| `place.close` | Close location | مقام بند کریں | إغلاق الموقع | Konumu kapat | Tutup lokasi |
| `place.findPlace` | Or find a place | یا مقام تلاش کریں | أو ابحث عن مكان | Ya da yer arayın | Atau cari tempat |
| `place.placesFound` | Places found | ملنے والے مقامات | أماكن موجودة | Bulunan yerler | Tempat ditemukan |
| `place.loading` | Loading places... | مقامات لوڈ ہو رہے ہیں... | جارٍ تحميل الأماكن... | Yerler yükleniyor... | Memuat tempat... |
| `place.onePlace` | {count} place found. | {count} مقام ملا۔ | وُجد {count} مكان. | {count} yer bulundu. | {count} tempat ditemukan. |
| `place.manyPlaces` | {count} places found. | {count} مقامات ملے۔ | وُجدت {count} أماكن. | {count} yer bulundu. | {count} tempat ditemukan. |
| `place.none` | No place found. Try a larger town nearby. | کوئی مقام نہیں ملا۔ قریب کا کوئی بڑا شہر تلاش کریں۔ | لم يُوجد مكان. جرّب مدينة أكبر بالقرب منك. | Yer bulunamadı. Yakındaki daha büyük bir şehri deneyin. | Tempat tidak ditemukan. Coba kota yang lebih besar di dekat sini. |
| `place.listMissing` | The town list could not be read. Try using your location instead. | شہروں کی فہرست نہیں پڑھی جا سکی۔ اس کے بجائے اپنا مقام استعمال کریں۔ | لم نتمكن من قراءة قائمة المدن. حاول استخدام موقعك بدلًا من ذلك. | Şehir listesi okunamadı. Bunun yerine konumunuzu kullanmayı deneyin. | Daftar kota tidak dapat dibaca. Coba pakai lokasi Anda. |
| `place.found` | Location found | مقام مل گیا | تم إيجاد الموقع | Konum bulundu | Lokasi ditemukan |
| `place.foundNote` | Your prayer times are now for this place. | آپ کے اوقاتِ نماز اب اس مقام کے لیے ہیں۔ | أوقات صلاتك الآن لهذا المكان. | Namaz vakitleriniz artık bu yere göre. | Waktu salat Anda sekarang memakai tempat ini. |
| `place.change` | Change location | مقام تبدیل کریں | تغيير الموقع | Konumu değiştir | Ubah lokasi |
| `notice.alertsBlocked` | alerts are blocked | الرٹ بند ہیں | التنبيهات محظورة | uyarılar engelleniyor | pengingat diblokir |
| `match.title` | Match your mosque | اپنی مسجد سے ملائیں | طابِق مسجدك | Caminize göre ayarlayın | Sesuaikan dengan masjid Anda |
| `match.atMosque` | At your mosque's time | آپ کی مسجد کے وقت پر | في وقت مسجدك | Caminizin vaktinde | Pada waktu masjid Anda |
| `match.after` | {count} minutes after your mosque | آپ کی مسجد سے {count} منٹ بعد | {count} دقائق بعد مسجدك | Caminizden {count} dakika sonra | {count} menit setelah masjid Anda |
| `match.before` | {count} minutes before your mosque | آپ کی مسجد سے {count} منٹ پہلے | {count} دقائق قبل مسجدك | Caminizden {count} dakika önce | {count} menit sebelum masjid Anda |
| `match.afterOne` | 1 minute after your mosque | آپ کی مسجد سے 1 منٹ بعد | دقيقة واحدة بعد مسجدك | Caminizden 1 dakika sonra | 1 menit setelah masjid Anda |
| `match.beforeOne` | 1 minute before your mosque | آپ کی مسجد سے 1 منٹ پہلے | دقيقة واحدة قبل مسجدك | Caminizden 1 dakika önce | 1 menit sebelum masjid Anda |
| `print.monthTitle` | Prayer times for {town} | {town} کے اوقاتِ نماز | أوقات الصلاة في {town} | {town} namaz vakitleri | Waktu salat {town} |
| `print.ramadanTitle` | Ramadan timetable for {town} | {town} کا رمضان ٹائم ٹیبل | جدول رمضان في {town} | {town} ramazan takvimi | Jadwal ramadan {town} |
| `print.date` | Date | تاریخ | التاريخ | Tarih | Tanggal |
| `print.day` | Day | دن | اليوم | Gün | Hari |
| `print.hijri` | Hijri | ہجری | الهجري | Hicri | Hijriah |
| `print.ramadanDay` | Day of Ramadan | رمضان کا دن | يوم من رمضان | Ramazan günü | Hari Ramadan |
| `print.printOrSave` | Print or save | پرنٹ یا محفوظ کریں | اطبع أو احفظ | Yazdır veya kaydet | Cetak atau simpan |
| `print.previous` | Previous month | پچھلا مہینہ | الشهر السابق | Önceki ay | Bulan sebelumnya |
| `print.next` | Next month | اگلا مہینہ | الشهر التالي | Sonraki ay | Bulan berikutnya |
| `print.ramadan` | Ramadan timetable | رمضان ٹائم ٹیبل | جدول رمضان | Ramazan takvimi | Jadwal ramadan |
| `print.month` | Month timetable | مہینے کا ٹائم ٹیبل | جدول الشهر | Ay takvimi | Jadwal bulanan |
| `print.today` | Today is the shaded row. | آج کی سطر سایہ زدہ ہے۔ | الصف المظلل هو اليوم. | Bugün gölgeli satırda. | Baris berwarna adalah hari ini. |
| `print.setupTitle` | Set up SajdaTime first | پہلے SajdaTime ترتیب دیں | جهّز SajdaTime أولًا | Önce SajdaTime'ı ayarlayın | Siapkan SajdaTime dulu |
| `print.setupNote` | Open SajdaTime and choose your town. The timetable is worked out from that. | SajdaTime کھولیں اور اپنا شہر چنیں۔ ٹائم ٹیبل اسی سے بنتا ہے۔ | افتح SajdaTime واختر مدينتك. يُحسب الجدول من ذلك. | SajdaTime'ı açın ve şehrinizi seçin. Takvim ona göre hesaplanır. | Buka SajdaTime dan pilih kota Anda. Jadwal dihitung dari situ. |
| `print.clockBack` | Clocks go back on {when}. Times from that day are in {zone}. | {when} کو گھڑیاں ایک گھنٹہ پیچھے آ جائیں گی۔ اس دن سے اوقات {zone} میں ہیں۔ | تُؤخَّر الساعات في {when}. الأوقات من ذلك اليوم بالتوقيت {zone}. | {when} tarihinde saatler geri alınıyor. O günden sonraki vakitler {zone} saatine göre. | Jam dimundurkan pada {when}. Waktu mulai hari itu memakai zona {zone}. |
| `print.clockForward` | Clocks go forward on {when}. Times from that day are in {zone}. | {when} کو گھڑیاں ایک گھنٹہ آگے چلی جائیں گی۔ اس دن سے اوقات {zone} میں ہیں۔ | تُقدَّم الساعات في {when}. الأوقات من ذلك اليوم بالتوقيت {zone}. | {when} tarihinde saatler ileri alınıyor. O günden sonraki vakitler {zone} saatine göre. | Jam dimajukan pada {when}. Waktu mulai hari itu memakai zona {zone}. |
| `disclaimer.short` | SajdaTime is a helper, not a religious authority. These times are worked out on this computer from the position of the sun, using published calculation methods. They are not given by a mosque, a scholar, or any authority. I am not a Mufti, an Aalim, or an expert in fiqh, and this extension was built with the help of artificial intelligence. Software can carry faults, the computer can hold the wrong place or the wrong clock, and I can be wrong. Take what you see as a calculation, not a ruling. Where SajdaTime and your mosque disagree, follow your mosque. If something looks wrong or you are unsure, ask someone qualified. SajdaTime is free and given as it is, with no warranty and no promise of accuracy. And one request, if you would: please remember me, my family, and my parents in your duas. | SajdaTime ایک مددگار ہے، کوئی دینی اتھارٹی نہیں۔ یہ اوقات اسی کمپیوٹر پر سورج کی پوزیشن سے، شائع شدہ حساب کے طریقوں سے نکالے جاتے ہیں۔ یہ مجھے کسی مسجد، کسی عالم یا کسی اتھارٹی نے نہیں دیے۔ میں نہ مفتی ہوں، نہ عالم، نہ فقہ کا ماہر، اور یہ ایکسٹینشن مصنوعی ذہانت کی مدد سے بنائی گئی ہے۔ سافٹ ویئر میں خرابیاں ہو سکتی ہیں، کمپیوٹر میں غلط مقام یا غلط وقت ہو سکتا ہے، اور میں خود بھی غلط ہو سکتا ہوں۔ جو کچھ آپ دیکھیں اسے ایک حساب سمجھیں، کوئی شرعی فیصلہ نہیں۔ جہاں SajdaTime اور آپ کی مسجد میں اختلاف ہو، وہاں اپنی مسجد کی پیروی کریں۔ اگر کچھ غلط لگے یا آپ کو یقین نہ ہو، تو کسی اہل شخص سے پوچھ لیں۔ SajdaTime مفت ہے اور جیسی ہے ویسی ہی دی جا رہی ہے، کسی ضمانت اور درستگی کے کسی وعدے کے بغیر۔ اور ایک گزارش، اگر آپ کر سکیں: براہِ کرم مجھے، میرے گھر والوں کو اور میرے والدین کو اپنی دعاؤں میں یاد رکھیں۔ | SajdaTime مساعد، وليس مرجعًا دينيًا. تُحسب هذه الأوقات على هذا الحاسوب من موقع الشمس، بطرق حساب منشورة. وهي لم يعطني إياها مسجد ولا عالم ولا أي جهة. لست مفتيًا ولا عالمًا ولا خبيرًا في الفقه، وقد بُنيت هذه الإضافة بمساعدة الذكاء الاصطناعي. قد يحتوي البرنامج على أخطاء، وقد يحمل الحاسوب المكان الخطأ أو الساعة الخطأ، وقد أكون أنا مخطئًا. فاعتبر ما تراه حسابًا لا حكمًا. وحيث يختلف SajdaTime ومسجدك، فاتبع مسجدك. وإن بدا لك شيء غير صحيح أو لم تكن متأكدًا، فاسأل من هو أهل للنصيحة. SajdaTime مجاني ويُقدَّم كما هو، دون أي ضمان ودون أي وعد بالدقة. وطلب واحد، إن تكرّمت: أرجو أن تذكرني وعائلتي ووالديّ في دعائك. | SajdaTime bir yardımcıdır, dinî bir otorite değildir. Bu vakitler bu bilgisayarda güneşin konumundan, yayımlanmış hesaplama yöntemleriyle hesaplanır. Bunlar bana bir cami, bir âlim ya da herhangi bir otorite tarafından verilmedi. Ben bir müftü, bir âlim ya da fıkıh uzmanı değilim ve bu uzantı yapay zekâ yardımıyla yapıldı. Yazılımda hata olabilir, bilgisayarda yanlış yer ya da yanlış saat kayıtlı olabilir ve ben de yanılıyor olabilirim. Gördüklerinizi dinî bir hüküm olarak değil, bir hesaplama olarak kabul edin. SajdaTime ile caminiz farklı söylüyorsa caminize uyun. Bir şey yanlış görünüyorsa ya da emin değilseniz, ehil birine danışın. SajdaTime ücretsizdir ve olduğu gibi sunulur, hiçbir garanti ve doğruluk vaadi yoktur. Bir de ricam var, uygun görürseniz: lütfen beni, ailemi ve anne babamı dualarınızda anın. | SajdaTime adalah alat bantu, bukan otoritas agama. Waktu-waktu ini dihitung di komputer ini dari posisi matahari, dengan metode perhitungan yang diterbitkan. Waktu ini tidak diberikan kepada saya oleh masjid, ulama, atau otoritas mana pun. Saya bukan mufti, bukan alim, dan bukan ahli fikih, dan ekstensi ini dibuat dengan bantuan kecerdasan buatan. Perangkat lunak bisa mengandung kesalahan, komputer bisa menyimpan tempat atau jam yang salah, dan saya pun bisa keliru. Anggap apa yang Anda lihat sebagai hasil perhitungan, bukan fatwa. Jika SajdaTime dan masjid Anda berbeda, ikutilah masjid Anda. Jika ada yang tampak keliru atau Anda ragu, tanyakan kepada orang yang berwenang memberi nasihat. SajdaTime gratis dan diberikan apa adanya, tanpa jaminan dan tanpa janji ketepatan. Dan satu permohonan, bila Anda berkenan: mohon ingat saya, keluarga saya, dan orang tua saya dalam doa-doa Anda. |
| `disclaimer.full.1` | SajdaTime is a helper, not a religious authority. | SajdaTime ایک مددگار ہے، کوئی دینی اتھارٹی نہیں۔ | SajdaTime مساعد، وليس مرجعًا دينيًا. | SajdaTime bir yardımcıdır, dinî bir otorite değildir. | SajdaTime adalah alat bantu, bukan otoritas agama. |
| `disclaimer.full.2` | These times are not given to me by a mosque, a scholar, or any authority. Your computer works them out from the position of the sun, using calculation methods that Islamic authorities and scholars have published. I am not a Mufti, Aalim, or an expert in fiqh, and this extension was built with the help of artificial intelligence. Software can carry faults, a computer can hold the wrong location or the wrong clock, a closed browser or a sleeping computer can delay an alert, and I can simply be wrong. | یہ اوقات مجھے کسی مسجد، کسی عالم یا کسی اتھارٹی نے نہیں دیے۔ آپ کا کمپیوٹر انہیں سورج کی پوزیشن سے نکالتا ہے، اور اس کے لیے حساب کے وہ طریقے استعمال کرتا ہے جو اسلامی اداروں اور علماء نے شائع کیے ہیں۔ میں نہ مفتی ہوں، نہ عالم، نہ فقہ کا ماہر، اور یہ ایکسٹینشن مصنوعی ذہانت کی مدد سے بنائی گئی ہے۔ سافٹ ویئر میں خرابیاں ہو سکتی ہیں، کمپیوٹر میں غلط مقام یا غلط وقت ہو سکتا ہے، بند براؤزر یا سوئے ہوئے کمپیوٹر سے الرٹ میں تاخیر ہو سکتی ہے، اور میں خود بھی غلط ہو سکتا ہوں۔ | هذه الأوقات لم يعطني إياها مسجد ولا عالم ولا أي جهة. يحسبها حاسوبك من موقع الشمس، مستخدمًا طرق حساب نشرتها هيئات إسلامية وعلماء. لست مفتيًا ولا عالمًا ولا خبيرًا في الفقه، وقد بُنيت هذه الإضافة بمساعدة الذكاء الاصطناعي. قد يحتوي البرنامج على أخطاء، وقد يحمل الحاسوب موقعًا خاطئًا أو ساعة خاطئة، وقد يؤخر متصفح مغلق أو حاسوب نائم تنبيهًا، وقد أكون أنا مخطئًا. | Bu vakitler bana bir cami, bir âlim ya da herhangi bir otorite tarafından verilmedi. Bilgisayarınız bunları güneşin konumundan hesaplar. Bunu yaparken İslami otoritelerin ve âlimlerin yayımladığı hesaplama yöntemlerini kullanır. Ben bir müftü, bir âlim ya da fıkıh uzmanı değilim ve bu uzantı yapay zekâ yardımıyla yapıldı. Yazılımda hata olabilir, bilgisayarda yanlış konum ya da yanlış saat kayıtlı olabilir, kapalı bir tarayıcı ya da uyuyan bir bilgisayar bir uyarıyı geciktirebilir ve ben de düpedüz yanılıyor olabilirim. | Waktu-waktu ini tidak diberikan kepada saya oleh masjid, ulama, atau otoritas mana pun. Komputer Anda menghitungnya dari posisi matahari, dengan metode perhitungan yang diterbitkan oleh otoritas dan ulama Islam. Saya bukan mufti, bukan alim, dan bukan ahli fikih, dan ekstensi ini dibuat dengan bantuan kecerdasan buatan. Perangkat lunak bisa mengandung kesalahan, komputer bisa menyimpan lokasi atau jam yang salah, peramban yang tertutup atau komputer yang tidur bisa menunda pengingat, dan saya pun bisa saja keliru. |
| `disclaimer.full.3` | So please take what you see here as a calculation and not a ruling. Where SajdaTime and your mosque disagree, follow your mosque. If a time looks off to you, or you are unsure, ask them or someone else qualified to advise you. The extension is free and is given as it is, with no warranty and no promise of accuracy, so where being exact matters to you, please do not rely on it alone. | اس لیے براہِ کرم جو کچھ آپ یہاں دیکھیں اسے ایک حساب سمجھیں، کوئی شرعی فیصلہ نہیں۔ جہاں SajdaTime اور آپ کی مسجد میں اختلاف ہو، وہاں اپنی مسجد کی پیروی کریں۔ اگر کوئی وقت آپ کو غلط لگے، یا آپ کو یقین نہ ہو، تو اپنی مسجد سے یا کسی اور اہل شخص سے پوچھ لیں جو آپ کی رہنمائی کر سکے۔ یہ ایکسٹینشن مفت ہے اور جیسی ہے ویسی ہی دی جا رہی ہے، کسی ضمانت اور درستگی کے کسی وعدے کے بغیر، اس لیے جہاں بالکل درست ہونا آپ کے لیے اہم ہو، وہاں صرف اسی پر انحصار نہ کریں۔ | لذا أرجو أن تعدّ ما تراه هنا حسابًا لا حكمًا شرعيًا. وحيث يختلف SajdaTime ومسجدك، فاتبع مسجدك. إن بدا لك وقت غير صحيح، أو لم تكن متأكدًا، فاسألهم أو اسأل شخصًا آخر مؤهلًا لينصحك. هذه الإضافة مجانية وتُقدَّم كما هي، دون أي ضمان ودون أي وعد بالدقة، فحيث تهمّك الدقة التامة، أرجو ألا تعتمد عليها وحدها. | Bu yüzden lütfen burada gördüklerinizi dinî bir hüküm olarak değil, bir hesaplama olarak kabul edin. SajdaTime ile caminiz farklı söylüyorsa caminize uyun. Bir vakit size yanlış görünüyorsa veya emin değilseniz, caminize ya da size yol gösterebilecek ehil başka birine danışın. Bu uzantı ücretsizdir ve olduğu gibi sunulur. Hiçbir garanti ya da doğruluk vaadi yoktur. Bu yüzden tam doğruluğun sizin için önemli olduğu durumlarda lütfen yalnızca buna güvenmeyin. | Jadi, mohon anggap apa yang Anda lihat di sini sebagai hasil perhitungan, bukan sebagai fatwa atau hukum. Jika SajdaTime dan masjid Anda berbeda, ikutilah masjid Anda. Jika suatu waktu tampak tidak tepat, atau Anda ragu, tanyakan kepada mereka atau kepada orang lain yang berwenang memberi nasihat. Ekstensi ini gratis dan diberikan apa adanya, tanpa jaminan apa pun dan tanpa janji ketepatan. Jadi, bila ketepatan penting bagi Anda, mohon jangan hanya mengandalkan ini. |
| `disclaimer.full.4` | Mosques do not all agree on when a prayer starts. Isha varies the most. In Britain and further north the gap between one method and another can be over an hour, because scholars measure the fading of the twilight differently. I cannot settle that, and the extension does not try to. If the times here do not match your mosque, ask them which method they use and pick it in Settings, under Calculation method. Where a difference remains, follow your mosque. | مسجدیں نماز کے شروع ہونے کے وقت پر متفق نہیں ہیں۔ عشاء میں سب سے زیادہ اختلاف ہے۔ برطانیہ اور اس سے آگے شمال میں ایک طریقے اور دوسرے کے درمیان ایک گھنٹے سے زیادہ کا فرق ہو سکتا ہے، کیونکہ علماء شفق کے غائب ہونے کا اندازہ مختلف طریقے سے لگاتے ہیں۔ میں اس کا فیصلہ نہیں کر سکتا، اور یہ ایکسٹینشن کوشش بھی نہیں کرتی۔ اگر یہاں کے اوقات آپ کی مسجد سے نہ ملیں، تو ان سے پوچھیں کہ وہ کون سا طریقہ استعمال کرتی ہے اور اسے ترتیبات میں حساب کا طریقہ کے تحت چن لیں۔ جہاں فرق رہ جائے، وہاں اپنی مسجد کی پیروی کریں۔ | لا تتفق المساجد كلها على وقت بدء الصلاة. والعشاء أكثرها اختلافًا. وفي بريطانيا وما يقع شمالها قد يزيد الفرق بين طريقة وأخرى على ساعة، لأن العلماء يقيسون اختفاء الشفق بطرق مختلفة. لا أستطيع أن أحسم ذلك، ولا تحاول الإضافة ذلك. إن لم تطابق الأوقات هنا مسجدك، فاسألهم عن الطريقة التي يتبعونها واخترها في الإعدادات، تحت طريقة الحساب. وحيث يبقى اختلاف، فاتبع مسجدك. | Camiler bir namazın ne zaman başladığı konusunda her zaman aynı görüşte değildir. En çok fark Yatsı vaktindedir. Britanya'da ve daha kuzeyde bir yöntemle diğeri arasındaki fark bir saati aşabilir, çünkü âlimler alacakaranlığın kayboluşunu farklı ölçer. Bu konuyu ben çözemem, uzantı da çözmeye çalışmaz. Buradaki vakitler caminizle uyuşmuyorsa, onlara hangi yöntemi kullandıklarını sorun ve Ayarlar bölümünde, Hesaplama yöntemi altında o yöntemi seçin. Bir fark yine kalırsa caminize uyun. | Tidak semua masjid sepakat kapan waktu salat dimulai. Isya paling bervariasi. Di Inggris dan wilayah lebih ke utara, selisih antara satu metode dan lainnya bisa lebih dari satu jam, karena ulama mengukur memudarnya cahaya senja dengan cara berbeda. Saya tidak bisa memutuskan hal itu, dan ekstensi ini tidak mencoba memutuskannya. Jika waktu di sini tidak cocok dengan masjid Anda, tanyakan metode yang mereka pakai lalu pilih metode itu di Pengaturan, pada Metode perhitungan. Jika masih ada perbedaan, ikutilah masjid Anda. |
| `disclaimer.full.5` | One more thing. This extension shows when a prayer becomes due. Your mosque then sets its own time for the congregation, usually a little later, so the board there and the times here will often differ. Neither is wrong. | ایک اور بات۔ یہ ایکسٹینشن دکھاتی ہے کہ نماز کا وقت کب شروع ہوتا ہے۔ آپ کی مسجد پھر جماعت کے لیے اپنا وقت مقرر کرتی ہے، عموماً کچھ دیر بعد، اس لیے وہاں کا بورڈ اور یہاں کے اوقات اکثر مختلف ہوں گے۔ کوئی بھی غلط نہیں۔ | أمر أخير. تبيّن هذه الإضافة متى يدخل وقت الصلاة. ثم يحدد مسجدك وقته الخاص لصلاة الجماعة، وغالبًا ما يكون بعده بقليل، لذا سيختلف لوح المسجد عن الأوقات هنا في كثير من الأحيان. وليس أيٌّ منهما خاطئًا. | Bir şey daha. Bu uzantı bir namaz vaktinin ne zaman girdiğini gösterir. Caminiz ise cemaat için kendi saatini belirler ve bu genellikle biraz daha geçtir. Bu yüzden camideki vakit çizelgesi ile buradaki vakitler çoğu zaman farklı olur. İkisi de yanlış değildir. | Satu hal lagi. Ekstensi ini menunjukkan kapan waktu salat masuk. Masjid Anda lalu menentukan sendiri waktu salat berjamaahnya, biasanya sedikit lebih lambat, sehingga papan jadwal di sana dan waktu di sini sering berbeda. Keduanya tidak salah. |
| `disclaimer.full.6` | And one request, if you would: please remember me, my family, and my parents in your duas. | اور ایک گزارش، اگر آپ کر سکیں: براہِ کرم مجھے، میرے گھر والوں کو اور میرے والدین کو اپنی دعاؤں میں یاد رکھیں۔ | وطلب واحد، إن تكرّمت: أرجو أن تذكرني وعائلتي ووالديّ في دعائك. | Bir de ricam var, uygun görürseniz: lütfen beni, ailemi ve anne babamı dualarınızda anın. | Dan satu permohonan, bila Anda berkenan: mohon ingat saya, keluarga saya, dan orang tua saya dalam doa-doa Anda. |
| `firstRun.welcome` | Prayer times and a gentle alert, right here on your computer. | اوقاتِ نماز اور نرمی سے یاد دہانی، اسی کمپیوٹر پر۔ | أوقات الصلاة وتنبيه لطيف، هنا على حاسوبك. | Namaz vakitleri ve yumuşak bir hatırlatma, tam burada, bilgisayarınızda. | Waktu salat dan pengingat yang lembut, di komputer Anda ini. |
| `firstRun.before` | Before you begin | شروع کرنے سے پہلے | قبل أن تبدأ | Başlamadan önce | Sebelum Anda mulai |
| `firstRun.schoolQuestion` | Which school do you follow? | آپ کس مسلک پر چلتے ہیں؟ | أي مذهب تتبع؟ | Hangi mezhebi izliyorsunuz? | Mazhab mana yang Anda ikuti? |
| `firstRun.schoolNote` | This picks the calculation method for you. You can change it later in Settings. | یہ آپ کے لیے حساب کا طریقہ چنتا ہے۔ آپ اسے بعد میں ترتیبات میں بدل سکتے ہیں۔ | هذا يختار لك طريقة الحساب. يمكنك تغييره لاحقًا في الإعدادات. | Bu, sizin için hesaplama yöntemini seçer. Daha sonra Ayarlar'dan değiştirebilirsiniz. | Ini memilihkan metode perhitungan untuk Anda. Bisa diubah nanti di Pengaturan. |
| `firstRun.madhabQuestion` | Which madhab do you follow? | آپ کس مسلک کے مطابق عصر ادا کرتے ہیں؟ | أي مذهب تتبع في العصر؟ | İkindide hangi mezhebi izliyorsunuz? | Mazhab mana yang Anda ikuti untuk Asar? |
| `firstRun.locationQuestion` | Where are you? | آپ کہاں ہیں؟ | أين أنت؟ | Neredesiniz? | Anda di mana? |
| `firstRun.locationNote` | Your times are worked out on this computer from where you are. | آپ کے اوقات اسی کمپیوٹر پر، آپ کے مقام سے حساب کیے جاتے ہیں۔ | تُحسب أوقاتك على هذا الحاسوب من مكانك. | Vakitleriniz bu bilgisayarda, bulunduğunuz yerden hesaplanır. | Waktu Anda dihitung di komputer ini dari tempat Anda berada. |
| `firstRun.skip` | Skip for now and use Makkah | ابھی چھوڑیں اور مکہ مکرمہ استعمال کریں | تجاوز الآن واستخدم مكة المكرمة | Şimdilik geç ve Mekke'yi kullan | Lewati dulu dan pakai Makkah |
| `firstRun.browserNote` | If {browser} is closed or the computer is asleep, no alert can sound. | اگر {browser} بند ہو یا کمپیوٹر سو جائے تو کوئی الرٹ نہیں بج سکتا۔ | إذا كان {browser} مغلقًا أو كان الحاسوب نائمًا، فقد لا يصدر أي تنبيه. | {browser} kapalıysa ya da bilgisayar uyuyorsa hiçbir uyarı sesi çalmaz. | Jika {browser} tertutup atau komputer tidur, pengingat tidak dapat berbunyi. |
| `firstRun.matchTime` | Fajr time | فجر کا وقت | وقت الفجر | Sabah vakti | Waktu Subuh |
| `firstRun.farAway` | None of the methods is close to your mosque. Your mosque could be following its own timetable. Pick the closest, then use Match your mosque in Settings to adjust each prayer by minutes. | کوئی بھی طریقہ آپ کی مسجد کے قریب نہیں۔ آپ کی مسجد اپنا ٹائم ٹیبل استعمال کر رہی ہو گی۔ قریب ترین چنیں، پھر ترتیبات میں اپنی مسجد سے ملائیں سے ہر نماز کے منٹ ایڈجسٹ کریں۔ | لا توجد طريقة قريبة من مسجدك. قد يكون مسجدك يتبع جدوله الخاص. اختر الأقرب، ثم استخدم خيار طابِق مسجدك في الإعدادات لتعديل كل صلاة بالدقائق. | Yöntemlerin hiçbiri caminize yakın değil. Caminiz kendi takvimini izliyor olabilir. En yakınını seçin, sonra Ayarlar'da Camiye göre ayarla ile her namazı dakika olarak düzeltin. | Tidak ada metode yang dekat dengan masjid Anda. Masjid Anda mungkin memakai jadwalnya sendiri. Pilih yang terdekat, lalu pakai Sesuaikan dengan masjid di Pengaturan untuk menyesuaikan tiap salat dalam menit. |
| `location.browserNote` | Your browser asks its location service. SajdaTime only receives the coordinates. | آپ کا براؤزر اپنی لوکیشن سروس سے پوچھتا ہے۔ SajdaTime کو صرف کوآرڈینیٹ ملتے ہیں۔ | يسأل متصفحك خدمة الموقع لديه. ولا تستلم SajdaTime إلا الإحداثيات. | Tarayıcınız kendi konum servisine sorar. SajdaTime'a yalnızca koordinatlar ulaşır. | Peramban Anda bertanya ke layanan lokasinya. SajdaTime hanya menerima koordinatnya. |
| `location.useMakkah` | Use Makkah instead | اس کے بجائے مکہ مکرمہ استعمال کریں | استخدم مكة المكرمة بدلًا من ذلك | Bunun yerine Mekke'yi kullan | Pakai Makkah saja |
| `times.setPlace` | Set your place again | اپنا مقام دوبارہ مقرر کریں | حدّد مكانك من جديد | Yerinizi yeniden belirleyin | Tentukan tempat Anda lagi |
| `times.ramadanBegins` | Ramadan begins on {date} | رمضان {date} کو شروع ہوگا | يبدأ رمضان في {date} | Ramazan {date} tarihinde başlıyor | Ramadan mulai {date} |
| `times.polar` | These times are estimated from a place where the sun rises and sets, because they cannot be worked out directly here. | یہ اوقات ایسے مقام سے اندازہ لگائے گئے ہیں جہاں سورج طلوع اور غروب ہوتا ہے، کیونکہ یہاں یہ براہِ راست حساب نہیں ہو سکتے۔ | هذه الأوقات مقدّرة من مكان تشرق فيه الشمس وتغرب، لأنها لا تُحسب هنا مباشرة. | Bu vakitler, güneşin doğup battığı bir yerden tahmin edildi, çünkü burada doğrudan hesaplanamıyor. | Waktu ini diperkirakan dari tempat yang mataharinya terbit dan terbenam, karena di sini tidak dapat dihitung langsung. |
| `settings.testAlert` | Send a test alert | آزمائشی الرٹ بھیجیں | أرسل تنبيهًا تجريبيًا | Deneme uyarısı gönder | Kirim pengingat percobaan |
| `settings.testNote` | If nothing appears, check your computer's notification and Focus settings. | اگر کچھ نظر نہ آئے تو اپنے کمپیوٹر کی نوٹیفکیشن اور فوکس ترتیبات دیکھیں۔ | إن لم يظهر شيء، فتحقق من إعدادات الإشعارات والتركيز في حاسوبك. | Bir şey görünmezse bilgisayarınızın bildirim ve Odak ayarlarını denetleyin. | Jika tidak ada yang muncul, periksa pengaturan notifikasi dan Fokus di komputer Anda. |
| `settings.blockedLine` | {browser} is not allowed to show notifications for SajdaTime, so the alert cannot appear. | {browser} کو SajdaTime کی نوٹیفکیشن دکھانے کی اجازت نہیں، اس لیے الرٹ ظاہر نہیں ہو سکتا۔ | {browser} غير مسموح له بإظهار إشعارات SajdaTime، لذلك لا يمكن أن يظهر التنبيه. | {browser} uygulamasının SajdaTime bildirimlerini göstermesine izin verilmiyor, bu yüzden uyarı görünemez. | {browser} tidak diizinkan menampilkan notifikasi SajdaTime, jadi pengingat tidak dapat muncul. |
| `settings.sound` | Sound | آواز | الصوت | Ses | Suara |
| `notice.offlineTitle` | {browser} needs to be open | {browser} کھلا ہونا ضروری ہے | يجب أن يكون {browser} مفتوحًا | {browser} açık olmalı | {browser} harus terbuka |
| `notice.offlineLine` | If {browser} is closed or the computer is asleep, no alert can sound. | اگر {browser} بند ہو یا کمپیوٹر سو جائے تو کوئی الرٹ نہیں بج سکتا۔ | إذا كان {browser} مغلقًا أو كان الحاسوب نائمًا، فقد لا يصدر أي تنبيه. | {browser} kapalıysa ya da bilgisayar uyuyorsa hiçbir uyarı sesi çalmaz. | Jika {browser} tertutup atau komputer tidur, pengingat tidak dapat berbunyi. |
| `alerts.iftar` | It is time for Maghrib. You can break your fast. | مغرب کا وقت ہو گیا ہے۔ آپ روزہ افطار کر سکتے ہیں۔ | حان وقت المغرب. يمكنك أن تفطر. | Akşam vakti girdi. Orucunuzu açabilirsiniz. | Sudah masuk Magrib. Anda dapat berbuka. |
| `alerts.prayerInPlace` | It is time for {prayer} in {place}. | {place} میں {prayer} کا وقت ہو گیا ہے۔ | حان وقت {prayer} في {place}. | {place} için {prayer} vakti girdi. | Sudah masuk waktu {prayer} di {place}. |
| `alerts.reminderTitle` | {prayer} in {minutes} minutes | {prayer} {minutes} منٹ میں | {prayer} بعد {minutes} دقائق | {prayer} {minutes} dakika sonra | {prayer} dalam {minutes} menit |
| `alerts.reminderBody` | {prayer} begins at {time}. | {prayer} {time} پر شروع ہوتی ہے۔ | يدخل وقت {prayer} الساعة {time}. | {prayer} {time} itibarıyla başlıyor. | {prayer} masuk pukul {time}. |
| `alerts.suhoorTitle` | Suhoor ends at {time} | سحری {time} پر ختم ہوتی ہے | ينتهي السحور الساعة {time} | Sahur {time} itibarıyla bitiyor | Sahur berakhir pukul {time} |
| `alerts.suhoorBody` | Fajr begins in {minutes} minutes. | فجر {minutes} منٹ میں شروع ہوگی۔ | يدخل الفجر بعد {minutes} دقائق. | Sabah {minutes} dakika sonra başlıyor. | Subuh masuk dalam {minutes} menit. |
| `alerts.setup` | SajdaTime: set up your prayer times | SajdaTime: اپنے اوقاتِ نماز ترتیب دیں | SajdaTime: جهّز أوقات صلاتك | SajdaTime: namaz vakitlerinizi ayarlayın | SajdaTime: siapkan waktu salat Anda |
| `alerts.badgeTitle` | SajdaTime: {prayer} in {wait} ({time}) | SajdaTime: {prayer} {wait} میں ({time}) | SajdaTime: {prayer} بعد {wait} ({time}) | SajdaTime: {prayer} {wait} sonra ({time}) | SajdaTime: {prayer} dalam {wait} ({time}) |
| `alerts.stopSound` | Stop sound | آواز روکیں | إيقاف الصوت | Sesi durdur | Hentikan suara |
| `alerts.testTitle` | Test alert | آزمائشی الرٹ | تنبيه تجريبي | Deneme uyarısı | Pengingat percobaan |
| `alerts.testBody` | This is how a prayer alert looks. | نماز کے الرٹ کی شکل ایسی ہوتی ہے۔ | هكذا يبدو تنبيه الصلاة. | Namaz uyarısı böyle görünür. | Beginilah tampilan pengingat salat. |
| `print.footer` | Worked out by SajdaTime for the place above. Not supplied by any mosque, scholar or authority. If your mosque's times differ, follow your mosque. | اوپر کے مقام کے لیے SajdaTime نے حساب کیا۔ یہ کسی مسجد، عالم یا اتھارٹی کی طرف سے نہیں۔ اگر آپ کی مسجد کے اوقات مختلف ہوں تو انہی کی پیروی کریں۔ | حسبتها SajdaTime للمكان أعلاه. وهي ليست من مسجد ولا عالم ولا أي جهة. وإذا اختلفت أوقات مسجدك، فاتبع مسجدك. | Yukarıdaki yer için SajdaTime tarafından hesaplandı. Bir cami, âlim ya da otorite tarafından verilmedi. Caminizin vakitleri farklıysa caminize uyun. | Dihitung oleh SajdaTime untuk tempat di atas. Bukan dari masjid, ulama, atau otoritas. Jika waktu masjid Anda berbeda, ikutilah masjid Anda. |
| `print.captionMonth` | {title} prayer times | {title} کے اوقاتِ نماز | أوقات الصلاة في {title} | {title} namaz vakitleri | Waktu salat {title} |
| `print.captionRamadan` | Ramadan timetable for {town} | {town} کا رمضان ٹائم ٹیبل | جدول رمضان في {town} | {town} ramazan takvimi | Jadwal ramadan {town} |
| `print.tabMonth` | SajdaTime timetable, {title} | SajdaTime ٹائم ٹیبل، {title} | جدول SajdaTime، {title} | SajdaTime takvimi, {title} | Jadwal SajdaTime, {title} |
| `print.tabRamadan` | SajdaTime Ramadan timetable | SajdaTime رمضان ٹائم ٹیبل | جدول رمضان من SajdaTime | SajdaTime ramazan takvimi | Jadwal ramadan SajdaTime |
| `settings.creditCity` | City data from GeoNames, CC BY 4.0. | شہروں کا ڈیٹا GeoNames سے، CC BY 4.0۔ | بيانات المدن من GeoNames، رخصة CC BY 4.0. | Şehir verileri GeoNames, CC BY 4.0. | Data kota dari GeoNames, CC BY 4.0. |
| `settings.creditShia` | Shia adhan: sung by Saeed Hatamzadeh-Varmazyar, CC BY-SA 4.0. | شیعہ اذان: Saeed Hatamzadeh-Varmazyar کی آواز میں، CC BY-SA 4.0۔ | أذان شيعي: بصوت Saeed Hatamzadeh-Varmazyar، رخصة CC BY-SA 4.0. | Şii ezan: Saeed Hatamzadeh-Varmazyar seslendirmesi, CC BY-SA 4.0. | Azan Syiah: dinyanyikan Saeed Hatamzadeh-Varmazyar, CC BY-SA 4.0. |
| `settings.minutesBefore` | {count} minutes before | {count} منٹ پہلے | قبل {count} دقائق | {count} dakika önce | {count} menit sebelumnya |
| `times.nextAria` | {prayer} at {time}, {wait} until it begins | {prayer}، {time} پر، شروع ہونے تک {wait} | {prayer} عند {time}، {wait} حتى يدخل وقتها | {prayer} {time} itibarıyla, başlamasına {wait} | {prayer} pukul {time}, {wait} sampai masuk waktunya |
| `times.countdownAria` | {wait} until {prayer} | {prayer} تک {wait} | {wait} حتى يدخل وقت {prayer} | {prayer} vaktine {wait} | {wait} sampai masuk waktu {prayer} |
| `settings.yourCountry` | your country | آپ کا ملک | بلدك | ülkeniz | negara Anda |
| `settings.daysLater` | {count} days later | {count} دن بعد | {count} أيام بعد | {count} gün sonra | {count} hari kemudian |
| `settings.daysEarlier` | {count} days earlier | {count} دن پہلے | {count} أيام قبل | {count} gün önce | {count} hari sebelumnya |
| `settings.minutesBeforeFajr` | {count} minutes before Fajr | فجر سے {count} منٹ پہلے | قبل الفجر {count} دقيقة | Sabah vaktinden {count} dakika önce | {count} menit sebelum Subuh |
| `settings.methodHintTimes` | Today's Fajr and Isha in {place} are shown for each one, so you can compare with your mosque. | {place} میں آج فجر اور عشاء دکھائی گئی ہیں تاکہ آپ اپنی مسجد سے موازنہ کر سکیں۔ | يُعرض فجر اليوم وعشاؤه في {place} مع كل طريقة، ليمكنك المقارنة بمسجدك. | Bugünün Sabah ve Yatsı vakitleri {place} için her yöntemin yanında gösterilir, böylece caminizle karşılaştırabilirsiniz. | Waktu Subuh dan Isya hari ini di {place} ditampilkan di setiap metode, supaya Anda dapat membandingkannya dengan masjid Anda. |
