import GLib from 'gi://GLib';
import {
  EXTRA_APP_TITLES,
  EXTRA_LANGUAGE_NAMES,
  EXTRA_REGION_SUFFIXES,
  EXTRA_SOUND_SETTINGS,
  EXTRA_VOICE_HELP,
  EXTRA_TRANSLATIONS,
  EXTRA_VOICE_LEVEL_TRANSLATIONS,
  EXTRA_ABOUT_TRANSLATIONS,
  EXTRA_ABOUT_ROW_TITLES,
} from './locale-extra.js';

export const LANGUAGE_NAMES = {
  auto: 'Auto',
  uk: 'Українська',
  en: 'English',
  de: 'Deutsch',
  pl: 'Polski',
  zh_CN: '简体中文',
  ja: '日本語',
  ...EXTRA_LANGUAGE_NAMES,
};

export const LANGUAGE_CODES = [
  'auto', 'uk', 'en',
  ...Object.keys(LANGUAGE_NAMES)
    .filter(code => !['auto', 'uk', 'en'].includes(code))
    .sort((left, right) => LANGUAGE_NAMES[left].localeCompare(LANGUAGE_NAMES[right], 'en')),
];

const translations = {
  uk: {
    title: 'Монітор тривог',
    loading: 'Завантаження даних…',
    mapDataError: 'Не вдалося завантажити дані карти',
    locate: 'Визначити місце',
    refresh: 'Оновити дані тривог',
    settings: 'Налаштування розширення',
    legendAlert: 'Тривога',
    legendClear: 'Без активних тривог',
    locationWait: 'Очікування геолокації…',
    locationDenied: 'Геолокацію не дозволено системою',
    locationUnknown: 'Не вдалося визначити область',
    locationReadError: 'Не вдалося прочитати координати',
    locationSet: 'Визначено: {region}',
    refreshing: 'Оновлення даних…',
    activeCount: 'Активних записів: {count} · оновлення раз на 2 хв',
    noAlerts: 'Активних тривог немає · оновлення раз на 2 хв',
    updateError: 'Помилка оновлення: {error}',
    publicStatus: 'Джерело: ubilling.net.ua · областей із тривогою: {count}{cached}',
    cached: ' · кеш: {time}',
    publicError: 'Публічний фід недоступний: {error}',
    districtUnknown: 'Район не визначено',
    districtSuffix: 'район',
    regionSuffix: 'область',
    preferencesGroup: 'Сповіщення',
    token: 'API-токен alerts.in.ua',
    oblast: 'Моя область',
    oblastSubtitle: 'Область для сусідніх тривог',
    district: 'Мій район',
    districtSubtitle: 'Лише райони вибраної області',
    noneSelected: 'Не вибрано',
    language: 'Мова інтерфейсу',
    languageSubtitle: 'Автоматично: українська для системної мови uk',
    systemLanguage: 'За мовою системи (укр./англ.)',
    settingsPage: 'Налаштування',
    aboutPage: 'Про розширення',
    aboutGroup: 'Про розширення',
    aboutDescription: 'Відстежує повітряні тривоги по районах України та сповіщає про них.',
    aboutAuthor: 'Автор',
    aboutEmail: 'Електронна пошта',
    legalTitle: 'Юридична інформація',
    legalCodeGroup: 'Авторське право та ліцензія',
    legalCopyright: '© 2026 Євген Горемикін. Код розширення поширюється за GPL-2.0-or-later. Ліцензія дозволяє використання, копіювання та зміну коду відповідно до її умов; для поширюваних похідних версій діють вимоги GPL щодо повідомлень і вихідного коду.',
    legalDataGroup: 'Сторонні дані',
    legalGeoTitle: 'Межі областей',
    legalGeoDetails: 'На основі geoBoundaries ADM1 для України; адаптовано для цього розширення. Ліцензія даних — CC BY 4.0 з вимогою атрибуції.',
    legalOchaTitle: 'Межі районів і довідник громад',
    legalOchaDetails: 'На основі OCHA Ukraine COD-AB, версія 05; адаптовано для цього розширення. Ліцензія даних — CC BY-IGO 3.0.',
    legalSourceGroup: 'Джерела даних і приватність',
    legalAlertSource: 'Дані тривог',
    legalAlertSourceDetails: 'Дані отримуються від alerts.in.ua або ubilling.net.ua. Якщо налаштовано API-токен, його передають alerts.in.ua для автентифікації запиту. Це незалежні сторонні сервіси; їхні умови й політики приватності застосовуються окремо.',
    legalLocation: 'Геолокація',
    legalLocationDetails: 'Розширення використовує координати GeoClue локально для визначення області й району та не надсилає їх сервісам даних тривог. Системний GeoClue або його постачальник локації може мати власну мережеву поведінку.',
    legalVoiceFiles: 'Власні голосові файли',
    legalVoiceFilesDetails: 'Користувач відповідає за наявність прав і дозволів на аудіофайли, які додає самостійно.',
    legalDisclaimerGroup: 'Застереження',
    legalDisclaimer: 'Це незалежне розширення, а не офіційна державна чи екстрена система оповіщення. Дані можуть бути неповними, неточними, затриманими або недоступними. Не покладайтеся на розширення як на єдине джерело інформації для безпеки. Програмне забезпечення та дані надаються «як є», без гарантій, у межах, дозволених законом; ніщо тут не виключає відповідальність, яку закон забороняє виключати.',
    legalSourceLink: 'Джерело',
    legalLicenseLink: 'Ліцензія',
    paypal: 'PayPal',
    copy: 'Копіювати',
    copied: 'Скопійовано',
    donations: 'Підтримати автора',
    monoUkraine: 'Monobank · Україна',
    swiftGroup: 'SWIFT · міжнародний переказ',
    swiftEuroIban: 'IBAN · EUR',
    swiftUsdIban: 'IBAN · USD',
    swiftBic: 'SWIFT/BIC Code',
    accountHolder: 'Отримувач',
    bankAddress: 'Адреса отримувача',
    soundGroup: 'Звукове оповіщення',
    soundModeSubtitle: 'Морзе повторюється 8 разів; сирена звучить тричі',
    soundOff: 'Вимкнене',
    soundMorse: 'Морзе',
    soundSiren: 'Сирена',
    soundVoice: 'Голосове попередження',
    voiceLevel: 'Рівень небезпеки для озвучення',
    voiceLevelSubtitle: 'Виберіть, для якого рівня небезпеки відтворювати власний запис',
    voiceStandard: 'Стандартно',
    voiceYellowOnly: 'Лише жовтий',
    voiceRedOnly: 'Лише червоний',
    voiceAllLevels: 'Усі рівні',
    voiceAll: 'Усі рівні',
    voiceYellow: 'Жовта',
    voiceRed: 'Червона',
    voiceFilesHint: 'Власні MP3-файли покладіть у data/voice/: alert-voice-uk-all.mp3, alert-voice-uk-yellow.mp3 та alert-voice-uk-red.mp3. «Стандартно» використовує all; «Лише жовтий/Лише червоний» фільтрує відповідний рівень; «Усі рівні» вибирає yellow або red за небезпекою. Для інших мов замініть uk на код мови.',
  },
  en: {
    title: 'Air Alert Monitor',
    loading: 'Loading data…',
    mapDataError: 'Could not load map data',
    locate: 'Detect location',
    refresh: 'Refresh alert data',
    settings: 'Extension settings',
    legendAlert: 'Alert',
    legendClear: 'No active alerts',
    locationWait: 'Waiting for location…',
    locationDenied: 'Location access denied by the system',
    locationUnknown: 'Could not determine the region',
    locationReadError: 'Could not read coordinates',
    locationSet: 'Detected: {region}',
    refreshing: 'Refreshing data…',
    activeCount: 'Active records: {count} · refresh every 2 min',
    noAlerts: 'No active alerts · refresh every 2 min',
    updateError: 'Update failed: {error}',
    publicStatus: 'Source: ubilling.net.ua · alert regions: {count}{cached}',
    cached: ' · cached: {time}',
    publicError: 'Public feed unavailable: {error}',
    districtUnknown: 'District not identified',
    districtSuffix: 'District',
    regionSuffix: 'Oblast',
    preferencesGroup: 'Alerts',
    token: 'alerts.in.ua API token',
    oblast: 'My region',
    oblastSubtitle: 'Region used to check nearby alerts',
    district: 'My district',
    districtSubtitle: 'Only districts in the selected region',
    noneSelected: 'Not selected',
    language: 'Interface language',
    languageSubtitle: 'Automatic: Ukrainian only when the system language is Ukrainian',
    systemLanguage: 'System language (UA/EN)',
    settingsPage: 'Settings',
    aboutPage: 'About the extension',
    aboutGroup: 'About the extension',
    aboutDescription: 'Tracks air alerts by district in Ukraine and notifies you about them.',
    aboutAuthor: 'Author',
    aboutEmail: 'Email',
    legalTitle: 'Legal information',
    legalCodeGroup: 'Copyright and license',
    legalCopyright: '© 2026 Yevhen Horemykin. The extension code is licensed under GPL-2.0-or-later. The license permits use, copying, and modification under its terms; distributed derivative versions must follow the GPL requirements for notices and source code.',
    legalDataGroup: 'Third-party data',
    legalGeoTitle: 'Oblast boundaries',
    legalGeoDetails: 'Based on geoBoundaries ADM1 for Ukraine and adapted for this extension. Data license: CC BY 4.0, with attribution required.',
    legalOchaTitle: 'District boundaries and community lookup',
    legalOchaDetails: 'Based on OCHA Ukraine COD-AB, version 05, and adapted for this extension. Data license: CC BY-IGO 3.0.',
    legalSourceGroup: 'Data sources and privacy',
    legalAlertSource: 'Alert data',
    legalAlertSourceDetails: 'Data is obtained from alerts.in.ua or ubilling.net.ua. If configured, the API token is sent to alerts.in.ua to authenticate requests. These independent third-party services have their own terms and privacy policies.',
    legalLocation: 'Geolocation',
    legalLocationDetails: 'The extension processes GeoClue coordinates locally to determine the oblast and district and does not send them to alert-data services. The system GeoClue service or its location provider may have separate network behavior.',
    legalVoiceFiles: 'Custom voice recordings',
    legalVoiceFilesDetails: 'Users are responsible for having the rights and permissions for any audio files they add.',
    legalDisclaimerGroup: 'Disclaimer',
    legalDisclaimer: 'This is an independent extension, not an official government or emergency alert service. Data may be incomplete, inaccurate, delayed, or unavailable. Do not rely on this extension as your sole source of safety information. Software and data are provided “as is,” without warranties, to the extent permitted by law; nothing here excludes liability that cannot legally be excluded.',
    legalSourceLink: 'Source',
    legalLicenseLink: 'License',
    paypal: 'PayPal',
    copy: 'Copy',
    copied: 'Copied',
    donations: 'Support the author',
    monoUkraine: 'Monobank · Ukraine',
    swiftGroup: 'SWIFT · international transfer',
    swiftEuroIban: 'IBAN · EUR',
    swiftUsdIban: 'IBAN · USD',
    swiftBic: 'SWIFT/BIC Code',
    accountHolder: 'Account holder',
    bankAddress: 'Beneficiary address',
    soundGroup: 'Sound alerts',
    soundModeSubtitle: 'Morse repeats eight times; siren plays three times',
    soundOff: 'Off',
    soundMorse: 'Morse code',
    soundSiren: 'Siren',
    soundVoice: 'Voice alert',
    voiceLevel: 'Danger level for voice alert',
    voiceLevelSubtitle: 'Choose which danger level triggers a custom recording',
    voiceStandard: 'Standard',
    voiceYellowOnly: 'Yellow only',
    voiceRedOnly: 'Red only',
    voiceAllLevels: 'All levels',
    voiceAll: 'All levels',
    voiceYellow: 'Yellow',
    voiceRed: 'Red',
    voiceFilesHint: 'Place custom MP3 files in data/voice/: alert-voice-en-all.mp3, alert-voice-en-yellow.mp3, and alert-voice-en-red.mp3. “Standard” uses all; “Yellow only”/“Red only” filter the corresponding level; “All levels” uses yellow or red according to the danger. Replace en with the language code for other languages.',
  },
  de: {
    title: 'Luftalarm-Monitor',
    loading: 'Daten werden geladen…',
    locate: 'Standort bestimmen',
    refresh: 'Alarmdaten aktualisieren',
    settings: 'Erweiterungseinstellungen',
    legendAlert: 'Alarm',
    legendClear: 'Keine aktiven Alarme',
    locationWait: 'Warte auf Standort…',
    locationDenied: 'Standortzugriff vom System verweigert',
    locationUnknown: 'Region konnte nicht bestimmt werden',
    locationReadError: 'Koordinaten konnten nicht gelesen werden',
    locationSet: 'Erkannt: {region}',
    refreshing: 'Daten werden aktualisiert…',
    activeCount: 'Aktive Meldungen: {count} · Aktualisierung alle 2 Min.',
    noAlerts: 'Keine aktiven Alarme · Aktualisierung alle 2 Min.',
    updateError: 'Aktualisierung fehlgeschlagen: {error}',
    publicStatus: 'Quelle: ubilling.net.ua · Alarmregionen: {count}{cached}',
    cached: ' · Cache: {time}',
    publicError: 'Öffentlicher Feed nicht verfügbar: {error}',
    districtUnknown: 'Bezirk nicht erkannt',
    districtSuffix: 'Bezirk',
    regionSuffix: 'Oblast',
    preferencesGroup: 'Warnmeldungen',
    token: 'alerts.in.ua API-Token',
    oblast: 'Meine Region',
    oblastSubtitle: 'Region zur Prüfung benachbarter Alarme',
    district: 'Mein Bezirk',
    districtSubtitle: 'Nur Bezirke der ausgewählten Region',
    noneSelected: 'Nicht ausgewählt',
    language: 'Oberflächensprache',
    languageSubtitle: 'Automatisch: Ukrainisch nur bei ukrainischer Systemsprache',
    systemLanguage: 'Systemsprache (UA/EN)',
  },
  pl: {
    title: 'Monitor alarmów lotniczych',
    loading: 'Wczytywanie danych…',
    locate: 'Wykryj lokalizację',
    refresh: 'Odśwież dane o alarmach',
    settings: 'Ustawienia rozszerzenia',
    legendAlert: 'Alarm',
    legendClear: 'Brak aktywnych alarmów',
    locationWait: 'Oczekiwanie na lokalizację…',
    locationDenied: 'System odmówił dostępu do lokalizacji',
    locationUnknown: 'Nie można ustalić obwodu',
    locationReadError: 'Nie można odczytać współrzędnych',
    locationSet: 'Wykryto: {region}',
    refreshing: 'Odświeżanie danych…',
    activeCount: 'Aktywne wpisy: {count} · odświeżanie co 2 min',
    noAlerts: 'Brak aktywnych alarmów · odświeżanie co 2 min',
    updateError: 'Błąd aktualizacji: {error}',
    publicStatus: 'Źródło: ubilling.net.ua · obwody z alarmem: {count}{cached}',
    cached: ' · pamięć podręczna: {time}',
    publicError: 'Publiczny kanał jest niedostępny: {error}',
    districtUnknown: 'Nie rozpoznano rejonu',
    districtSuffix: 'rejon',
    regionSuffix: 'obwód',
    preferencesGroup: 'Alarmy',
    token: 'Token API alerts.in.ua',
    oblast: 'Mój obwód',
    oblastSubtitle: 'Obwód do sprawdzania pobliskich alarmów',
    district: 'Mój rejon',
    districtSubtitle: 'Tylko rejony wybranego obwodu',
    noneSelected: 'Nie wybrano',
    language: 'Język interfejsu',
    languageSubtitle: 'Automatycznie: ukraiński tylko przy ukraińskim języku systemu',
    systemLanguage: 'Język systemu (UA/EN)',
  },
  zh_CN: {
    title: '乌克兰警报监视器',
    loading: '正在加载数据…',
    locate: '检测位置',
    refresh: '刷新警报数据',
    settings: '扩展设置',
    legendAlert: '警报',
    legendClear: '无活动警报',
    locationWait: '正在等待位置信息…',
    locationDenied: '系统拒绝了位置访问',
    locationUnknown: '无法确定地区',
    locationReadError: '无法读取坐标',
    locationSet: '检测到：{region}',
    refreshing: '正在刷新数据…',
    activeCount: '活动记录：{count} · 每 2 分钟刷新',
    noAlerts: '无活动警报 · 每 2 分钟刷新',
    updateError: '更新失败：{error}',
    publicStatus: '来源：ubilling.net.ua · 有警报的地区：{count}{cached}',
    cached: ' · 缓存：{time}',
    publicError: '公共数据源不可用：{error}',
    districtUnknown: '无法识别区',
    districtSuffix: '区',
    regionSuffix: '州',
    preferencesGroup: '警报',
    token: 'alerts.in.ua API 令牌',
    oblast: '我的州',
    oblastSubtitle: '用于检查附近警报的地区',
    district: '我的区',
    districtSubtitle: '仅显示所选地区的区',
    noneSelected: '未选择',
    language: '界面语言',
    languageSubtitle: '自动：系统语言为乌克兰语时使用乌克兰语',
    systemLanguage: '系统语言（乌克兰语/英语）',
  },
  ja: {
    title: 'ウクライナ警報モニター',
    loading: 'データを読み込み中…',
    locate: '位置を検出',
    refresh: '警報データを更新',
    settings: '拡張機能の設定',
    legendAlert: '警報',
    legendClear: '現在警報なし',
    locationWait: '位置情報を取得中…',
    locationDenied: 'システムにより位置情報が拒否されました',
    locationUnknown: '州を特定できませんでした',
    locationReadError: '座標を読み取れませんでした',
    locationSet: '検出：{region}',
    refreshing: 'データを更新中…',
    activeCount: '有効な記録：{count} · 2分ごとに更新',
    noAlerts: '現在警報はありません · 2分ごとに更新',
    updateError: '更新に失敗しました：{error}',
    publicStatus: '情報源：ubilling.net.ua · 警報中の州：{count}{cached}',
    cached: ' · キャッシュ：{time}',
    publicError: '公開フィードを利用できません：{error}',
    districtUnknown: '地区を特定できません',
    districtSuffix: '地区',
    regionSuffix: '州',
    preferencesGroup: '警報',
    token: 'alerts.in.ua API トークン',
    oblast: '州',
    oblastSubtitle: '近隣の警報を確認する州',
    district: '地区',
    districtSubtitle: '選択した州の地区のみ表示',
    noneSelected: '未選択',
    language: '表示言語',
    languageSubtitle: '自動：システム言語がウクライナ語の場合のみウクライナ語',
    systemLanguage: 'システム言語（ウクライナ語/英語）',
  },
};

