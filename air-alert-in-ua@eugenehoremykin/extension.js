import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import Soup from 'gi://Soup?version=3.0';
import St from 'gi://St';
import {
  localizePlaceName,
  localizeRegionName,
  resolveLanguage,
  translate,
} from './locale.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

let gstModulePromise;

function loadGst() {
  if (!gstModulePromise) {
    gstModulePromise = import('gi://Gst?version=1.0').then(({default: Gst}) => {
      Gst.init(null);
      return Gst;
    });
  }
  return gstModulePromise;
}

const API_URL = 'https://api.alerts.in.ua/v1/alerts/active.json';
const PUBLIC_ALERTS_URL = 'https://ubilling.net.ua/aerialalerts/';
const REFRESH_SECONDS = 120;
const PANEL_ICON_BASE_SIZE = 32;
const MAP_WIDTH = 480;
const MAP_HEIGHT = 282;
const IDLE_ICON_COLOR = '#d9e0e2';
const NEARBY_IDLE_COLOR = '#899497';
const NEARBY_BREATH_MIN = 125;
const NEARBY_BREATH_MAX = 235;
const MORSE_PHRASE_COUNT = 8;
const MORSE_PHRASE_SLOT_MS = 3000;
const ALERT_MORSE_PATTERNS = {
  uk: ['-', '.-.', '-.--', '.--', '---', '--.', '.-'],
  en: ['.-', '.-..', '.', '.-.', '-'],
};

const REGION_NAMES = {
  'UA-43': 'Автономна Республіка Крим',
  'UA-05': 'Вінницька область',
  'UA-07': 'Волинська область',
  'UA-12': 'Дніпропетровська область',
  'UA-14': 'Донецька область',
  'UA-18': 'Житомирська область',
  'UA-21': 'Закарпатська область',
  'UA-23': 'Запорізька область',
  'UA-26': 'Івано-Франківська область',
  'UA-30': 'м. Київ',
  'UA-32': 'Київська область',
  'UA-35': 'Кіровоградська область',
  'UA-40': 'м. Севастополь',
  'UA-09': 'Луганська область',
  'UA-46': 'Львівська область',
  'UA-48': 'Миколаївська область',
  'UA-51': 'Одеська область',
  'UA-53': 'Полтавська область',
  'UA-56': 'Рівненська область',
  'UA-59': 'Сумська область',
  'UA-61': 'Тернопільська область',
  'UA-63': 'Харківська область',
  'UA-65': 'Херсонська область',
  'UA-68': 'Хмельницька область',
  'UA-71': 'Черкаська область',
  'UA-74': 'Чернігівська область',
  'UA-77': 'Чернівецька область',
};

const REGION_BY_NAME = Object.fromEntries(
  Object.entries(REGION_NAMES).map(([code, name]) => [name, code]));
const PUBLIC_REGION_ALIASES = {
  'Севастополь': 'м. Севастополь',
};

const NEIGHBORS = {
  'UA-05': ['UA-18', 'UA-32', 'UA-68', 'UA-71', 'UA-35', 'UA-51', 'UA-77'],
  'UA-07': ['UA-46', 'UA-56'],
  'UA-12': ['UA-14', 'UA-23', 'UA-35', 'UA-48', 'UA-53', 'UA-63', 'UA-65'],
  'UA-14': ['UA-09', 'UA-12', 'UA-23', 'UA-63'],
  'UA-18': ['UA-05', 'UA-32', 'UA-56', 'UA-68'],
  'UA-21': ['UA-46', 'UA-26'],
  'UA-23': ['UA-12', 'UA-14', 'UA-65'],
  'UA-26': ['UA-21', 'UA-46', 'UA-61', 'UA-77'],
  'UA-30': ['UA-32'],
  'UA-32': ['UA-05', 'UA-18', 'UA-30', 'UA-53', 'UA-71', 'UA-74'],
  'UA-35': ['UA-05', 'UA-12', 'UA-48', 'UA-51', 'UA-53', 'UA-71'],
  'UA-09': ['UA-14', 'UA-63'],
  'UA-40': ['UA-43'],
  'UA-43': ['UA-40', 'UA-65'],
  'UA-46': ['UA-07', 'UA-21', 'UA-26', 'UA-56', 'UA-61'],
  'UA-48': ['UA-12', 'UA-35', 'UA-51', 'UA-65'],
  'UA-51': ['UA-05', 'UA-35', 'UA-48'],
  'UA-53': ['UA-12', 'UA-32', 'UA-35', 'UA-59', 'UA-63', 'UA-71'],
  'UA-56': ['UA-07', 'UA-18', 'UA-46', 'UA-61', 'UA-68'],
  'UA-59': ['UA-53', 'UA-63', 'UA-74'],
  'UA-61': ['UA-26', 'UA-46', 'UA-56', 'UA-68', 'UA-77'],
  'UA-63': ['UA-09', 'UA-12', 'UA-14', 'UA-53', 'UA-59'],
  'UA-65': ['UA-12', 'UA-23', 'UA-43', 'UA-48'],
  'UA-68': ['UA-05', 'UA-18', 'UA-56', 'UA-61', 'UA-77'],
  'UA-71': ['UA-05', 'UA-32', 'UA-35', 'UA-53'],
  'UA-74': ['UA-32', 'UA-59'],
  'UA-77': ['UA-05', 'UA-26', 'UA-61', 'UA-68'],
};

const LEVEL_COLORS = {
  red: '#ef4444',
  yellow: '#f5c542',
  blue: '#4299e1',
  violet: '#a78bfa',
  green: '#55c987',
  none: '#ffffff',
};

function alertColor(alert) {
  if (alert.alert_type === 'nuclear' || alert.alert_type === 'chemical')
    return alert.alert_type === 'nuclear' ? LEVEL_COLORS.red : LEVEL_COLORS.green;
  if (alert.alert_type === 'artillery_shelling')
    return LEVEL_COLORS.blue;
  if (alert.alert_type === 'urban_fights')
    return LEVEL_COLORS.violet;
  return LEVEL_COLORS[alert.alert_level] ?? LEVEL_COLORS.red;
}

function colorRank(color) {
  return [LEVEL_COLORS.red, LEVEL_COLORS.violet, LEVEL_COLORS.blue,
    LEVEL_COLORS.green, LEVEL_COLORS.yellow].indexOf(color);
}

function strongestColor(alerts) {
  return alerts.map(alertColor).sort((a, b) => colorRank(a) - colorRank(b))[0] ?? null;
}

function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > point[1]) !== (yj > point[1]) &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (crosses)
      inside = !inside;
  }
  return inside;
}

