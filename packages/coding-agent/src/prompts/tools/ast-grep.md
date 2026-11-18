AST-based structural code search via ast-grep. Choose this when syntax structure matters more than raw text (function calls, declarations, language constructs).

<instruction>
- Restrict each invocation to a single language. `pat` holds ONE AST pattern; issue separate calls for unrelated patterns.
- Specify `lang` whenever file extensions are ambiguous (e.g., `cpp` for `.h`); `.cu` and `.cuh` are inferred as C++.
- `$NAME` binds a single node; `$_` matches one node without capturing; `$$$NAME` captures zero or more nodes; `$$$` matches zero or more anonymously.
  - Write `$$$NAME`, NOT `$$NAME` (invalid syntax). Names must be UPPERCASE and match complete nodes — partial forms like `prefix$VAR` fail.
- Repeating a metavariable → MUST match identical AST subtrees (`$A == $A` matches `x == x`, never `x == y`).
- Patterns MUST parse as a single AST node. Wrap non-standalone fragments: `class $_ { … }`.
- C++ expression statements require a trailing `;`: `ns::doThing($ARG);`, `$CALLEE($ARG);`.
- TypeScript: account for type annotations — `async function $NAME($$$ARGS): $_ { $$$BODY }`.
- Distinct declaration syntaxes do not cross-match — `function foo`, method `foo()`, and `const foo = () => {}` differ; check each relevant form before concluding none exist.
- Broadest presence probe: `pat: "executeBash"` scoped to a narrow `path`.
</instruction>

<critical>
- AVOID scanning the repository root — scope `path` first.
- Parse failures indicate a broken query, not missing code: correct the pattern or narrow `path` before reporting "no matches".
{{#if eagerDelegation}}- For wide cross-subsystem searches → dispatch a {{#if scoutAvailable}}Task tool + scout{{else}}Task tool{{/if}} subagent first.{{/if}}
</critical>
