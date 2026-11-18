Prefer `read` for static web pages; fall back to browser only when necessary.

Embed line ranges inside `path` rather than passing separate range/offset/limit fields:
- `{"path":"notes.txt:450-455"}` returns lines 450–455; `{"path":"notes.txt:-5"}` returns the final 5 lines.
- Supply the selector on every ranged request; calling a bare path repeatedly does not paginate forward.

Path suffixes:
- `:50` or `:50-` begins at line 50; `:50-200` is inclusive; `:50+150` reads 150 lines starting at 50; `:-60` reads the final 60 lines.
- Separate multiple ranges (`:5-16,960-973`) or single lines (`:19,59`) with commas.
- A single non-raw range automatically includes 1 line of leading context and 3 lines of trailing context (`:50-80` displays 49–83).
- Non-raw reads (including comma-separated lists) may emit the opening or closing line of a truncated block; only `:raw` is strictly exact.
- `:raw` outputs exact lines without hash anchors or prefixes; `:2-4:raw` or `:raw:2-4` yields those exact lines.
- With `:raw`, a single number selects that lone line (`:17:raw`), while `:17-:raw` reads from line 17 onward.

Sources:
- Bare code files show declarations only; re-read ONLY omissions named in the footer, NEVER guess `..` or `…`.
{{#if IS_HL_MODE}}
- Selected file: `[foo.ts#1A2B]` snapshot tag with numbered lines. Copy `[FILENAME#TAG]` for anchored edits; NEVER fabricate tags.
{{/if}}
- Directory: shows the full root; nested directory listings cap at 12 entries (`… N more`)—read child paths directly or paginate with `:N-M` / `:-N`.
- URLs: reader-mode text/Markdown, `:raw` for raw HTML; bare `host:port` requires a trailing slash.
- PDF/documents: extracted text; notebooks: editable cells; images: decoded inline.
- Additional selectors are documented in `xdev://read/sources` (read it prior to first use):
  - SQLite, archives (ZIP, TAR, 7z, RAR, etc.), JSON/JSONL via jq filter, {{#if BINARY_VIEWS}}executables, {{/if}}video, SVG rendered as image, and merge conflicts.
