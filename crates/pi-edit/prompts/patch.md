Applies diff hunks to modify files; the primary tool for editing existing files.

<instruction>
**Hunk Headers:**
- `@@` — plain header when surrounding context is already unique
- `@@ $ANCHOR` — verbatim anchor text copied from the file (an entire line or a unique substring)
**Choosing Anchors:**
1. Use bare `@@` whenever the context lines alone are unambiguous; otherwise pick a highly distinctive anchor copied verbatim from the file:
   - complete function signature
   - class definition
   - distinctive string literal or error message
   - uncommon configuration key
2. If "Found multiple matches" occurs: include additional context lines, split into separate hunks with distinct anchors, or extend the anchor substring
**Context Lines:**
Provide enough space-prefixed lines to make the target region unique (typically 2–8 lines)
Inside structured blocks (nested braces, XML/HTML tags, indented scopes), include both opening and closing boundaries so changes remain within the block
</instruction>

<parameters>
```ts
// Input is { path: string, edits: Entry[] }. `path` is required and applies to every entry.
type Entry =
   // Diff is one or more hunks for the top-level path.
   // - Each hunk begins with "@@" (anchor optional).
   // - Each hunk body only has lines starting with ' ' | '+' | '-'.
   // - Each hunk includes at least one change (+ or -).
   | { op: "update", diff: string }
   // Diff is full file content, no prefixes.
   | { op: "create", diff: string }
   // No diff for delete.
   | { op: "delete" }
   // New path for update+move from the top-level path.
   | { op: "update", rename: string, diff: string }
```
</parameters>

<output>
Reports success or failure; when failing, the error specifies:
- "Found multiple matches" — provided anchor or context matches more than one location
- "No match found" — context lines are absent from the file (incorrect text or outdated read)
- Invalid diff syntax
</output>

<critical>
- You MUST read a file before attempting to patch it
- You MUST copy anchors and context lines verbatim, preserving whitespace
- You NEVER treat anchors as comments (no line numbers, location notes, or dummy placeholders like `@@ @@`)
- You NEVER insert lines outside the intended enclosing block
- When an edit fails or corrupts structure, you MUST re-read the file and construct a fresh patch from current contents — NEVER resend the identical diff
- NEVER use edits to adjust indentation, spacing, or code formatting. Run formatting once at the end as a single command (`bun fmt`, `cargo fmt`, `prettier --write`, etc.) rather than making N separate edits. Leave temporary indentation inconsistencies as-is for the formatter to fix in one pass.
</critical>

<avoid>
- Overly generic anchors: `import`, `export`, `describe`, `function`, `const`
- Duplicating identical insertions across multiple hunks
- Replacing an entire file for small edits (fine for large restructures or very short files)
</avoid>
