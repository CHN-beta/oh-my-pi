<omfg>
The user is frustrated by a recurring agent pattern.
Write ONE Time Traveling Stream Rule (TTSR) that would have intercepted the problematic output earlier in this session.

How TTSR works:
- Each rule is a markdown file carrying YAML frontmatter; its markdown body is injected as corrective guidance whenever the rule fires.
- `scope` is a comma-separated allowlist selecting which outputs to inspect:
  - `text` = assistant text. `thinking` = reasoning summaries. `tool` = all tool calls.
  - `tool:<name>(<glob>)` = a specific tool, restricted to matching file paths, e.g. `tool:write(*.rb)`, `tool:edit(*.ts)`.
- edit/write calls are inspected as the source content they write; other tool calls are inspected as JSON-serialized arguments.
- Trigger types (three kinds):
  - `condition`: JavaScript regex patterns evaluated mid-stream; a match aborts the stream immediately.
  - `astCondition`: ast-grep patterns (`$X` = single node, `$$$ARGS` = variadic nodes) evaluated against edit/write content; language is inferred from the file extension, so `scope` MUST be `tool:edit(<glob>)` or `tool:write(<glob>)` with an extension.
  - `question`: a natural-language binary question answered by a small classifier once output finishes. Does not interrupt mid-stream: the bad output has already occurred and the guidance arrives afterward as a warning. Incurs a classifier call for every in-scope output.

Choosing a trigger:
- MUST favor `condition` or `astCondition`—they are deterministic, zero-cost, and halt before harm occurs.
- Structural code patterns (call forms, nesting, argument shapes) → `astCondition`. Exact tokens or wording → `condition`.
- Reach for `question` SOLELY when no pattern can detect the issue without false positives: semantic claims, tone, reasoning quality, or intent (e.g. "claims tests pass without running them").
- `question` MUST be decidable solely from the inspected output, where "yes" MUST indicate a rule violation.
- Alongside `question`, SHOULD specify a `condition` prefilter whenever the problematic output reliably includes a literal marker so the classifier runs only when that marker appears.

Output requirements:
- Return strictly a single JSON object and nothing else.
- Required JSON keys: `name`, `description`, `scope`, `body`, plus at least one of `condition`, `astCondition`, `question`.
- `name` MUST use kebab-case.
- `description` MUST fit on one summary line.
- `condition` / `astCondition`: string or array of strings. `question`: single string.
- Triggers MUST match the concrete problematic assistant output shown earlier in this session.
- Escape regex backslashes for JSON once only: write `"\\beval\\s*\\("`, NEVER `"\\\\beval\\\\s*\\\\("`.
- Keep triggers narrow; NEVER write overly broad catch-all patterns.
- `scope` MUST be a string or array of strings, kept as tight as the complaint permits. NEVER specify `tool, text` unless the identical mistake appeared in both tool calls and prose.
- File-type-specific complaints SHOULD use matching tool scopes: Ruby written via `write` → `tool:write(*.rb)`, not bare `tool` or `text`.
- `body` MUST concisely state the corrective guidance in markdown.
- The caller generates YAML frontmatter; NEVER include markdown frontmatter or code fences around the JSON.
Example shapes:
{
  "name": "ts-no-any",
  "description": "Never use `any` in TypeScript — use `unknown`, a generic, or the real type",
  "condition": ": any|as any",
  "scope": ["tool:edit(*.ts)", "tool:edit(*.tsx)", "tool:write(*.ts)", "tool:write(*.tsx)"],
  "body": "Never use `: any` or `as any`. Use `unknown`, a domain type, a generic, or a type guard."
}
{
  "name": "go-range-int",
  "description": "Use `for i := range n` instead of C-style counting loops",
  "astCondition": "for $I := 0; $I < $N; $I++ { $$$BODY }",
  "scope": ["tool:edit(*.go)", "tool:write(*.go)"],
  "body": "Write `for i := range n { … }` (Go 1.22+) instead of `for i := 0; i < n; i++`."
}
{
  "name": "no-unverified-test-claims",
  "description": "Never claim tests pass without having run them",
  "condition": "(?i)tests? (pass|are passing|succeed)",
  "question": "Does the reply claim tests pass without showing they were actually run in this conversation?",
  "scope": "text",
  "body": "Only report test results you observed. Run the tests, or say they were not run."
}

Complaint:
{{complaint}}

{{#if feedback}}
Prior failed attempts or user-requested revisions:
{{feedback}}

Most recent candidate JSON:
{{previousRule}}

Produce one revised rule addressing the validation errors or user revisions listed above. NEVER reuse rejected scopes or triggers.
{{/if}}
</omfg>
