Regex engine: Rust regex, falling back to PCRE2. `path`: `;`-separated files, directories, globs, or internal URLs (defaults to `.`). Case-sensitive and `.gitignore`-aware by default; `skip` paginates matched files.
Single-file line range selector: `src/foo.ts:50-100`. Literal `\n` or `\\n` permits multiline matching.
Unqualified globs like `*.ts` match at any depth; `dir/*.ts` matches direct children of `dir` only (`dir/**/*.ts` recurses). A `!glob` entry excludes matching files and directories under searched paths (`src;!**/*.test.ts`).
{{#if hasFind}}Unknown symbols or behavior queries → `find`; exact strings or regexes → `grep`.{{/if}}
{{#if eagerDelegation}}Multi-step searches MUST use {{#if scoutAvailable}}Task + scout{{else}}Task{{/if}} rather than chained calls.{{/if}}