const extraSoundKeys = [
  'soundGroup', 'soundModeSubtitle', 'soundOff', 'soundMorse', 'soundSiren',
  'soundVoice', 'voiceLevel', 'voiceAll', 'voiceYellow', 'voiceRed',
];

for (const [language, translatedStrings] of Object.entries(EXTRA_TRANSLATIONS))
  translations[language] = {
    ...translations.en,
    regionSuffix: EXTRA_REGION_SUFFIXES[language] ?? 'Oblast',
    ...translatedStrings,
    ...Object.fromEntries((EXTRA_SOUND_SETTINGS[language] ?? []).map((value, index) =>
      [extraSoundKeys[index], value])),
    voiceLevelSubtitle: EXTRA_VOICE_HELP[language]?.[0] ?? translations.en.voiceLevelSubtitle,
    voiceFilesHint: EXTRA_VOICE_HELP[language]?.[1] ?? translations.en.voiceFilesHint,
  };

for (const [language, title] of Object.entries(EXTRA_APP_TITLES))
  translations[language].title = title;

for (const [language, voiceLevelStrings] of Object.entries(EXTRA_VOICE_LEVEL_TRANSLATIONS)) {
  if (!translations[language])
    continue;
  Object.assign(translations[language], {
    voiceLevel: voiceLevelStrings[0],
    voiceLevelSubtitle: voiceLevelStrings[1],
    voiceStandard: voiceLevelStrings[2],
    voiceYellowOnly: voiceLevelStrings[3],
    voiceRedOnly: voiceLevelStrings[4],
    voiceAllLevels: voiceLevelStrings[5],
  });
}

