Language-server-backed symbol intelligence — navigation, refactoring, and diagnostics that catch references text search overlooks.

<operations>
- Positional lookups: `file` + `line` + `symbol` (substring match; append `#N` for the Nth occurrence). `line` is 1-based.
- `rename` — applies edits immediately by default; pass `apply: false` to preview. Project-wide operations ERROR when `symbol` is omitted — no silent fallback on missing or ambiguous targets.
- `code_actions` — lists available actions by default; apply ONE using `apply: true` with `query` (title substring or index).
- `rename_file` — relocates a file AND updates all imports and references; applies by default.
- `diagnostics` — accepts a file path, glob (`src/**/*.ts`), or `file: "*"` for the full workspace.
- `symbols` — `file` enumerates symbols in a file; `file: "*"` with `query` searches across the workspace.
- `reload` — restarts a single language server (`file`) or all servers (`*`); `reload *` reloads LSP configuration.
- `request` — raw LSP call: `query` specifies the method and `payload` provides JSON params (auto-constructed if omitted).
</operations>

<timeout>
Defaults: {{defaultTimeoutSec}}s for the full call; {{defaultWaitSec}}s waiting for project-wide diagnostics. `timeout` overrides both for the current call — increase it while a server is indexing or cold-starting, or decrease it to fail quickly. Maximum {{maxTimeoutSec}}s.
</timeout>

<critical>
- Symbol-level tasks (renames, references, definitions, code actions) MUST prefer `lsp` whenever a language server is active.
  It resolves shadowing, re-exports, and cross-file references that text search misses.
- NEVER perform cross-file renames via `ast_edit`, `sed`, or manual edits when `lsp` `rename`/`rename_file` works — text-based renames miss call sites silently.
- Use `code_actions` for import fixes, quick-fixes, and server-provided refactorings before editing manually.
</critical>
