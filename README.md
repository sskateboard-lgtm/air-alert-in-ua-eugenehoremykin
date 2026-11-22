I’ll use the current README and locale definitions to write an accurate English overview, including features and the exact language support list.

Read , lines 1 to 100
Completed with input: {
  "path": "/home/eugene/Документи/Projects/path_browser/air-alert-in-ua/README.md",
  "view_range": [
    1,
    100
  ]
}

Read , lines 1 to 350
Completed with input: {
  "path": "/home/eugene/Документи/Projects/path_browser/air-alert-in-ua/locale.js",
  "view_range": [
    1,
    350
  ]
}

Read , lines 1 to 126
Completed with input: {
  "path": "/home/eugene/Документи/Projects/path_browser/air-alert-in-ua/locale-extra.js",
  "view_range": [
    1,
    126
  ]
}

Read 
Completed with input: {
  "path": "/home/eugene/Документи/Projects/path_browser/air-alert-in-ua/metadata.json"
}

Ran terminal command: python3 - <<'PY'
import re
from pathlib import Path
base=Path('/home/eugene/Документи/Projects/path_browser/air-alert-in-ua')
locale=(base/'locale.js').read_text()
extra=(base/'locale-extra.js').read_text()
m=re.search(r'export const EXTRA_LANGUAGE_NAMES = \{(.*?)\n\};',extra,re.S)
entries=[]
if m:
 entries=re.findall(r'^  ([A-Za-z_]+):',m.group(1),re.M)
print('Extra languages:',len(entries),entries)
print('Total interface choices including auto, uk, en:',len(entries)+3)
print('Base language codes mentioned:',re.findall(r"^  ([a-zA-Z_]+): \{",locale,re.M)[:20])
PY
rg -n 'get_string\(|set_string\(|GEO|GeoClue|district|oblast|neighbor|refresh|voice-alert-level|sound-mode|siren|Morse|public|token|language' /home/eugene/Документи/Projects/path_browser/air-alert-in-ua/extension.js /home/eugene/Документи/Projects/path_browser/air-alert-in-ua/prefs.js | sed -n '1,220p'

```markdown
# Air Alert Monitor for GNOME

**Air Alert Monitor** is a GNOME Shell extension for monitoring air-raid alerts across Ukraine. It provides a district-level map, a configurable panel indicator, location detection, and several notification modes.

> This extension is independent and is not an official government or emergency-alert service. It must not be used as the sole source of safety information.

## Features

- Displays active air-raid alerts on an interactive map.
- Supports oblast and district selection.
- Can automatically detect the user's oblast and district with GeoClue.
- Filters alerts for the selected district and neighboring districts.
- Updates alert data every two minutes.
- Changes the panel icon according to the current danger level.
- Supports alerts from `alerts.in.ua` and the public `ubilling.net.ua` feed.
- Optional `alerts.in.ua` API token for detailed district-level alert data.
- Refreshes data manually or automatically.
- Provides tooltips for map regions and panel controls.
- Includes a separate preferences window with Settings and About tabs.
- Displays copyright, licensing, data-source, privacy, and donation information.

## Sound Notifications

Four sound modes are available:

- **Off** — no sound notifications.
- **Morse** — repeats the Morse sequence eight times.
- **Siren** — plays `alert-siren.mp3` twice with a one-second pause between plays.
- **Voice alert** — plays a custom spoken announcement.

Voice announcements support:

- **Standard** — always plays the `all` recording.
- **Yellow only** — plays the yellow-level recording only.
- **Red only** — plays the red-level recording only.
- **All levels** — automatically chooses the yellow or red recording according to the alert level.

Custom voice recordings use MP3 files in `data/voice/`, for example:

```text
alert-voice-en-all.mp3
alert-voice-en-yellow.mp3
alert-voice-en-red.mp3
alert-voice-uk-all.mp3
alert-voice-uk-yellow.mp3
alert-voice-uk-red.mp3
```

The selected interface language is tried first, with English used as a fallback.

## Interface Languages

The extension supports 41 languages, plus Automatic:

- Ukrainian
- English
- German
- Polish
- Simplified Chinese
- Japanese
- Czech
- Slovak
- Bulgarian
- Greek
- Croatian
- Romanian
- Belarusian
- Hebrew
- Spanish
- Portuguese
- Georgian
- Armenian
- Italian
- Scottish Gaelic
- Irish
- Welsh
- Kazakh
- Arabic
- Swedish
- Norwegian Bokmål
- French
- Mongolian
- Hindi
- Afrikaans
- Swahili
- Amharic
- Zulu
- Hausa
- Yoruba
- Indonesian
- Māori
- Fijian
- Samoan
- Tok Pisin
- Tongan

## Requirements

- GNOME Shell 45 through 50
- An internet connection for alert data
- GeoClue if automatic location detection is used
- An optional `alerts.in.ua` API token

## Installation

Install from extensions.gnome.org or manually from the project directory:

```sh
glib-compile-schemas schemas
gnome-extensions pack --force --out-dir /tmp .
gnome-extensions install --force /tmp/air-alert-in-ua@eugenehoremykin.shell-extension.zip
```

After installation, enable the extension and open its preferences to configure the data source, region, district, interface language, and sound mode.

## Privacy

Location coordinates are processed locally to determine the selected oblast and district. They are not sent to the alert-data services by the extension.

Alert data is provided by independent third-party services:

- https://alerts.in.ua/
- https://ubilling.net.ua/aerialalerts/

The extension also relies on system GeoClue, whose providers may have their own privacy policies.

## Data and Licensing

- Oblast boundaries are based on geoBoundaries ADM1 data and are licensed under CC BY 4.0.
- District boundaries and community lookup data are based on OCHA Ukraine COD-AB data and are licensed under CC BY-IGO 3.0.
- The extension source code is licensed under GPL-2.0-or-later.

## Important Notice

Alert information may be incomplete, inaccurate, delayed, or unavailable. Always use official government and emergency-alert services alongside this extension.

## Disclaimer

The extension is provided as an independent open-source project. It is not affiliated with or endorsed by Ukraine's government, emergency services, alerts.in.ua, or ubilling.net.ua. Software and data are provided as-is, without guarantees.
```