const extraAboutKeys = [
  'aboutPage', 'aboutDescription', 'aboutAuthor', 'aboutEmail', 'legalTitle',
  'donations', 'copy', 'legalCodeGroup', 'legalDataGroup', 'legalSourceGroup',
  'legalDisclaimerGroup', 'monoUkraine', 'swiftGroup', 'accountHolder',
  'bankAddress', 'legalSourceLink', 'legalLicenseLink',
];

for (const [language, aboutStrings] of Object.entries(EXTRA_ABOUT_TRANSLATIONS)) {
  if (!translations[language])
    continue;
  const localized = Object.fromEntries(aboutStrings.map((value, index) =>
    [extraAboutKeys[index], value]));
  localized.aboutGroup = localized.aboutPage;
  localized.swiftEuroIban = 'IBAN · EUR';
  localized.swiftUsdIban = 'IBAN · USD';
  localized.swiftBic = 'SWIFT/BIC';
  localized.paypal = 'PayPal';
  const rowTitles = EXTRA_ABOUT_ROW_TITLES[language];
  if (rowTitles) {
    localized.legalGeoTitle = rowTitles[0];
    localized.legalOchaTitle = rowTitles[1];
    localized.legalAlertSource = rowTitles[2];
    localized.legalLocation = rowTitles[3];
    localized.legalVoiceFiles = rowTitles[4];
  }
  Object.assign(translations[language], localized);
}

