AST-based structural rewrites powered by ast-grep. Choose this for codemods where plain text replacement is error-prone. Mixed-language paths are supported: each file is parsed with its own language grammar, and a pattern modifies only files where it parses cleanly.

- Metavariables captured in `pat` (`$A`, `$$$ARGS`) are interpolated into `out`.
- **Patterns match syntax trees rather than raw text.** `$NAME` matches one node; `$_` matches one node anonymously; `$$$NAME` matches zero or more nodes.
  - Write `$$$NAME`, NOT `$$NAME` (invalid syntax). Identifiers must be UPPERCASE and cover whole nodes — partial tokens like `prefix$VAR` fail.
- Repeating a metavariable → MUST bind identical code (`$A == $A` matches `x == x`, never `x == y`).
- Replacement patterns MUST parse as a single valid AST node. Wrap non-standalone fragments: `class $_ { … }`.
- TypeScript: account for type annotations — `async function $NAME($$$ARGS): $_ { $$$BODY }`. Remove matched code with an empty `out`: `{"pat":"console.log($$$)","out":""}`.
- Strictly 1:1 replacement — captures cannot be split or combined.
- Matched rewrites are STAGED as a proposal rather than written directly: confirm or discard by writing a one-sentence rationale to `xdev://resolve` (apply) or `xdev://reject` (discard).
- Parse errors indicate an invalid rewrite rather than a clean no-op. For simple single-site edits, use the Edit tool instead.
