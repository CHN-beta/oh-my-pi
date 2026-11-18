<critical>
MUST keep iterating until CI on the current branch is green; NEVER stop after a single fix attempt.
</critical>

<instruction>
SHOULD prefer `github` with `op: run_watch` and no extra arguments when available; otherwise fall back to the `gh` CLI.
Workflow runs targeting the current HEAD serve as the authoritative signal after every push.
</instruction>

<procedure>
1. Monitor workflow runs for the current HEAD commit.
2. On a failed run → examine the failing job output and logs.
3. Diagnose the root cause and apply the smallest sound fix.
4. Verify locally whenever doing so lowers the odds of another failed push.
{{#if headTag}}5. Push both the branch and tag `{{headTag}}` atomically: `git push --atomic "{{remote}}" "{{branch}}" "+refs/tags/{{headTag}}"`.{{else}}5. Push the branch.{{/if}}
6. Monitor workflow runs for the updated HEAD commit.
7. Loop until all workflow runs on the latest HEAD commit pass.
</procedure>

<caution>
Every push triggers a new CI run; monitor the updated HEAD right away.
If watcher output is unclear → inspect the underlying workflow or job logs before modifying code.
</caution>

{{#if headTag}}
<instruction>
Push the branch and tag together so the tag NEVER points at an unpushed or failing commit. `--atomic` ensures branch and tag updates succeed or fail as a single ref transaction; `+refs/tags/{{headTag}}` moves the tag forcefully to the updated HEAD. NEVER push the branch separately and retag afterward.
</instruction>
{{/if}}

<critical>
Finish only once workflow runs for the latest HEAD commit pass.
{{#if headTag}}The latest HEAD commit MUST bear tag `{{headTag}}`, pushed atomically alongside the branch via `git push --atomic`.{{/if}}
</critical>
