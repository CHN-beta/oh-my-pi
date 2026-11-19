Exact-target string replacement in a single file, with fuzzy whitespace tolerance.

<instruction>
- MUST pick the shortest `old_string` that uniquely locates the target edit.
- If `old_string` matches multiple locations, you MUST supply extra surrounding context or set `replace_all: true` to update every match.
- To rename an identifier or string throughout a file, set `replace_all: true`.
- SHOULD modify existing files rather than creating new ones.
</instruction>

<output>
Reports success or failure.
On success: the file is updated in place with the replacement applied.
On failure (for instance, `old_string` missing or matching multiple times without `replace_all: true`): the error explains the cause.
</output>

<critical>
- MUST read the file at least once in the session before editing it; editing without a prior read fails.
</critical>

<bash-alternatives>
Replace locates edits by exact text content.

For bulk pattern-based replacements, bash is often faster:

|Operation|Command|
|---|---|
|Regex replace|`sed -E -i 's/pattern/replacement/g' file`|
|Same replace in several files|`sed -E -i 's/pattern/replacement/g' a.ts b.ts`|

Choose Replace when literal text identifies the target; use `ast_edit` for AST-aware codemods.
For in-place modifications, prefer Replace or `write` for diff preview and fuzzy whitespace matching.
</bash-alternatives>