for (const [language, soundSettings] of Object.entries(EXTRA_SOUND_SETTINGS)) {
  if (!translations[language])
    continue;
  Object.assign(translations[language], Object.fromEntries(soundSettings.map((value, index) =>
    [extraSoundKeys[index], value])));
  if (EXTRA_VOICE_HELP[language]) {
    translations[language].voiceLevelSubtitle = EXTRA_VOICE_HELP[language][0];
    translations[language].voiceFilesHint =
      EXTRA_VOICE_HELP[language][1].replace('<yellow|red>', '<all|yellow|red>');
  }
}

export function resolveLanguage(mode = 'auto') {
  if (mode !== 'auto' && translations[mode])
    return mode;
  const systemLanguage = GLib.get_language_names()
    .map(language => language.toLowerCase())
    .find(language => language !== 'c' && language !== 'posix') ?? 'en';
  return systemLanguage.startsWith('uk') ? 'uk' : 'en';
}

export function translate(mode, key, values = {}) {
  let text = translations[resolveLanguage(mode)][key] ?? translations.en[key] ?? key;
  for (const [name, value] of Object.entries(values))
    text = text.split(`{${name}}`).join(String(value));
  return text;
}

const ENGLISH_REGION_NAMES = {
  'Автономна Республіка Крим': 'Autonomous Republic of Crimea',
  'Вінницька область': 'Vinnytsia',
  'Волинська область': 'Volyn',
  'Дніпропетровська область': 'Dnipropetrovsk',
  'Донецька область': 'Donetsk',
  'Житомирська область': 'Zhytomyr',
  'Закарпатська область': 'Zakarpattia',
  'Запорізька область': 'Zaporizhzhia',
  'Івано-Франківська область': 'Ivano-Frankivsk',
  'м. Київ': 'Kyiv',
  'Київська область': 'Kyiv',
  'Кіровоградська область': 'Kirovohrad',
  'м. Севастополь': 'Sevastopol',
  'Луганська область': 'Luhansk',
  'Львівська область': 'Lviv',
  'Миколаївська область': 'Mykolaiv',
  'Одеська область': 'Odesa',
  'Полтавська область': 'Poltava',
  'Рівненська область': 'Rivne',
  'Сумська область': 'Sumy',
  'Тернопільська область': 'Ternopil',
  'Харківська область': 'Kharkiv',
  'Херсонська область': 'Kherson',
  'Хмельницька область': 'Khmelnytskyi',
  'Черкаська область': 'Cherkasy',
  'Чернігівська область': 'Chernihiv',
  'Чернівецька область': 'Chernivtsi',
};

const UKRAINIAN_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya',
};

export function localizePlaceName(value, mode = 'auto') {
  if (resolveLanguage(mode) === 'uk')
    return value;
  return [...value].map((character, index) => {
    const lower = character.toLocaleLowerCase('uk');
    let latin = UKRAINIAN_LATIN[lower] ?? character;
    if ((lower === 'є' || lower === 'ї') && index > 0)
      latin = lower === 'є' ? 'ie' : 'i';
    return character === character.toLocaleUpperCase('uk')
      ? latin.charAt(0).toLocaleUpperCase('en') + latin.slice(1) : latin;
  }).join('');
}

export function localizeRegionName(value, mode = 'auto') {
  if (resolveLanguage(mode) === 'uk')
    return value;
  const name = ENGLISH_REGION_NAMES[value] ?? localizePlaceName(value, mode);
  return value.startsWith('м.') || value === 'Автономна Республіка Крим'
    ? name : `${name} ${translate(mode, 'regionSuffix')}`;
}