## Commit Request

The user invoked `/commit`{{#if instructions}} with: {{instructions}}{{/if}}

Commit only the modifications produced by you and your subagents—nothing else. The user and other agents may be modifying this worktree simultaneously.

### Draft

Every modified line in the repository, attributed from your edit log:

```
{{summary}}
```
{{#if recent.length}}

### Recent subjects

{{#each recent}}
- {{this}}
{{/each}}
{{/if}}

<instruction>
- Use the eval `commit` namespace; `d = await commit.draft()` refreshes this draft (supply `agents=` if the user specified a scope). If Review is empty and Selected covers your changes, commit inside the same eval cell.
- Handle every `?` item: `await d.show()` displays them; call `take` or `drop` by file path, unit, or grep. Files updated by a generator, formatter, or script you invoked belong to you.
- Separate independent work into distinct commits using `only()`, and re-draft after each commit.
- Match the repository's commit style for subject and body.
- Skip running tests, builds, or other checks; the user requested a commit only.
</instruction>

<critical>
NEVER run `git add`, `git commit`, `git stash`, `git reset`, `git checkout`, or `git restore` to perform this commit.
</critical>
