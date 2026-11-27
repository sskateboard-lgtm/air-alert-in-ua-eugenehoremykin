# air-alert-in-ua

GNOME Shell extension by Eugene Horemykin. It displays current Ukrainian air alerts on a district map and changes the panel icon according to the selected home district and its adjacent districts.

The extension code is licensed under GPL-2.0-or-later; see [LICENSE](./LICENSE). Copyright © 2026 Yevhen Horemykin. Third-party geographic data remains under its own license.

## Requirements

- GNOME Shell 45 through 51
- Optional alerts.in.ua API token from <https://alerts.in.ua/api-request>

## Release notes

### 1.0.3

- Add GNOME Shell 51 support.
- Update vertical box layouts to use the supported orientation property, fixing extension loading on GNOME 51.

Without a token, the extension uses the public oblast-level feed at <https://ubilling.net.ua/aerialalerts/>. A configured alerts.in.ua token enables more detailed alert data. The extension polls every two minutes. Direct district alerts support off, Morse, siren, and custom voice modes. Morse repeats eight times; the siren recording `data/alert-siren.mp3` plays in full twice, with a 1-second pause between plays. Voice recordings are loaded from `data/voice/` using `alert-voice-<language-code>-<all|yellow|red>.mp3`. In voice mode, “Standard” always uses the `all` recording; “Yellow only” and “Red only” play only the matching danger-level recording; “All levels” uses `yellow` or `red` according to the active danger level. Preferences has separate Settings and About pages. The About page follows the selected interface language, including Auto; 41 interface languages are available in preferences, with Ukrainian and English pinned immediately after Auto. Less common technical error messages fall back to English. Alert information may be delayed and must not be used as the sole source for emergency decisions.

## Install

From this directory, install the extension bundle:

```sh
gnome-extensions pack --force --out-dir /tmp .
gnome-extensions install --force /tmp/air-alert-in-ua@eugenehoremykin.shell-extension.zip
```

For a manual ZIP, run the archiver from this extension directory so `metadata.json` is at the archive root, and exclude the locally compiled schema:

```sh
zip -r /tmp/air-alert-in-ua@eugenehoremykin.zip . -x 'schemas/gschemas.compiled'
```

Do not zip the parent directory itself; that adds an extra directory level and makes the bundle invalid for extensions.gnome.org.

Then log out and back in on X11, or restart GNOME Shell on Wayland by logging out and back in. Enable the extension and open its preferences to optionally enter the token and select the home oblast and district.

The bundled oblast boundaries are based on geoBoundaries ADM1 for Ukraine (2023 build), adapted for this extension and licensed under CC BY 4.0. Attribution: geoBoundaries, <https://www.geoboundaries.org/>. License: <https://creativecommons.org/licenses/by/4.0/>.

District boundaries and the community-to-district lookup are based on OCHA Ukraine's Ukraine COD-AB dataset, version 05 (reviewed December 2025), adapted for this extension and licensed under CC BY-IGO 3.0. Attribution: OCHA Ukraine / HDX. Dataset: <https://data.humdata.org/dataset/cod-ab-ukr>. License: <https://creativecommons.org/licenses/by/3.0/igo/legalcode>.

Alert data sources are third-party services: <https://alerts.in.ua/> and <https://ubilling.net.ua/aerialalerts/>. This extension is independent and is not an official government or emergency alert service, nor is it endorsed by those providers. Alert data may be incomplete, inaccurate, delayed, or unavailable; do not rely on the extension as the sole source of safety information. The extension processes GeoClue coordinates locally to determine the selected oblast and district and does not send those coordinates to alert-data services. Custom voice recordings supplied by users must be used with the required rights and permissions.