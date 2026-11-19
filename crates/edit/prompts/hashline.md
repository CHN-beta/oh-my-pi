Hashline modifies existing files; use `write` to create new files. Prefix each file block with `[PATH#TAG]`, where `TAG` is the mandatory 4-hex snapshot tag from your most recent `read` or `search`. Line numbers always refer to original `LINE:TEXT` coordinates, never shifted by earlier hunks.

<ops>
`PUT N.=M:` replaces lines N through M (inclusive) with the `+` body (`N.=N` for a single line); `PUT N*:` replaces block N.
`PUT <N:` / `PUT >N:` insert immediately before or after line N (`<1` at file start, `>$` at file end). `PUT >N*:` inserts after block N at sibling depth; to insert inside the block, use `PUT >M:` on its closing line.
`CUT N.=M` / `CUT N*` remove lines or a block and capture them, optionally as `@name`.
`PUT <N @name` / `PUT >N @name` paste register contents at a gap (omit name for an anonymous `CUT`); `PUT N.=M @name` / `PUT N* @name` overwrite a range or block from a register (name REQUIRED). Register pastes take NO body; named registers persist across tool calls.
`REM` deletes the file; `MV DEST` renames it after any preceding edits (quote paths with spaces).
</ops>

<rules>
- Only `:` operations take a body: each body line is `+TEXT` verbatim including indentation; a lone `+` produces a blank line. Literal `- item` / `+ item` lines become `+- item` / `++ item`. NEVER include `-` lines or bare context. Replacement body length is independent of the target range; remove lines with `CUT`, not an empty `PUT`.
- Modify only displayed lines that actually change; lines behind `…`, `..`, collapsed `N-M:`, or outside the viewed window are UNSEEN—re-read first. Keep ranges tight: split non-adjacent edits; NEVER include unchanged lines or start/end mid-expression or mid-block. Use gap `PUT` for pure insertions.
- `*` requires a multi-line opener, NEVER a closer, final line, or inner statement; use a line range or gap for a single statement. Anchor on the first decorator, attribute, or doc-comment to include it; standalone comments require an explicit range.
- Markdown heading blocks extend across deeper subheadings until the next heading of the same or higher level; after a section `PUT >N*:`, end the inserted body with a trailing blank line.
- NEVER restyle unrelated code. Tag and line numbers change after EVERY edit: rely on the edit response or a fresh `read`; on a stale tag or unexpected result, STOP and re-read.
</rules>

<example>
```
[greet.py#A1B2]
PUT 1*:
+@cache
+def greet(name):
+    print(name)
[PLAN.md#3C4D]
PUT >2:
+- task
```
Moving across files: `CUT 1* @fn` in the source file, then `PUT <1 @fn` in the target section.
</example>
