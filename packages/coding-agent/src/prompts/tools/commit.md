Create selective commits inside a shared worktree: include only lines authored by you and your subagents while the user and peer agents continue editing.

The `commit` namespace is exposed in JavaScript and Python Eval; it is not a standalone tool.

<instruction>
- Edit tools (edit, write, ast_edit, conflict resolution, isolated-subagent merges) record every write to a journal. The shell (`bash`, eval `sh()`) also records writes it performs through its builtins and redirections for text files up to 4 MiB that Git does not ignore. `commit.draft()` maps each changed line in the repository (HEAD → worktree) to its authoring agent and preselects in-scope lines. Changes made by external programs (formatters, generators, Git, package managers, or scripts) and manual edits are never preselected. Use `take` to include whole files under Unrecorded, individual lines marked `left out: unrecorded`, or relevant changes under Review.
- `agents` scope: omitted → you and your subagents; `"self"` → your edits alone; `"ParserFix"` or `["ParserFix", "DocsWriter"]` → the named subagents together with their subagents; `"*"` → all agents in the session.
- `repo` target: omitted → the repository at the session cwd; a relative path inside a different checkout → that repository, e.g. `commit.draft(repo="../other")`. Both the draft and resulting commit stay scoped to that repository.
- The summary reports Selected (`✓` entire file, `◐` partial file), Review (`?`), excluded peer agents in the session, and how many changed paths belong to others. Unrecorded (`·`) lists paths changed by external programs or by hand, with the first few shown by name.
- `show(path=None)` displays hunks. Every changed line shows its unit ID (`3b` = hunk 3, unit b; each unit groups one actor's lines in a hunk), status mark (`✓` selected, `?` needs review, `·` excluded), and author. Omitting `path` prints all partially selected and review files.
- `take(path=None, *units, grep=None)` and `drop(...)`: `path` matches an exact path, glob (`packages/tui/**`), or unique filename suffix (`CHANGELOG.md` if only one changed). Omitting units applies to the entire file. `grep` matches every unit containing a line that satisfies the regex across all files unless `path` restricts it. `take("**")` includes every repository modification, even non-agent edits (the user's own changes). `only(*globs)` drops selections outside those globs, letting you partition changes across multiple commits; when at least one target matches it reports unmatched paths or globs, and when none match it throws naming them and leaves the selection unchanged.
- Binary, non-UTF-8, and oversized files, symlinks, and mode-only (`chmod`) edits carry a single unit `1` and commit in full from the worktree. Mode changes on text files follow their selected lines. An existing initialized submodule with a changed HEAD appears under Review as a single gitlink unit `1`: inspect the old and new SHAs and select it explicitly with `take("path")`. Only the pointer is committed, never dirty files inside the submodule; redraft if its HEAD changes before committing. Submodule additions, deletions, type changes, uninitialized checkouts, and untracked nested repositories remain unsupported.
- `diff()` displays the exact candidate commit diff against HEAD. A long line edited in place prints once, as `!…kept [-removed-]{+added+} kept…`; the returned patch holds both lines whole.
- `commit(subject, body=None, *, fixes=None, amend=False, no_verify=False)`: single-line subject; `body` accepts a string or list of lines; `fixes=123` adds `Fixes #123`. Constructs the commit in a private index against current HEAD (or as the initial commit in an empty repo): staged entries from other agents remain staged, the working tree is untouched, and concurrent commits by others are never clobbered (if overlapping lines changed, the call fails and you must draft again). Refuses while a merge, cherry-pick, revert, rebase, or `git am` is in progress, or while the index has unresolved conflicts; finish or abort the operation first, or resolve the conflicts and use plain `git commit` for commits within an operation. Git hooks and commit signing execute just like `git commit`; `no_verify=True` bypasses `pre-commit` and `commit-msg` hooks (use only when requested by the user). Prints the new commit and remaining changes; the draft refreshes to hold what remains, newly preselected for subsequent commits. `amend=True` can only amend a commit created by this flow within the current session.
- Review reasons: "edits lines added by X that were never committed" means your edit builds on someone's uncommitted lines, so committing yours alone commits part of theirs; "in-scope lines rewritten afterwards by …" means the file no longer holds what you wrote: a formatter or script you ran did that (take the hunk), or someone else did; "the edit record cannot be replayed" means the file's history is lost (oversized or binary content, an older session), so `show(path)` and take your lines yourself. Decide from what you did; ask the user only when you cannot tell.
- All methods are async and print output by default; pass `silent=True` to suppress printing. `print(d)` reprints the summary.
- JavaScript uses matching names with an options object: `commit.draft({ agents: "self", repo: "../other" })`, `d.take("src/a.ts", { units: ["2a"] })`, `d.commit("fix: …", { body: ["- …"], fixes: 12, noVerify: true })`.
</instruction>

<examples>
```python
d = await commit.draft()
await d.show()  # only when the summary lists ◐ or ? items
await d.take("packages/catalog/src/compat/rules.json")  # regenerated by my `bun run gen:compat`
await d.take("src/editor.ts", "2")  # my lines, reflowed by the formatter I ran
await d.drop("src/editor.ts", "3")
await d.commit("fix(tui): kept the cursor on wrapped lines", ["- Clamped the column after wrapping."], fixes=812)
```

```python
d = await commit.draft("ParserFix")  # one subagent's work only
await d.commit("feat(parser): added the streaming parser")
```

```python
d = await commit.draft()  # several commits from one draft
await d.only("src/parser/**", "test/parser/**")
await d.commit("feat(parser): added the streaming parser", ["- Added `StreamParser`."])
await d.only("docs/**")  # d now holds what remains, preselected again
await d.commit("docs: documented the streaming parser")
```
</examples>

<critical>
NEVER create a commit in a shared worktree via `git add`, `git commit -a`, `git stash`, `git reset`, `git checkout -- <path>`, or `git restore`; always use `commit`.
</critical>
