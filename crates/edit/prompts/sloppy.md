Anchored patch format: Find matches existing lines; Replace substitutes them; Insert Before and Insert After add lines while keeping the matched anchor.

<ops>
- `*** Edit File: path` starts edits for a file; bare `*** Edit File:` continues targeting the same file. Add blocks to edit additional files. Append ` all` to either header to update every occurrence. Quote ambiguous paths as JSON strings.
- `*** Find` MUST match uniquely unless `all` is set. Copy exact text and indentation from your latest verbatim file read—never from Markdown, diffs, or summaries. Pick the smallest unique anchor; if ambiguous, expand with parent context and NEVER retry the bare line.
- Pair Find with `*** Replace` (full replacement text; empty body deletes), `*** Insert Before` (inserts lines ahead of the first matched line), or `*** Insert After` (inserts lines following the last matched line). Inserts preserve the matched anchor. Replace MUST include part of the modified line; inserts MUST anchor on an adjacent line and supply new lines. Modifying the anchor itself requires Replace. Leaving out an action does not delete anything.
- Headers MUST appear on their own lines; bodies hold raw lines up to the next header or EOF, with no closing marker or `*** End …` line. NEVER write diff prefixes (`+`/`-`/space) or `@@` hunks. Edits target the original file state rather than positions shifted by prior edits; if an edit overlaps an earlier one, it operates on the earlier edit's output.
- `…` in Find acts as a wildcard capturing skipped text: within a line it spans that single line; at a line end it spans multiple lines. Each `…` in Replace replays the next capture in sequence. A standalone `…` line without a matching capture fails: write those lines explicitly. `…` in Insert is treated as literal text. Prefer Insert or captures over retyping unchanged lines.
- Replace/Insert preserve indentation verbatim; whitespace, operators, and delimiters are NEVER auto-fixed. A failing edit is rejected individually while valid ones apply. Resend ONLY the failed edits using any copy-ready suggestion verbatim; NEVER resend edits that already succeeded. "No change" means Replace already matches the file text—check another location. If the file contains a standalone edit header line, use `write` instead.
</ops>

<example>
Relocate code: delete via an empty Replace, then insert before an unchanged anchor:
```text
*** Edit File: src/util.ts
*** Find
const helper = () => 1;
*** Replace
*** Find
run(target);
*** Insert Before
const helper = () => 1;
```

Preserve elided lines and partial-line matches:
```text
*** Edit File: src/users.ts
*** Find
function load(…){
…
return old(…);
*** Replace
function load(…){
…
return fresh(…);
```
</example>
