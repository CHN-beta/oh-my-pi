Prefer `read` for static web pages; fall back to browser only when necessary.

Embed line ranges inside `path` rather than passing separate range/offset/limit fields:
- `{"path":"notes.txt:450-455"}` returns lines 450–455; `{"path":"notes.txt:-5"}` returns the final 5 lines.
- Supply the selector on every ranged request; calling a bare path repeatedly does not paginate forward.

Path suffixes:
- :50 line 50; :50- from line 50 on; :50-200 inclusive; :50+150 counts lines; :-60 last 60.
- Commas join ranges (:5-16,960-973) or individual lines (:19,59).
- A single non-raw range also shows 1 line before and 3 after (:50-80 shows 49-83).
- Non-raw reads (comma lists too) may add the open/close line of a cut block; only :raw stays exact.
{{#if IS_HL_MODE}}
- :raw verbatim without anchors/prefixes (skips folding and the display-width limit); combine :2-4:raw or :raw:2-4 for exactly those lines.
{{else if HAS_LINE_NUMBERS}}
- :raw verbatim without line prefixes (skips folding and the display-width limit); combine :2-4:raw or :raw:2-4 for exactly those lines.
{{else}}
- :raw verbatim (skips folding and the display-width limit); combine :2-4:raw or :raw:2-4 for exactly those lines.
{{/if}}

Sources:
- Bare code files show declarations only; re-read ONLY omissions named in the footer, NEVER guess `..` or `…`.
{{#if IS_HL_MODE}}
- Selected file: `[foo.ts#1A2B]` snapshot tag with numbered lines. Copy `[FILENAME#TAG]` for anchored edits; NEVER fabricate tags.
{{/if}}
- Directory: shows the full root; nested directory listings cap at 12 entries (`… N more`)—read child paths directly or paginate with `:N-M` / `:-N`.
- URLs: reader-mode text/Markdown, `:raw` for raw HTML; bare `host:port` requires a trailing slash.
- PDF/DOCX/PPTX/XLSX/EPUB: extracted text; notebooks: editable cells; images: decoded inline.
- Also, with selectors in help://read/sources (read it before first use):
  - SQLite, archives (ZIP, TAR, 7z, RAR and more), JSON/JSONL by jq filter, executable metadata, video, SVG as image, merge conflicts.
