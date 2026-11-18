<title-request>
Internal UI request, not a user message. Your main response continues independently; NEVER execute the task here.
{{#if card}}
Label this session for a compact badge: an icon, a short code, and a 3-6 word title for the user's objective, based on the user's prompt and your reasoning so far.
{{else}}
Label this session with a 3-6 word title for the user's objective, based on the user's prompt and your reasoning so far.
{{/if}}
{{#if nerdFonts}}
- nf: the Nerd Fonts icon name (nf-md-*, nf-cod-*, nf-dev-*, nf-fa-*, nf-oct-*, nf-seti-*) for the clearest visual depiction of this session's topic, distinguishing it from other sessions in the same repo:
  - depict the specific component or feature named in the title (nf-md-file_tree for a directory walker); pick a specialized variant solely when it depicts the action itself (nf-md-bell_off for muting notifications);
  - pick a technology logo only when the session centers on that language, tool, or service (nf-dev-docker for Docker builds), never merely because the repo uses it;
  - pick a bug, flask, speedometer, gear, or terminal icon solely when the session directly targets that object, never as a generic stand-in for work type (fixes, tests, optimization, config) or the repo's overall domain;
  Supply only an icon name you know exists; never make one up.
- emoji: the matching emoji fallback when icon fonts are unavailable; never pick generic ✨, 🚀, 🔧, ⚙️ or 🧩.
{{else if card}}
- emoji: the most distinctive emoji depicting this session's topic, setting it apart from sibling sessions in the same repo: depict the specific component or feature in the title (🌲 for a directory walker, 🔕 for muting notifications); pick a mascot or emblem only when the session focuses on that language, tool, or service (🐳 for Docker builds), never merely because the repo uses it; use 🐛, 🧪 or ⚡ solely when the session specifically targets that thing, never as a catch-all for work type (fixes, tests, speedups); never pick generic ✨, 🚀, 🔧, ⚙️ or 🧩.
{{/if}}
{{#if card}}
- code: strictly 1-6 uppercase letters or digits capturing the subject at a glance, derived from a single word or identifier in the title: keep the full word when ≤6 letters (SEED, SCOPE, FREEZE, Z3, 404), otherwise abbreviate to its opening syllable or leading consonants (PROV for provider, FLBK for fallback). Never form multi-word acronyms unless the user writes them so (CTA, SDK), nor a code that reads like an unrelated word.
{{/if}}
- Title: concise imperative phrase using the user's own key terms: the feature, component, or failure they cite.
- No identifiable task (greeting, acknowledgement, nonsense)? Emit `<title/>`.
- Omit quotes, trailing punctuation, and commentary.
{{#if nerdFonts}}
Emit strictly a single line: `<title nf="nf-md-parking" emoji="🅿️" code="PARK">Fix flaky park tests</title>` (using your own icon, emoji, code, and title), or `<title/>`.
{{else if card}}
Emit strictly a single line: `<title emoji="🅿️" code="PARK">Fix flaky park tests</title>` (using your own emoji, code, and title), or `<title/>`.
{{else}}
Emit strictly a single line: `<title>Fix flaky park tests</title>` (using your own title), or `<title/>`.
{{/if}}
</title-request>
