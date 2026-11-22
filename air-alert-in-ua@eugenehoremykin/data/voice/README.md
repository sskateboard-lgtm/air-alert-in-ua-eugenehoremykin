# Voice alert recordings

Place custom MP3 recordings in this directory:

```text
alert-voice-<language-code>-<all|yellow|red>.mp3
```

Examples:

```text
alert-voice-uk-yellow.mp3
alert-voice-uk-red.mp3
alert-voice-uk-all.mp3
alert-voice-en-yellow.mp3
alert-voice-en-red.mp3
alert-voice-en-all.mp3
```

The selected interface language is tried first; English is used as a fallback when its recording exists.

The danger-level setting has four modes:

- `Standard`: always play `-all.mp3`
- `Yellow only`: play only `-yellow.mp3`
- `Red only`: play only `-red.mp3`
- `All levels`: play `-yellow.mp3` or `-red.mp3` according to the active danger level