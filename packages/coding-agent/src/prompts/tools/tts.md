Synthesize speech audio from text and save it to `output_path`.

Model selection follows the speech role and its fallback chain:
- `local-inference`: offline neural TTS (Phonon 31M running on the native runtime)
  - requires no network; always outputs WAV/PCM16
  - voice configured via `tts.localVoice` — {{localVoices}}
- `xai-tts`: xAI Grok Voice; supports MP3 or WAV
  - built-in voices: {{xaiVoices}}; custom voice IDs supported
- `openai-speech`: compatible cloud endpoint for the selected model; supports MP3 or WAV
  - `voice_id` is sent only when explicitly provided

Chain ordering and output format:
- For an MP3 request, unconfigured cloud candidates precede unconfigured local candidates; explicitly configured speech entries preserve their order.
- If fallback reaches `local-inference` with a non-WAV target path → writes to a sibling `.wav` file instead.
- Cloud audio codec is determined from the `output_path` file extension.
- Maximum {{maxLength}} characters.
