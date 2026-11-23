AST-based structural rewrites powered by ast-grep. Choose this for codemods where plain text replacement is error-prone. Mixed-language paths are supported: each file is parsed with its own language grammar, and a pattern modifies only files where it parses cleanly.

- Metavariables in `pat` (`$A`, `$$$ARGS`) substitute into `out`.
- **Patterns match AST structure, not text.** `$NAME` = one node; `$_` = unbound; `$$$NAME` = zero-or-more.
  - Use `$$$NAME`, NOT `$$NAME` (invalid). Names UPPERCASE, whole node — partial like `prefix$VAR` fails.
- Same metavariable twice → MUST match identical code (`$A == $A` matches `x == x`, not `x == y`).
- Rewrite patterns MUST parse as single AST node. Non-standalone → wrap: `class $_ { … }`.
- TS: tolerate annotations — `async function $NAME($$$ARGS): $_ { $$$BODY }`. Delete with empty `out`: `{"pat":"console.log($$$)","out":""}`.
- 1:1 substitution — no splitting/merging captures.
- Matches are STAGED as a proposal, not applied: finalize with `resolve <one-sentence reason>` (apply) or `reject <reason>` (discard).
- Parse issues → malformed rewrite, not clean no-op. For one-off text edits, prefer the Edit tool.