function normalizePlaceName(value) {
  return (value ?? '')
    .toLocaleLowerCase('uk')
    .replace(/(територіальна громада|міська громада|селищна громада|сільська громада|громада|район|область|р-н|обл\.|місто|м\.)/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function morseToneIntervals(language) {
  const letters = ALERT_MORSE_PATTERNS[language];
  const totalUnits = letters.reduce((sum, letter) =>
    sum + [...letter].reduce((letterUnits, symbol) =>
      letterUnits + (symbol === '-' ? 3 : 1), 0) + letter.length - 1, 0) +
    (letters.length - 1) * 3;
  const unitMs = Math.min(35, (MORSE_PHRASE_SLOT_MS - 300) / totalUnits);
  const phraseDuration = totalUnits * unitMs;
  const phraseGap = Math.max(300, MORSE_PHRASE_SLOT_MS - phraseDuration);
  const intervals = [];
  let cursor = 0;

  for (let repeat = 0; repeat < MORSE_PHRASE_COUNT; repeat++) {
    for (let letterIndex = 0; letterIndex < letters.length; letterIndex++) {
      const letter = letters[letterIndex];
      for (let symbolIndex = 0; symbolIndex < letter.length; symbolIndex++) {
        const duration = unitMs * (letter[symbolIndex] === '-' ? 3 : 1);
        intervals.push([cursor, cursor + duration]);
        cursor += duration + (symbolIndex < letter.length - 1 ? unitMs : 0);
      }
      if (letterIndex < letters.length - 1)
        cursor += unitMs * 3;
    }
    if (repeat < MORSE_PHRASE_COUNT - 1)
      cursor += phraseGap;
  }
  return intervals;
}

export default class AirAlertExtension extends Extension {
  enable() {
    this._stylesheet = Gio.File.new_for_path(GLib.build_filenamev([
      this.path, 'stylesheet.css',
    ]));
    St.ThemeContext.get_for_stage(global.stage).get_theme()
      .load_stylesheet(this._stylesheet);
    this._settings = this.getSettings();
    this._languageChangedId = this._settings.connect('changed::ui-language', () => this._updateLanguage());
    this._soundModeChangedId = this._settings.connect('changed::sound-mode', () =>
      this._updateDisplay(true));
    this._voiceLevelChangedId = this._settings.connect('changed::voice-alert-level', () =>
      this._updateDisplay(true));
    this._session = new Soup.Session();
    this._cancellable = new Gio.Cancellable();
    this._features = [];
    this._districtFeatures = [];
    this._hromadas = [];
    this._mapShapes = [];
    this._districtShapes = [];
    this._mapDataReady = false;
    this._districtByName = new Map();
    this._districtOblastByCode = new Map();
    this._hromadaByName = new Map();
    this._alertGroups = new Map();
    this._oblastAlertGroups = new Map();
    this._districtAlertGroups = new Map();
    this._iconState = '';

    const iconFile = Gio.File.new_for_path(GLib.build_filenamev([
      this.path, 'icons', 'air-alert-in-ua-symbolic.svg',
    ]));
    this._indicator = new PanelMenu.Button(0.0, 'air-alert-in-ua', false);
    this._icon = new St.Icon({
      gicon: new Gio.FileIcon({file: iconFile}),
      icon_size: PANEL_ICON_BASE_SIZE,
      style_class: 'system-status-icon air-alert-panel-icon',
    });
    this._icon.set_size(PANEL_ICON_BASE_SIZE, PANEL_ICON_BASE_SIZE);
    this._sweepIcon = new St.Icon({
      gicon: new Gio.FileIcon({file: iconFile}),
      icon_size: PANEL_ICON_BASE_SIZE,
      style_class: 'system-status-icon air-alert-panel-icon air-alert-sweep-icon',
    });
    this._sweepIcon.set_size(PANEL_ICON_BASE_SIZE, PANEL_ICON_BASE_SIZE);
    this._sweepIcon.set_opacity(0);
    this._indicator.add_child(this._icon);
    this._indicator.add_child(this._sweepIcon);
    this._buildMenu();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
    this._panelHeightChangedId = Main.panel.connect('notify::height', () =>
      this._updatePanelIconSize());
    this._updatePanelIconSize();

    this._settingsChangedId = this._settings.connect('changed::home-oblast', () =>
      this._updateDisplay(true));
    this._districtSettingChangedId = this._settings.connect('changed::home-district', () =>
      this._updateDisplay(true));
    this._refresh();
    this._refreshTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
      REFRESH_SECONDS, () => {
        this._refresh();
        return GLib.SOURCE_CONTINUE;
      });
    this._loadMapData();
  }

  _updatePanelIconSize() {
    const panelHeight = Main.panel.get_height() || PANEL_ICON_BASE_SIZE;
    const iconSize = Math.max(20, Math.min(40,
      Math.round(PANEL_ICON_BASE_SIZE * panelHeight / 32)));
    for (const icon of [this._icon, this._sweepIcon]) {
      icon.set_icon_size(iconSize);
      icon.set_size(iconSize, iconSize);
    }
  }

  disable() {
    if (this._refreshTimer)
      GLib.source_remove(this._refreshTimer);
    if (this._panelHeightChangedId)
      Main.panel.disconnect(this._panelHeightChangedId);
    this._stopAlertTone();
    this._stopGeoClue();
    this._stopPulse();
    if (this._settingsChangedId)
      this._settings.disconnect(this._settingsChangedId);
    if (this._districtSettingChangedId)
      this._settings.disconnect(this._districtSettingChangedId);
    if (this._languageChangedId)
      this._settings.disconnect(this._languageChangedId);
    if (this._soundModeChangedId)
      this._settings.disconnect(this._soundModeChangedId);
    if (this._voiceLevelChangedId)
      this._settings.disconnect(this._voiceLevelChangedId);
    if (this._locationButtonClickedId)
      this._locationButton.disconnect(this._locationButtonClickedId);
    if (this._refreshButtonClickedId)
      this._refreshButton.disconnect(this._refreshButtonClickedId);
    if (this._settingsButtonClickedId)
      this._settingsButton.disconnect(this._settingsButtonClickedId);
    if (this._mapRepaintId)
      this._mapArea.disconnect(this._mapRepaintId);
    if (this._mapMotionId)
      this._mapArea.disconnect(this._mapMotionId);
    if (this._mapLeaveId)
      this._mapArea.disconnect(this._mapLeaveId);
    if (this._locationTooltipEnterId)
      this._locationButton.disconnect(this._locationTooltipEnterId);
    if (this._locationTooltipLeaveId)
      this._locationButton.disconnect(this._locationTooltipLeaveId);
    if (this._refreshTooltipEnterId)
      this._refreshButton.disconnect(this._refreshTooltipEnterId);
    if (this._refreshTooltipLeaveId)
      this._refreshButton.disconnect(this._refreshTooltipLeaveId);
    if (this._settingsTooltipEnterId)
      this._settingsButton.disconnect(this._settingsTooltipEnterId);
    if (this._settingsTooltipLeaveId)
      this._settingsButton.disconnect(this._settingsTooltipLeaveId);
    this._cancellable?.cancel();
    this._session?.abort();
    this._heading?.destroy();
    this._locationButton?.destroy();
    this._refreshButton?.destroy();
    this._settingsButton?.destroy();
    this._status?.destroy();
    this._mapTooltip?.destroy();
    this._mapArea?.destroy();
    this._mapContainer?.destroy();
    this._headingRow?.destroy();
    this._actionButtons?.destroy();
    this._footerSpacer?.destroy();
    this._footer?.destroy();
    this._menuBox?.destroy();
    this._icon?.destroy();
    this._sweepIcon?.destroy();
    this._indicator?.destroy();
    if (this._stylesheet) {
      St.ThemeContext.get_for_stage(global.stage).get_theme()
        .unload_stylesheet(this._stylesheet);
    }
    this._stylesheet = null;
    this._session = null;
    this._settings = null;
    this._heading = null;
    this._locationButton = null;
    this._refreshButton = null;
    this._settingsButton = null;
    this._status = null;
    this._mapTooltip = null;
    this._mapArea = null;
    this._mapContainer = null;
    this._headingRow = null;
    this._actionButtons = null;
    this._footerSpacer = null;
    this._footer = null;
    this._menuBox = null;
    this._icon = null;
    this._sweepIcon = null;
    this._indicator = null;
    this._languageChangedId = 0;
    this._soundModeChangedId = 0;
    this._voiceLevelChangedId = 0;
    this._settingsChangedId = 0;
    this._districtSettingChangedId = 0;
    this._panelHeightChangedId = 0;
    this._locationButtonClickedId = 0;
    this._refreshButtonClickedId = 0;
    this._settingsButtonClickedId = 0;
    this._mapRepaintId = 0;
    this._mapMotionId = 0;
    this._mapLeaveId = 0;
    this._locationTooltipEnterId = 0;
    this._locationTooltipLeaveId = 0;
    this._refreshTooltipEnterId = 0;
    this._refreshTooltipLeaveId = 0;
    this._settingsTooltipEnterId = 0;
    this._settingsTooltipLeaveId = 0;
    this._features = null;
    this._districtFeatures = null;
    this._hromadas = null;
    this._mapShapes = null;
    this._districtShapes = null;
    this._districtByName?.clear();
    this._districtByName = null;
    this._districtOblastByCode?.clear();
    this._districtOblastByCode = null;
    this._hromadaByName?.clear();
    this._hromadaByName = null;
    this._alertGroups?.clear();
    this._alertGroups = null;
    this._oblastAlertGroups?.clear();
    this._oblastAlertGroups = null;
    this._districtAlertGroups?.clear();
    this._districtAlertGroups = null;
  }

  _loadJsonFile(filename) {
    const file = Gio.File.new_for_path(GLib.build_filenamev([
      this.path, 'data', filename,
    ]));
    return new Promise((resolve, reject) => {
      file.load_contents_async(this._cancellable, (source, result) => {
        try {
          const [, contents] = source.load_contents_finish(result);
          resolve(JSON.parse(new TextDecoder().decode(contents)));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async _loadMapData() {
    try {
      const [oblastData, districtData, hromadaData] = await Promise.all([
        this._loadJsonFile('ukraine-oblasts.geojson'),
        this._loadJsonFile('ukraine-districts.geojson'),
        this._loadJsonFile('ukraine-hromadas.json'),
      ]);
      if (this._cancellable.is_cancelled())
        return;
      this._features = oblastData.features
        .filter(feature => REGION_NAMES[feature.properties.shapeISO]);
      this._districtFeatures = districtData.features;
      this._hromadas = hromadaData;
      this._indexAdministrativeAreas();
      const project = this._projector(MAP_WIDTH, MAP_HEIGHT);
      this._mapShapes = project ? this._features.map(feature => {
        const polygons = feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates] : feature.geometry.coordinates;
        return {
          feature,
          polygons: polygons.map(rings => rings.map(ring => ring.map(project))),
        };
      }) : [];
      this._districtShapes = project ? this._districtFeatures.map(feature => {
        const polygons = feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates] : feature.geometry.coordinates;
        return {
          feature,
          polygons: polygons.map(rings => rings.map(ring => ring.map(project))),
        };
      }) : [];
      this._mapDataReady = true;
      this._refreshQueued = false;
      this._mapArea.queue_repaint();
      this._refresh(true);
    } catch (error) {
      if (!this._cancellable.is_cancelled()) {
        this._status.text = this._t('mapDataError');
        logError(error, `[${this.uuid}] Could not load map data`);
      }
    }
  }

  _indexAdministrativeAreas() {
    this._districtByName = new Map();
    this._districtOblastByCode = new Map();
    this._hromadaByName = new Map();
    for (const feature of this._districtFeatures) {
      const {adm1_name: oblastName, adm2_code: districtCode, adm2_name: districtName} =
        feature.properties;
      const normalizedOblast = normalizePlaceName(oblastName);
      const oblastCode = Object.entries(REGION_NAMES).find(([, name]) =>
        normalizePlaceName(name) === normalizedOblast)?.[0];
      if (!oblastCode || !districtCode || !districtName)
        continue;
      this._districtOblastByCode.set(districtCode, oblastCode);
      this._districtByName.set(
        `${oblastCode}:${normalizePlaceName(districtName)}`, districtCode);
    }
    for (const hromada of this._hromadas) {
      const oblastCode = this._districtOblastByCode.get(hromada.district);
      if (oblastCode && hromada.name)
        this._hromadaByName.set(
          `${oblastCode}:${normalizePlaceName(hromada.name)}`, hromada.district);
    }
  }

  _t(key, values = {}) {
    return translate(this._settings?.get_string('ui-language') ?? 'auto', key, values);
  }

  _updateLanguage() {
    this._heading.text = this._t('title');
    this._locationButton.accessible_name = this._t('locate');
    this._refreshButton.accessible_name = this._t('refresh');
    this._settingsButton.accessible_name = this._t('settings');
    this._status.text = this._t('loading');
    this._stopAlertTone();
    this._updateDisplay(true);
    this._refresh(true);
  }

  _buildMenu() {
    const box = new St.BoxLayout({
      vertical: true,
      style_class: 'air-alert-popup',
    });
    this._menuBox = box;
    box.set_size(MAP_WIDTH + 24, MAP_HEIGHT + 146);
    const headingRow = new St.BoxLayout({style_class: 'air-alert-toolbar'});
    this._headingRow = headingRow;
    this._heading = new St.Label({
      text: this._t('title'),
      style_class: 'air-alert-heading',
      x_expand: true,
    });
    const actionButtons = new St.BoxLayout({
      vertical: true,
      style_class: 'air-alert-action-buttons',
    });
    this._actionButtons = actionButtons;
    this._locationButton = new St.Button({
      style_class: 'air-alert-action-button',
      can_focus: true,
      track_hover: true,
      accessible_name: this._t('locate'),
      child: new St.Icon({
        icon_name: 'find-location-symbolic',
        style_class: 'air-alert-action-icon',
        icon_size: 18,
      }),
    });
    this._locationButton.set_size(28, 28);
    this._locationButtonClickedId = this._locationButton.connect(
      'clicked', () => this._detectHomeOblast());
    this._refreshButton = new St.Button({
      style_class: 'air-alert-action-button',
      can_focus: true,
      track_hover: true,
      accessible_name: this._t('refresh'),
      child: new St.Icon({
        icon_name: 'view-refresh-symbolic',
        style_class: 'air-alert-action-icon',
        icon_size: 18,
      }),
    });
    this._refreshButton.set_size(28, 28);
    this._refreshButtonClickedId = this._refreshButton.connect(
      'clicked', () => this._refresh(true));
    actionButtons.add_child(this._locationButton);
    actionButtons.add_child(this._refreshButton);
    headingRow.add_child(this._heading);
    headingRow.add_child(actionButtons);
    this._status = new St.Label({
      text: this._t('loading'),
      style_class: 'air-alert-status',
    });
    this._status.set_size(MAP_WIDTH, 20);
    this._status.clutter_text.set_line_wrap(false);
    this._status.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
    const mapContainer = new St.Widget({
      layout_manager: new Clutter.BinLayout(),
      style_class: 'air-alert-map-container',
    });
    this._mapContainer = mapContainer;
    mapContainer.set_size(MAP_WIDTH, MAP_HEIGHT);
    this._mapArea = new St.DrawingArea({style_class: 'air-alert-map'});
    this._mapArea.set_size(MAP_WIDTH, MAP_HEIGHT);
    this._mapRepaintId = this._mapArea.connect('repaint', () => this._drawMap());
    this._mapArea.set_reactive(true);
    this._mapMotionId = this._mapArea.connect('motion-event', (area, event) => {
      const [stageX, stageY] = event.get_coords();
      const [, x, y] = area.transform_stage_point(stageX, stageY);
      const feature = this._featureAt(x, y);
      if (feature) {
        this._mapTooltip.text = this._describeFeature(
          feature, this._districtAt(x, y, feature.properties.shapeISO));
        this._mapTooltip.set_position(
          Math.max(6, Math.min(x + 12, MAP_WIDTH - 220)),
          Math.max(6, Math.min(y + 12, MAP_HEIGHT - 52)));
        this._mapTooltip.show();
      } else {
        this._mapTooltip.hide();
      }
      return Clutter.EVENT_STOP;
    });
    this._mapLeaveId = this._mapArea.connect('leave-event', () => {
      this._mapTooltip.hide();
      return Clutter.EVENT_PROPAGATE;
    });
    this._mapTooltip = new St.Label({
      style_class: 'air-alert-tooltip',
      reactive: false,
      visible: false,
    });
    [this._locationTooltipEnterId, this._locationTooltipLeaveId] =
      this._connectButtonTooltip(this._locationButton, 'locate');
    [this._refreshTooltipEnterId, this._refreshTooltipLeaveId] =
      this._connectButtonTooltip(this._refreshButton, 'refresh');
    mapContainer.add_child(this._mapArea);
    mapContainer.add_child(this._mapTooltip);
    const footer = new St.BoxLayout({style_class: 'air-alert-footer'});
    this._footer = footer;
    const settingsButton = new St.Button({
      style_class: 'air-alert-action-button',
      can_focus: true,
      track_hover: true,
      accessible_name: this._t('settings'),
      child: new St.Icon({
        icon_name: 'preferences-system-symbolic',
        style_class: 'air-alert-action-icon',
        icon_size: 18,
      }),
    });
    this._settingsButton = settingsButton;
    [this._settingsTooltipEnterId, this._settingsTooltipLeaveId] =
      this._connectButtonTooltip(this._settingsButton, 'settings');
    settingsButton.set_size(28, 28);
    this._settingsButtonClickedId = settingsButton.connect(
      'clicked', () => this.openPreferences());
    this._footerSpacer = new St.Widget({x_expand: true});
    footer.add_child(this._footerSpacer);
    footer.add_child(settingsButton);

    box.add_child(headingRow);
    box.add_child(this._status);
    box.add_child(mapContainer);
    box.add_child(footer);
    this._indicator.menu.box.add_child(box);
  }

  _connectButtonTooltip(button, key) {
    const enterId = button.connect('enter-event', () => {
      this._mapTooltip.text = this._t(key);
      const [stageX, stageY] = button.get_transformed_position();
      const [, x, y] = this._mapContainer.transform_stage_point(stageX, stageY);
      const tooltipX = Math.max(6, Math.min(x - 228, MAP_WIDTH - 220));
      const tooltipY = y < 0
        ? Math.max(-38, y + button.get_height() + 8)
        : Math.min(y - 54, MAP_HEIGHT - 52);
      this._mapTooltip.set_position(tooltipX, tooltipY);
      this._mapTooltip.show();
      return Clutter.EVENT_PROPAGATE;
    });
    const leaveId = button.connect('leave-event', () => {
      this._mapTooltip.hide();
      return Clutter.EVENT_PROPAGATE;
    });
    return [enterId, leaveId];
  }

  async _detectHomeOblast() {
    if (this._locationPending)
      return;

    this._locationPending = true;
    this._status.text = this._t('locationWait');
    try {
      const result = await this._callGeoClue(
        '/org/freedesktop/GeoClue2/Manager',
        'org.freedesktop.GeoClue2.Manager', 'GetClient', null,
        new GLib.VariantType('(o)'));
      this._geoClientPath = result.deep_unpack()[0];
      await this._setGeoClueProperty('DesktopId', new GLib.Variant('s', 'org.gnome.Shell'));
      await this._setGeoClueProperty('RequestedAccuracyLevel', new GLib.Variant('u', 4));
      this._geoSignalId = Gio.DBus.system.signal_subscribe(
        'org.freedesktop.GeoClue2',
        'org.freedesktop.GeoClue2.Client',
        'LocationUpdated', this._geoClientPath, null,
        Gio.DBusSignalFlags.NONE,
        (_connection, _sender, _path, _interface, _signal, parameters) => {
          const [, locationPath] = parameters.deep_unpack();
          if (locationPath !== '/')
            this._readGeoClueLocation(locationPath);
        });
      this._locationTimeout = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT, 20, () => {
          this._locationTimeout = 0;
          this._status.text = this._t('locationDenied');
          this._stopGeoClue();
          return GLib.SOURCE_REMOVE;
        });
      await this._callGeoClue(
        this._geoClientPath, 'org.freedesktop.GeoClue2.Client', 'Start', null,
        new GLib.VariantType('()'));
    } catch (error) {
      this._stopGeoClue();
      if (!this._cancellable.is_cancelled()) {
        this._status.text = this._t('locationDenied');
        logError(error, `[${this.uuid}] Geolocation failed`);
      }
    }
  }

  async _readGeoClueLocation(locationPath) {
    if (this._locationLookupInProgress)
      return;
    this._locationLookupInProgress = true;
    try {
      const result = await this._callGeoClue(
        locationPath, 'org.freedesktop.DBus.Properties', 'GetAll',
        new GLib.Variant('(s)', ['org.freedesktop.GeoClue2.Location']),
        new GLib.VariantType('(a{sv})'));
      const [properties] = result.deep_unpack();
      const latitudeValue = properties.Latitude;
      const longitudeValue = properties.Longitude;
      const latitude = latitudeValue instanceof GLib.Variant
        ? latitudeValue.get_double() : latitudeValue;
      const longitude = longitudeValue instanceof GLib.Variant
        ? longitudeValue.get_double() : longitudeValue;
      const district = this._districtFeatureAtCoordinates(longitude, latitude);
      const districtCode = district?.properties.adm2_code ?? '';
      const oblastCode = this._districtOblastByCode.get(districtCode);
      const region = REGION_NAMES[oblastCode] ?? this._regionAt(longitude, latitude);
      if (!region) {
        this._status.text = this._t('locationUnknown');
        return;
      }
      const locationChanged = this._settings.get_string('home-oblast') !== region ||
        this._settings.get_string('home-district') !== districtCode;
      this._settings.set_string('home-oblast', region);
      this._settings.set_string('home-district', districtCode);
      if (!locationChanged)
        this._updateDisplay(true);
      this._status.text = this._t('locationSet', {region});
    } catch (error) {
      if (!this._cancellable.is_cancelled()) {
        this._status.text = this._t('locationReadError');
        logError(error, `[${this.uuid}] Could not read geolocation`);
      }
    } finally {
      this._locationLookupInProgress = false;
      this._stopGeoClue();
    }
  }

  _regionAt(longitude, latitude) {
    const point = [longitude, latitude];
    const feature = this._features.find(({geometry}) => {
      const polygons = geometry.type === 'Polygon'
        ? [geometry.coordinates] : geometry.coordinates;
      return polygons.some(rings => pointInRing(point, rings[0]) &&
        !rings.slice(1).some(ring => pointInRing(point, ring)));
    });
    return feature ? REGION_NAMES[feature.properties.shapeISO] : null;
  }

  _districtFeatureAtCoordinates(longitude, latitude) {
    const point = [longitude, latitude];
    return this._districtFeatures.find(({geometry}) => {
      const polygons = geometry.type === 'Polygon'
        ? [geometry.coordinates] : geometry.coordinates;
      return polygons.some(rings => pointInRing(point, rings[0]) &&
        !rings.slice(1).some(ring => pointInRing(point, ring)));
    }) ?? null;
  }

  _setGeoClueProperty(name, value) {
    return this._callGeoClue(
      this._geoClientPath, 'org.freedesktop.DBus.Properties', 'Set',
      new GLib.Variant('(ssv)', [
        'org.freedesktop.GeoClue2.Client', name, value,
      ]), new GLib.VariantType('()'));
  }

  _callGeoClue(path, interfaceName, method, parameters, replyType) {
    return new Promise((resolve, reject) => {
      Gio.DBus.system.call(
        'org.freedesktop.GeoClue2', path, interfaceName, method,
        parameters, replyType, Gio.DBusCallFlags.NONE, -1,
        this._cancellable, (connection, result) => {
          try {
            resolve(connection.call_finish(result));
          } catch (error) {
            reject(error);
          }
        });
    });
  }

  _stopGeoClue() {
    if (this._locationTimeout) {
      GLib.source_remove(this._locationTimeout);
      this._locationTimeout = 0;
    }
    if (this._geoSignalId) {
      Gio.DBus.system.signal_unsubscribe(this._geoSignalId);
      this._geoSignalId = 0;
    }
    const clientPath = this._geoClientPath;
    this._geoClientPath = null;
    this._locationPending = false;
    if (clientPath) {
      Gio.DBus.system.call(
        'org.freedesktop.GeoClue2', clientPath,
        'org.freedesktop.GeoClue2.Client', 'Stop', null,
        new GLib.VariantType('()'), Gio.DBusCallFlags.NONE, -1, null,
        (connection, result) => {
          try {
            connection.call_finish(result);
          } catch (_error) {
            // The client may already have stopped or been denied.
          }
        });
    }
  }

  _refresh(force = false) {
    if (!this._mapDataReady) {
      this._refreshQueued = true;
      return;
    }
    if (this._refreshInProgress) {
      if (force)
        this._refreshQueued = true;
      return;
    }
    this._refreshInProgress = true;
    if (force)
      this._status.text = this._t('refreshing');
    const finish = () => {
      this._refreshInProgress = false;
      if (this._refreshQueued) {
        this._refreshQueued = false;
        this._refresh(true);
      }
    };
    const token = this._settings?.get_string('api-token').trim();
    if (!token) {
      this._refreshPublicFeed(finish);
      return;
    }

    const message = Soup.Message.new('GET', API_URL);
    message.request_headers.append('Authorization', `Bearer ${token}`);
    this._session.send_and_read_async(message, GLib.PRIORITY_DEFAULT,
      this._cancellable, (session, result) => {
        try {
          const bytes = session.send_and_read_finish(result);
          if (message.status_code < 200 || message.status_code >= 300)
            throw new Error(`HTTP ${message.status_code}`);
          const payload = JSON.parse(new TextDecoder().decode(bytes.get_data()));
          this._alertGroups = this._groupAlerts(payload.alerts ?? []);
          const count = (payload.alerts ?? []).length;
          this._status.text = count
            ? this._t('activeCount', {count}) : this._t('noAlerts');
          this._updateDisplay();
        } catch (error) {
          if (!this._cancellable.is_cancelled()) {
            this._status.text = this._t('updateError', {error: error.message});
            logError(error, `[${this.uuid}] Alert update failed`);
          }
        } finally {
          finish();
        }
      });
  }

  _refreshPublicFeed(finish) {
    const message = Soup.Message.new('GET', PUBLIC_ALERTS_URL);
    this._session.send_and_read_async(message, GLib.PRIORITY_DEFAULT,
      this._cancellable, (session, result) => {
        try {
          const bytes = session.send_and_read_finish(result);
          if (message.status_code < 200 || message.status_code >= 300)
            throw new Error(`HTTP ${message.status_code}`);
          const payload = JSON.parse(new TextDecoder().decode(bytes.get_data()));
          if (!payload.states || typeof payload.states !== 'object')
            throw new Error('Невідомий формат відповіді');
          const alerts = Object.entries(payload.states)
            .filter(([, state]) => state.alertnow === true)
            .map(([sourceName]) => {
              const regionName = PUBLIC_REGION_ALIASES[sourceName] ?? sourceName;
              return {
                location_oblast: regionName,
                location_title: regionName,
                location_type: 'oblast',
                alert_level: 'red',
              };
            });
          this._alertGroups = this._groupAlerts(alerts);
          const count = this._alertGroups.size;
          const cachedAt = payload.cachedat
            ? this._t('cached', {time: payload.cachedat}) : '';
          this._status.text = this._t('publicStatus', {count, cached: cachedAt});
          this._updateDisplay();
        } catch (error) {
          if (!this._cancellable.is_cancelled()) {
            this._status.text = this._t('publicError', {error: error.message});
            logError(error, `[${this.uuid}] Public alert feed failed`);
          }
        } finally {
          finish();
        }
      });
  }

  _groupAlerts(alerts) {
    const groups = new Map();
    const oblastGroups = new Map();
    const districtGroups = new Map();
    for (const alert of alerts) {
      const regionName = alert.location_oblast ?? alert.location_title;
      const oblastCode = REGION_BY_NAME[regionName] ??
        REGION_BY_NAME[PUBLIC_REGION_ALIASES[regionName]];
      if (!oblastCode)
        continue;
      if (!groups.has(oblastCode))
        groups.set(oblastCode, []);
      groups.get(oblastCode).push(alert);

      const candidates = [alert.location_title, alert.location_title?.split(',').pop()]
        .filter(Boolean)
        .map(title => normalizePlaceName(title.replace(regionName, '')));
      const normalizedRegion = normalizePlaceName(REGION_NAMES[oblastCode]);
      const type = (alert.location_type ?? '').toLocaleLowerCase('uk');
      if (type === 'oblast' || candidates.includes(normalizedRegion)) {
        if (!oblastGroups.has(oblastCode))
          oblastGroups.set(oblastCode, []);
        oblastGroups.get(oblastCode).push(alert);
        continue;
      }

      let districtCode = null;
      for (const title of candidates) {
        districtCode = this._districtByName.get(`${oblastCode}:${title}`) ??
          this._hromadaByName.get(`${oblastCode}:${title}`);
        if (districtCode)
          break;
      }
      if (districtCode) {
        if (!districtGroups.has(districtCode))
          districtGroups.set(districtCode, []);
        districtGroups.get(districtCode).push(alert);
      }
    }
    this._oblastAlertGroups = oblastGroups;
    this._districtAlertGroups = districtGroups;
    return groups;
  }

  _regionAlerts(code) {
    return this._alertGroups.get(code) ?? [];
  }

  _describeFeature(feature, districtFeature) {
    const code = feature.properties.shapeISO;
    const language = this._settings?.get_string('ui-language') ?? 'auto';
    const region = localizeRegionName(REGION_NAMES[code], language);
    const district = districtFeature
      ? localizePlaceName(districtFeature.properties.adm2_name, language)
      : this._t('districtUnknown');
    return `${region}\n${district} ${this._t('districtSuffix')}`;
  }

  _projector(width, height) {
    const points = [];
    for (const feature of this._features) {
      const polygons = feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      for (const polygon of polygons) {
        for (const [longitude, latitude] of polygon[0])
          points.push([longitude, latitude]);
      }
    }
    if (!points.length)
      return null;
    const referenceLatitude = points.reduce((sum, point) => sum + point[1], 0) /
      points.length;
    const longitudeScale = Math.cos(referenceLatitude * Math.PI / 180);
    const projectedPoints = points.map(([longitude, latitude]) =>
      [longitude * longitudeScale, latitude]);
    const minX = Math.min(...projectedPoints.map(point => point[0]));
    const maxX = Math.max(...projectedPoints.map(point => point[0]));
    const minY = Math.min(...projectedPoints.map(point => point[1]));
    const maxY = Math.max(...projectedPoints.map(point => point[1]));
    const scale = Math.min((width - 24) / (maxX - minX), (height - 20) / (maxY - minY));
    const offsetX = (width - (maxX - minX) * scale) / 2;
    const offsetY = (height - (maxY - minY) * scale) / 2;
    return ([longitude, latitude]) => [
      offsetX + (longitude * longitudeScale - minX) * scale,
      height - offsetY - (latitude - minY) * scale,
    ];
  }

  _drawMap() {
    const context = this._mapArea.get_context();
    if (!this._districtShapes.length && !this._mapShapes.length) {
      context.$dispose();
      return;
    }

    for (const {feature, polygons} of this._districtShapes) {
      context.newPath();
      const districtCode = feature.properties.adm2_code;
      const oblastCode = this._districtOblastByCode.get(districtCode);
      const alerts = [
        ...(this._oblastAlertGroups.get(oblastCode) ?? []),
        ...(this._districtAlertGroups.get(districtCode) ?? []),
      ];
      const activeColor = strongestColor(alerts);
      const rgb = this._rgb(activeColor ?? '#263b40');
      for (const polygon of polygons) {
        const ring = polygon[0];
        if (!ring.length)
          continue;
        const [startX, startY] = ring[0];
        context.moveTo(startX, startY);
        for (const [x, y] of ring.slice(1))
          context.lineTo(x, y);
        context.closePath();
      }
      context.setSourceRGBA(rgb[0], rgb[1], rgb[2], 1);
      context.fillPreserve();
      context.setSourceRGBA(0.66, 0.75, 0.76, 0.8);
      context.setLineWidth(0.55);
      context.stroke();
    }

    for (const {polygons} of this._mapShapes) {
      context.newPath();
      for (const polygon of polygons) {
        const ring = polygon[0];
        if (!ring.length)
          continue;
        const [startX, startY] = ring[0];
        context.moveTo(startX, startY);
        for (const [x, y] of ring.slice(1))
          context.lineTo(x, y);
        context.closePath();
      }
      context.setSourceRGBA(0.8, 0.88, 0.88, 0.9);
      context.setLineWidth(1.2);
      context.stroke();
    }
    context.$dispose();
  }

  _rgb(color) {
    const value = color.replace('#', '');
    return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16) / 255);
  }

  _featureAt(x, y) {
    for (const {feature, polygons} of this._mapShapes) {
      const contains = polygons.some(rings => {
        return pointInRing([x, y], rings[0]) &&
          !rings.slice(1).some(ring => pointInRing([x, y], ring));
      });
      if (contains)
        return feature;
    }
    return null;
  }

  _districtAt(x, y, oblastCode) {
    const oblastName = REGION_NAMES[oblastCode]
      .replace(/ область$/, '')
      .replace('м. Київ', 'Київ')
      .replace('м. Севастополь', 'Севастополь');
    for (const {feature, polygons} of this._districtShapes) {
      if (feature.properties.adm1_name !== oblastName)
        continue;
      const contains = polygons.some(rings =>
        pointInRing([x, y], rings[0]) &&
        !rings.slice(1).some(ring => pointInRing([x, y], ring)));
      if (contains)
        return feature;
    }
    return null;
  }

  _updateDisplay(locationChanged = false) {
    this._mapArea.queue_repaint();
    const homeName = this._settings?.get_string('home-oblast') ?? '';
    const homeCode = REGION_BY_NAME[homeName];
    const homeDistrictCode = this._settings?.get_string('home-district') ?? '';
    const homeAlerts = homeCode ? this._regionAlerts(homeCode) : [];
    const configuredDistrict = this._districtFeatures.find(({properties}) =>
      properties.adm2_code === homeDistrictCode);
    const homeDistrict = configuredDistrict &&
      this._districtOblastByCode.get(homeDistrictCode) === homeCode
      ? configuredDistrict : null;
    const neighboringAlerts = homeDistrict
      ? (homeDistrict.properties.neighbors ?? [])
        .flatMap(districtCode => this._districtAlertGroups.get(districtCode) ?? [])
      : (NEIGHBORS[homeCode] ?? [])
        .flatMap(code => this._regionAlerts(code))
        .filter(alert => alert.location_type !== 'oblast');
    const globalAlerts = [...this._alertGroups.values()].flat();
    const homeDistrictAlerts = homeDistrict
      ? this._districtAlertGroups.get(homeDistrictCode) ?? [] : [];
    let direct = globalAlerts;
    if (homeDistrictCode)
      direct = homeDistrict ? homeDistrictAlerts : [];
    else if (homeCode)
      direct = homeAlerts;
    if (direct.length) {
      this._setIconState('alert', strongestColor(direct), locationChanged);
      return;
    }
    if (neighboringAlerts.length) {
      this._nearbyColor = strongestColor(neighboringAlerts);
      this._setIconState('nearby', this._nearbyColor);
      return;
    }
    this._setIconState('idle', IDLE_ICON_COLOR);
  }

  _setIconState(mode, color, restartTone = false) {
    const state = `${mode}:${color}`;
    if (state === this._iconState) {
      if (mode === 'alert' && restartTone) {
        if (this._settings.get_string('sound-mode') === 'off') {
          this._stopAlertTone();
          this._pulseTimer = this._pulse(1200, [1, 0.42]);
        } else {
          this._playAlertTone(color);
        }
      }
      return;
    }
    this._iconState = state;
    this._stopPulse();
    if (mode === 'alert') {
      this._icon.set_style(`color: ${color};`);
      this._icon.set_opacity(255);
      if (this._settings.get_string('sound-mode') === 'off')
        this._pulseTimer = this._pulse(1200, [1, 0.42]);
      else
        this._playAlertTone(color);
    } else if (mode === 'nearby' || mode === 'idle') {
      this._stopAlertTone();
      this._icon.set_style(`color: ${color};`);
      const nearby = mode === 'nearby';
      this._startBreathing(state, nearby ? 7.5 : 9.5,
        nearby ? NEARBY_BREATH_MIN : 150,
        nearby ? NEARBY_BREATH_MAX : 220);
      if (nearby) {
        this._sweepIcon.set_style(`color: ${this._nearbyColor};`);
        this._nearbySweepTimer = GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT, 5, () => {
            this._runNearbySweep(this._nearbyColor);
            return GLib.SOURCE_CONTINUE;
          });
      }
    } else {
      this._stopAlertTone();
      this._icon.set_style(`color: ${color};`);
      this._icon.set_opacity(255);
    }
  }

  _startBreathing(state, periodSeconds, minOpacity, maxOpacity) {
    const startedAt = GLib.get_monotonic_time();
    this._breathTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 32, () => {
      if (this._iconState !== state) {
        this._breathTimer = 0;
        return GLib.SOURCE_REMOVE;
      }
      const elapsed = (GLib.get_monotonic_time() - startedAt) / 1000000;
      const phase = (elapsed % periodSeconds) / periodSeconds;
      const eased = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
      this._icon.set_opacity(Math.round(minOpacity + (maxOpacity - minOpacity) * eased));
      return GLib.SOURCE_CONTINUE;
    });
  }

  _playAlertTone(color) {
    if (this._pulseTimer) {
      GLib.source_remove(this._pulseTimer);
      this._pulseTimer = 0;
    }
    this._stopAlertTone();
    const soundMode = this._settings.get_string('sound-mode');
    if (soundMode === 'off') {
      this._pulseTimer = this._pulse(1200, [1, 0.42]);
      return;
    }
    if (soundMode === 'siren') {
      this._sirenPulseTimer = this._pulse(900, [1, 0.45]);
      this._playSirenBurst(0);
      return;
    }
    if (soundMode === 'voice') {
      this._playVoiceAlert(color);
      return;
    }
    const language = resolveLanguage(this._settings?.get_string('ui-language') ?? 'auto');
    const morseWord = language === 'uk' ? 'uk' : 'en';
    const soundFile = Gio.File.new_for_path(GLib.build_filenamev([
      this.path, 'data', `alert-morse-${morseWord}.mp3`,
    ]));
    this._playAudioFile(soundFile)
      .then(played => {
        if (played && this._iconState.startsWith('alert:'))
          this._startMorseBlink(morseWord);
      })
      .catch(error => logError(error, `[${this.uuid}] Could not play alert tone`));
  }

  _playVoiceAlert(color) {
    const alertLevel = color === LEVEL_COLORS.yellow ? 'yellow' : 'red';
    const selectedLevel = this._settings.get_string('voice-alert-level');
    if (selectedLevel === 'yellow' && alertLevel !== 'yellow') {
      this._pulseTimer = this._pulse(1200, [1, 0.42]);
      return;
    }
    if (selectedLevel === 'red' && alertLevel !== 'red') {
      this._pulseTimer = this._pulse(1200, [1, 0.42]);
      return;
    }
    const fileLevel = selectedLevel === 'standard'
      ? 'all'
      : selectedLevel === 'all'
        ? alertLevel
        : selectedLevel;
    const language = resolveLanguage(this._settings?.get_string('ui-language') ?? 'auto');
    const languageOptions = language === 'en' ? ['en'] : [language, 'en'];
    const soundFile = languageOptions
      .map(code => Gio.File.new_for_path(GLib.build_filenamev([
        this.path, 'data', 'voice', `alert-voice-${code}-${fileLevel}.mp3`,
      ])))
      .find(file => file.query_exists(null));
    if (!soundFile) {
      logError(new Error(`No voice recording found for ${language}/${fileLevel}`),
        `[${this.uuid}] Voice alert is not configured`);
      this._pulseTimer = this._pulse(1200, [1, 0.42]);
      return;
    }
    this._playAudioFile(soundFile)
      .then(played => {
        if (played && this._iconState.startsWith('alert:'))
          this._pulseTimer = this._pulse(1200, [1, 0.42]);
      })
      .catch(error => {
        logError(error, `[${this.uuid}] Could not play voice alert`);
        if (this._iconState.startsWith('alert:'))
          this._pulseTimer = this._pulse(1200, [1, 0.42]);
      });
  }

  _playSirenBurst(repeatIndex) {
    if (!this._iconState.startsWith('alert:')) {
      this._stopAlertTone();
      return;
    }
    if (repeatIndex >= 2) {
      this._stopAlertTone();
      if (this._iconState.startsWith('alert:'))
        this._pulseTimer = this._pulse(1200, [1, 0.42]);
      return;
    }
    const soundFile = Gio.File.new_for_path(GLib.build_filenamev([
      this.path, 'data', 'alert-siren.mp3',
    ]));
    this._playAudioFile(soundFile, () => {
      if (!this._iconState.startsWith('alert:'))
        return;
      if (repeatIndex >= 1) {
        this._playSirenBurst(repeatIndex + 1);
        return;
      }
      this._sirenBurstTimer = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT, 1, () => {
          this._sirenBurstTimer = 0;
          this._playSirenBurst(repeatIndex + 1);
          return GLib.SOURCE_REMOVE;
        });
    })
      .catch(error => {
        this._stopAlertTone();
        logError(error, `[${this.uuid}] Could not play siren`);
        if (this._iconState.startsWith('alert:'))
          this._pulseTimer = this._pulse(1200, [1, 0.42]);
      });
  }

  async _playAudioFile(soundFile, onEos = null) {
    this._stopAudioPlayback();
    const playbackGeneration = this._audioPlaybackGeneration;
    const Gst = await loadGst();
    if (playbackGeneration !== this._audioPlaybackGeneration)
      return false;

    const pipeline = Gst.ElementFactory.make('playbin', null);
    if (!pipeline)
      throw new Error('GStreamer playbin is unavailable');

    pipeline.set_property('uri', soundFile.get_uri());
    const bus = pipeline.get_bus();
    bus.add_signal_watch();
    this._audioPipeline = pipeline;
    this._audioGst = Gst;
    this._audioBus = bus;
    this._audioOnEos = onEos;
    this._audioBusMessageId = bus.connect('message', (_bus, message) => {
      if (this._audioPipeline !== pipeline)
        return;
      if (message.type === Gst.MessageType.ERROR) {
        const [error, debug] = message.parse_error();
        this._stopAudioPlayback();
        logError(error, `[${this.uuid}] GStreamer playback failed: ${debug}`);
      } else if (message.type === Gst.MessageType.EOS) {
        const handleEos = this._audioOnEos;
        this._stopAudioPlayback();
        handleEos?.();
      }
    });

    if (pipeline.set_state(Gst.State.PLAYING) === Gst.StateChangeReturn.FAILURE) {
      this._stopAudioPlayback();
      throw new Error('GStreamer could not start audio playback');
    }
    return true;
  }

  _stopAudioPlayback() {
    this._audioPlaybackGeneration = (this._audioPlaybackGeneration ?? 0) + 1;
    this._audioOnEos = null;
    if (!this._audioPipeline)
      return;

    const Gst = this._audioGst;
    const pipeline = this._audioPipeline;
    this._audioPipeline = null;
    this._audioGst = null;
    if (this._audioBus && this._audioBusMessageId)
      this._audioBus.disconnect(this._audioBusMessageId);
    this._audioBus?.remove_signal_watch();
    this._audioBus = null;
    this._audioBusMessageId = 0;
    pipeline.set_state(Gst.State.NULL);
  }

  _startMorseBlink(language) {
    const intervals = morseToneIntervals(language);
    const duration = intervals[intervals.length - 1]?.[1] ?? 0;
    const startedAt = GLib.get_monotonic_time();
    let intervalIndex = 0;
    this._morseBlinkTimer = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT, 16, () => {
        const elapsed = (GLib.get_monotonic_time() - startedAt) / 1000;
        if (elapsed >= duration) {
          this._morseBlinkTimer = 0;
          this._stopAlertTone();
          if (this._iconState.startsWith('alert:'))
            this._pulseTimer = this._pulse(1200, [1, 0.42]);
          return GLib.SOURCE_REMOVE;
        }
        while (intervalIndex < intervals.length &&
          elapsed >= intervals[intervalIndex][1])
          intervalIndex++;
        const currentInterval = intervals[intervalIndex];
        const toneIsActive = currentInterval && elapsed >= currentInterval[0];
        this._icon.set_opacity(toneIsActive ? 255 : 48);
        return GLib.SOURCE_CONTINUE;
      });
  }

  _stopAlertTone() {
    if (this._morseBlinkTimer) {
      GLib.source_remove(this._morseBlinkTimer);
      this._morseBlinkTimer = 0;
    }
    if (this._sirenBurstTimer) {
      GLib.source_remove(this._sirenBurstTimer);
      this._sirenBurstTimer = 0;
    }
    if (this._sirenPulseTimer) {
      GLib.source_remove(this._sirenPulseTimer);
      this._sirenPulseTimer = 0;
      this._icon?.set_opacity(255);
    }
    this._stopAudioPlayback();
  }

  _runNearbySweep(color) {
    if (this._iconState !== `nearby:${color}`)
      return;
    const startedAt = GLib.get_monotonic_time();
    const duration = 950;
    const bandSize = 11;
    this._sweepIcon.set_opacity(255);
    this._nearbySweepAnimationTimer = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT, 16, () => {
        if (this._iconState !== `nearby:${color}`) {
          this._sweepIcon.set_opacity(0);
          this._sweepIcon.remove_clip();
          this._nearbySweepAnimationTimer = 0;
          return GLib.SOURCE_REMOVE;
        }
        const elapsed = (GLib.get_monotonic_time() - startedAt) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const offset = -bandSize + progress * (this._icon.get_width() + bandSize * 2);
        this._sweepIcon.set_clip(offset, offset, bandSize, bandSize);
        this._sweepIcon.set_opacity(Math.round(220 * Math.sin(Math.PI * progress)));
        if (progress >= 1) {
          this._sweepIcon.set_opacity(0);
          this._sweepIcon.remove_clip();
          this._nearbySweepAnimationTimer = 0;
          return GLib.SOURCE_REMOVE;
        }
        return GLib.SOURCE_CONTINUE;
      });
  }

  _pulse(interval, opacityValues) {
    const startedAt = GLib.get_monotonic_time();
    const minimumOpacity = Math.min(...opacityValues);
    const opacityRange = Math.max(...opacityValues) - minimumOpacity;
    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, 32, () => {
      const elapsed = (GLib.get_monotonic_time() - startedAt) / 1000;
      const phase = (elapsed % interval) / interval;
      const eased = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
      const opacity = minimumOpacity + opacityRange * eased;
      this._icon?.set_opacity(Math.round(opacity * 255));
      return this._icon ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
    });
  }

  _stopPulse() {
    if (this._pulseTimer) {
      GLib.source_remove(this._pulseTimer);
      this._pulseTimer = 0;
    }
    if (this._nearbySweepTimer) {
      GLib.source_remove(this._nearbySweepTimer);
      this._nearbySweepTimer = 0;
    }
    if (this._breathTimer) {
      GLib.source_remove(this._breathTimer);
      this._breathTimer = 0;
    }
    if (this._nearbySweepAnimationTimer) {
      GLib.source_remove(this._nearbySweepAnimationTimer);
      this._nearbySweepAnimationTimer = 0;
    }
    this._sweepIcon?.set_opacity(0);
    this._sweepIcon?.remove_clip();
    this._icon?.set_opacity(255);
  }
}