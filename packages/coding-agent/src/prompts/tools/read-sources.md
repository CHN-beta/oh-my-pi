`read` path selectors (and `write` targets) for inputs beyond plain text files, directories, and URLs.

- SQLite: `file.db` lists tables; `:table` reads schema/rows; `:table:key` looks up by primary key; `?limit=`, `?where=`, `?q=SELECT`.
- Archives: ZIP/JAR/APK/WHL, compressed TAR, RAR/7z/ISO/CAB/DEB/RPM/CPIO/AR/LZH/ARJ/ASAR, and compressed streams; access an entry via `archive.ext:member/path`.
- JSON/JSONL/NDJSON: `file.json?q=<jq filter>`
  - `&raw=true` outputs unquoted strings, `&compact=true` formats one-line values, and `&offset=` / `&limit=` paginate array items or result values.
  - Encode `&` inside filters as `%26`.
  - Produces plain text rather than a single JSON document; use its continuation hint to read the next page.
{{#if BINARY_VIEWS}}
- Executables (ELF/PE/Mach-O, with or without extension): summary plus function list.
  - `:<func|0xaddr>` decompiled pseudocode, `:<func>:asm` disassembly, `:imports`, `:exports`, `:strings`, `:xrefs:<func|0xaddr>`.
  - Append line ranges after the view selector (`bin:main:10-40`).
  - Universal Mach-O binaries default to the host architecture slice; `bin:@<arch>` chooses another (`bin:@x86_64:main`).
{{/if}}
- Video (requires `ffmpeg`/`ffprobe`): bare path gives preview grid and metadata, `:412` extracts frame 412, `:1h5m42s` / `:90s` / `:01:23` seeks by timestamp.
- SVG/SVGZ defaults to text; `:img` rasterizes into an image and `:raw` returns original source.
  - Raster formats (PNG, JPEG) require no selector; `:img` fails on them.
- Merge conflicts: `:conflicts` outputs one line per unresolved conflict hunk.
- `write` targets:
  - `archive.ext:member`: ZIP/tar variants and `.asar` are writable; other formats are read-only.
  - `db.sqlite:table`: inserts a row.
  - `db.sqlite:table:key`: updates via JSON; empty content deletes the row.
