import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk?version=4.0';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {
  LANGUAGE_CODES,
  LANGUAGE_NAMES,
  localizePlaceName,
  localizeRegionName,
  resolveLanguage,
  translate,
} from './locale.js';

const REGION_NAMES = [
  'Автономна Республіка Крим', 'Вінницька область', 'Волинська область',
  'Дніпропетровська область', 'Донецька область', 'Житомирська область',
  'Закарпатська область', 'Запорізька область', 'Івано-Франківська область',
  'м. Київ', 'Київська область', 'Кіровоградська область', 'м. Севастополь',
  'Луганська область', 'Львівська область', 'Миколаївська область',
  'Одеська область', 'Полтавська область', 'Рівненська область', 'Сумська область',
  'Тернопільська область', 'Харківська область', 'Херсонська область',
  'Хмельницька область', 'Черкаська область', 'Чернігівська область',
  'Чернівецька область',
];

export default class AirAlertPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const t = (key, values = {}) =>
      translate(settings.get_string('ui-language'), key, values);
    const page = new Adw.PreferencesPage({
      title: t('settingsPage'),
      icon_name: 'preferences-system-symbolic',
    });
    const group = new Adw.PreferencesGroup({title: t('preferencesGroup')});
    const tokenRow = new Adw.PasswordEntryRow({title: t('token')});
    tokenRow.set_enable_undo(true);
    tokenRow.set_text(settings.get_string('api-token'));
    tokenRow.connect('changed', () => settings.set_string('api-token', tokenRow.get_text()));

    const oblastRow = new Adw.ComboRow({
      title: t('oblast'),
      subtitle: t('oblastSubtitle'),
    });
    const regionLabels = () => REGION_NAMES.map(name =>
      localizeRegionName(name, settings.get_string('ui-language')));
    const model = Gtk.StringList.new([t('noneSelected'), ...regionLabels()]);
    oblastRow.set_model(model);
    const savedOblast = settings.get_string('home-oblast');
    const selected = REGION_NAMES.indexOf(savedOblast);
    oblastRow.set_selected(selected < 0 ? 0 : selected + 1);
    const [, districtContents] = this.dir.get_child('data')
      .get_child('ukraine-districts.geojson').load_contents(null);
    const districts = JSON.parse(new TextDecoder().decode(districtContents)).features
      .map(feature => {
        const {adm1_name: sourceOblast, adm2_name: name, adm2_code: code} =
          feature.properties;
        const oblast = sourceOblast === 'Київ' ? 'м. Київ'
          : sourceOblast === 'Севастополь' ? 'м. Севастополь'
            : sourceOblast === 'Автономна Республіка Крим' ? sourceOblast
              : `${sourceOblast} область`;
        return {
          code,
          oblast,
          name,
          label: localizePlaceName(name, settings.get_string('ui-language')),
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));
    const districtRow = new Adw.ComboRow({
      title: t('district'),
      subtitle: t('districtSubtitle'),
    });
    let visibleDistricts = districts.filter(district =>
      !savedOblast || district.oblast === savedOblast);
    let changingDistrictModel = false;
    const setDistrictModel = (region, selectedCode = '') => {
      changingDistrictModel = true;
      visibleDistricts = districts.filter(district =>
        !region || district.oblast === region);
      districtRow.set_model(Gtk.StringList.new([
        t('noneSelected'), ...visibleDistricts.map(district => district.label),
      ]));
      const selectedIndex = visibleDistricts.findIndex(district =>
        district.code === selectedCode);
      districtRow.set_selected(selectedIndex < 0 ? 0 : selectedIndex + 1);
      changingDistrictModel = false;
    };
    setDistrictModel(savedOblast, settings.get_string('home-district'));

    let changingOblastModel = false;
    oblastRow.connect('notify::selected', () => {
      if (changingOblastModel)
        return;
      const index = oblastRow.get_selected();
      const region = index === 0 ? '' : REGION_NAMES[index - 1];
      settings.set_string('home-oblast', region);
      const selectedDistrict = visibleDistricts[districtRow.get_selected() - 1];
      const selectedCode = selectedDistrict?.oblast === region ? selectedDistrict.code : '';
      if (!selectedCode)
        settings.set_string('home-district', '');
      setDistrictModel(region, selectedCode);
    });
    districtRow.connect('notify::selected', () => {
      if (changingDistrictModel)
        return;
      const district = visibleDistricts[districtRow.get_selected() - 1];
      settings.set_string('home-district', district?.code ?? '');
      if (district) {
        settings.set_string('home-oblast', district.oblast);
        const regionIndex = REGION_NAMES.indexOf(district.oblast);
        if (regionIndex >= 0)
          oblastRow.set_selected(regionIndex + 1);
      }
    });

    group.add(tokenRow);
    group.add(oblastRow);
    group.add(districtRow);
    const languageRow = new Adw.ComboRow({
      title: t('language'),
      subtitle: t('languageSubtitle'),
    });
    languageRow.set_model(Gtk.StringList.new(LANGUAGE_CODES.map(language =>
      LANGUAGE_NAMES[language])));
    const savedLanguage = settings.get_string('ui-language');
    const languageIndex = LANGUAGE_CODES.indexOf(savedLanguage);
    languageRow.set_selected(languageIndex < 0 ? 0 : languageIndex);
    languageRow.connect('notify::selected', () => {
      const language = LANGUAGE_CODES[languageRow.get_selected()] ?? 'auto';
      settings.set_string('ui-language', language);
      page.title = t('settingsPage');
      group.title = t('preferencesGroup');
      tokenRow.title = t('token');
      oblastRow.title = t('oblast');
      oblastRow.subtitle = t('oblastSubtitle');
      districtRow.title = t('district');
      districtRow.subtitle = t('districtSubtitle');
      languageRow.title = t('language');
      languageRow.subtitle = t('languageSubtitle');
      soundGroup.title = t('soundGroup');
      soundGroup.description = t('soundModeSubtitle');
      soundRows.off.title = t('soundOff');
      soundRows.morse.title = t('soundMorse');
      soundRows.siren.title = t('soundSiren');
      soundRows.voice.title = t('soundVoice');
      voiceLevelRow.title = t('voiceLevel');
      voiceLevelRow.subtitle = t('voiceLevelSubtitle');
      voiceLevelRow.set_model(Gtk.StringList.new([
        t('voiceStandard'), t('voiceYellowOnly'), t('voiceRedOnly'),
        t('voiceAllLevels'),
      ]));
      const voiceLevelIndex = voiceLevels.indexOf(
        settings.get_string('voice-alert-level'));
      voiceLevelRow.set_selected(Math.max(0, voiceLevelIndex));
      voiceHelp.set_tooltip_text(t('voiceFilesHint'));
      const regionIndex = oblastRow.get_selected();
      changingOblastModel = true;
      oblastRow.set_model(Gtk.StringList.new([t('noneSelected'), ...regionLabels()]));
      oblastRow.set_selected(regionIndex);
      changingOblastModel = false;
      for (const district of districts)
        district.label = localizePlaceName(district.name, settings.get_string('ui-language'));
      setDistrictModel(settings.get_string('home-oblast'),
        settings.get_string('home-district'));
    });

    group.add(languageRow);
    const soundGroup = new Adw.PreferencesGroup({
      title: t('soundGroup'),
      description: t('soundModeSubtitle'),
    });
    const soundRows = {};
    const soundOptions = [
      ['off', 'soundOff'],
      ['morse', 'soundMorse'],
      ['siren', 'soundSiren'],
      ['voice', 'soundVoice'],
    ];
    let firstRadio = null;
    const selectedSoundMode = settings.get_string('sound-mode');
    const voiceLevelRow = new Adw.ComboRow({
      title: t('voiceLevel'),
      subtitle: t('voiceLevelSubtitle'),
    });
    const voiceLevels = ['standard', 'yellow', 'red', 'all'];
    voiceLevelRow.set_model(Gtk.StringList.new([
      t('voiceStandard'), t('voiceYellowOnly'), t('voiceRedOnly'),
      t('voiceAllLevels'),
    ]));
    voiceLevelRow.set_selected(Math.max(0,
      voiceLevels.indexOf(settings.get_string('voice-alert-level'))));
    voiceLevelRow.set_sensitive(selectedSoundMode === 'voice');
    voiceLevelRow.connect('notify::selected', () => {
      settings.set_string('voice-alert-level',
        voiceLevels[voiceLevelRow.get_selected()] ?? 'all');
    });
    const voiceHelp = Gtk.Button.new_from_icon_name('dialog-information-symbolic');
    voiceHelp.add_css_class('flat');
    voiceHelp.set_tooltip_text(t('voiceFilesHint'));
    for (const [mode, titleKey] of soundOptions) {
      const row = new Adw.ActionRow({title: t(titleKey)});
      const radio = new Gtk.CheckButton({active: selectedSoundMode === mode});
      if (firstRadio)
        radio.set_group(firstRadio);
      else
        firstRadio = radio;
      radio.connect('toggled', () => {
        if (radio.active) {
          settings.set_string('sound-mode', mode);
          voiceLevelRow.set_sensitive(mode === 'voice');
        }
      });
      row.add_suffix(radio);
      if (mode === 'voice')
        row.add_suffix(voiceHelp);
      row.activatable_widget = radio;
      soundGroup.add(row);
      soundRows[mode] = row;
    }
    soundGroup.add(voiceLevelRow);
    page.add(group);
    page.add(soundGroup);
    window.add(page);

    const aboutLanguage = resolveLanguage(settings.get_string('ui-language'));
    const about = (key) => translate(aboutLanguage, key);
    const addCopyButton = (row, value) => {
      const button = Gtk.Button.new_from_icon_name('edit-copy-symbolic');
      button.add_css_class('flat');
      button.set_tooltip_text(about('copy'));
      button.connect('clicked', () => {
        const display = window.get_display?.() ?? Gdk.Display.get_default?.();
        const clipboard = display?.get_clipboard?.();
        if (!clipboard)
          return;
        clipboard.set_text(value);
        button.set_tooltip_text(about('copied'));
      });
      row.add_suffix(button);
    };
    const aboutPage = new Adw.PreferencesPage({
      title: about('aboutPage'),
      icon_name: 'help-about-symbolic',
    });
    const aboutGroup = new Adw.PreferencesGroup({
      title: about('aboutGroup'),
      description: about('aboutDescription'),
    });
    const authorRow = new Adw.ActionRow({
      title: about('aboutAuthor'),
      subtitle: 'Євген Горемикін',
    });
    addCopyButton(authorRow, 'Євген Горемикін');
    const emailRow = new Adw.ActionRow({title: about('aboutEmail')});
    emailRow.add_suffix(new Gtk.LinkButton({
      uri: 'mailto:sskateboard@gmail.com',
      label: 'sskateboard@gmail.com',
    }));
    addCopyButton(emailRow, 'sskateboard@gmail.com');
    aboutGroup.add(authorRow);
    aboutGroup.add(emailRow);

    const donationGroup = new Adw.PreferencesGroup({title: about('donations')});
    const monobankRow = new Adw.ActionRow({
      title: about('monoUkraine'),
      subtitle: 'UA 64 322001 00000 2620 0325 4013 38',
      subtitle_selectable: true,
    });
    addCopyButton(monobankRow, 'UA 64 322001 00000 2620 0325 4013 38');
    donationGroup.add(monobankRow);
    const paypalRow = new Adw.ActionRow({
      title: about('paypal'),
      subtitle: 'sskateboard@gmail.com',
      subtitle_selectable: true,
    });
    addCopyButton(paypalRow, 'sskateboard@gmail.com');
    donationGroup.add(paypalRow);
    aboutPage.add(aboutGroup);
    aboutPage.add(donationGroup);

    const swiftGroup = new Adw.PreferencesGroup({
      title: about('swiftGroup'),
    });
    const addSwiftRow = (title, value) => {
      const row = new Adw.ActionRow({
        title: about(title),
        subtitle: value,
        subtitle_selectable: true,
      });
      addCopyButton(row, value);
      swiftGroup.add(row);
    };
    addSwiftRow('swiftEuroIban', 'UA383220010000026209376179933');
    addSwiftRow('swiftUsdIban', 'UA983220010000026203376160045');
    addSwiftRow('swiftBic', 'UNJSUAUKXXX');
    addSwiftRow('accountHolder', 'HOREMYKIN YEVHENII');
    addSwiftRow('bankAddress',
      '26522, Ukraine, reg. Kirovohradska, district Holovanivskyi, village Perehonivka, st. Shkilna, build 26A, fl. 9');
    aboutPage.add(swiftGroup);

    const legalCodeGroup = new Adw.PreferencesGroup({
      title: about('legalTitle'),
      description: about('legalCopyright'),
    });
    const legalDataGroup = new Adw.PreferencesGroup({
      title: about('legalDataGroup'),
    });
    const legalSourceGroup = new Adw.PreferencesGroup({
      title: about('legalSourceGroup'),
    });
    const legalDisclaimerGroup = new Adw.PreferencesGroup({
      title: about('legalDisclaimerGroup'),
      description: about('legalDisclaimer'),
    });
    const addLegalRow = (group, title, subtitle, links) => {
      const row = new Adw.ActionRow({title, subtitle});
      for (const [uri, label] of links) {
        const link = new Gtk.LinkButton({uri, label});
        link.add_css_class('flat');
        row.add_suffix(link);
      }
      group.add(row);
    };

    addLegalRow(legalCodeGroup, about('legalCodeGroup'),
      'GPL-2.0-or-later',
      [['https://www.gnu.org/licenses/old-licenses/gpl-2.0.html',
        about('legalLicenseLink')]]);
    addLegalRow(legalDataGroup, about('legalGeoTitle'),
      about('legalGeoDetails'),
      [['https://www.geoboundaries.org/', about('legalSourceLink')],
        ['https://creativecommons.org/licenses/by/4.0/',
          'CC BY 4.0']]);
    addLegalRow(legalDataGroup, about('legalOchaTitle'),
      about('legalOchaDetails'),
      [['https://data.humdata.org/dataset/cod-ab-ukr',
        about('legalSourceLink')],
        ['https://creativecommons.org/licenses/by/3.0/igo/legalcode',
          'CC BY-IGO 3.0']]);
    addLegalRow(legalSourceGroup, about('legalAlertSource'),
      about('legalAlertSourceDetails'),
      [['https://alerts.in.ua/', 'alerts.in.ua'],
        ['https://ubilling.net.ua/aerialalerts/', 'ubilling.net.ua']]);
    addLegalRow(legalSourceGroup, about('legalLocation'),
      about('legalLocationDetails'), []);
    addLegalRow(legalSourceGroup, about('legalVoiceFiles'),
      about('legalVoiceFilesDetails'), []);

    aboutPage.add(legalCodeGroup);
    aboutPage.add(legalDataGroup);
    aboutPage.add(legalSourceGroup);
    aboutPage.add(legalDisclaimerGroup);
    window.add(aboutPage);
    window.set_default_size(600, 500);
  }
}