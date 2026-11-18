Wrapper around `gh` operations: repositories/files, PRs, search, checkout, push, and Actions monitoring. View issues/PRs via `issue://<N>`/`pr://<N>`. Inspect PR diffs via `pr://<N>/diff` (changed files), `pr://<N>/diff/<i>` (1-based file slice), or `pr://<N>/diff/all` (complete diff). Append `?at=<generation>` to lock a cached snapshot.

<instruction>
Choose operation via `op`.
- `repo`: `[host/]owner/repo`; include the hostname when targeting a repository on another GitHub instance.
- `repo_view`: omit `repo` to inspect the current checkout.
- `file_read`: fetch `path` from `repo`; omitting `repo` targets the current checkout, omitting `branch` uses the default branch.
- `pr_create`: `head` defaults to the current branch.
- `pr_checkout`: checks out PR(s) into isolated git worktrees rather than the main working tree; pass an array in `pr` to batch multiple PRs.
- `pr_push`: requires a preceding `op: pr_checkout`.
- `search_issues`/`search_prs`/`search_commits`/`search_repos`: `query` is optional when `since`/`until` are supplied; omit for date-only filtering. `search_code`: `query` is required and rejects `since`/`until`.
- `search_*`: `repo` defaults to the current checkout's `owner/repo`; target other repos using `repo:`/`org:`/`user:` in `query`. `search_repos` ignores `repo`—scope with `org:`/`language:` inside `query`.
- Boolean `AND`/`OR`/`NOT` join search text terms rather than qualifiers; never insert them between qualifiers.
- `since`/`until`: relative `<n>` + `m`/`h`/`d`/`w`/`mo`/`y` (e.g. `3d`, `2w`), ISO date `YYYY-MM-DD`, or ISO datetime. `dateField: "updated"` filters by update time (issues/PRs) or push time (repos), never creation time.
- `run_watch`: omitting `run` monitors all runs for the current HEAD; `branch` defaults to current branch. Aborts immediately on the first failed job.
</instruction>

<output>
Brief summary per operation. Failed `run_watch` runs store full logs in a session artifact.
</output>

<critical>
Files in GitHub-hosted repositories: MUST use `file_read`; NEVER use `curl`/`wget`.
</critical>
