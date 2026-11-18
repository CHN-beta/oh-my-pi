{{#when kind "==" "merge-failed"}}
Merge unsuccessful: {{message}}{{#if captureError}}; patch capture also failed: {{captureError}}{{/if}}.
{{#if rescueBranch}}
The agent's commits remain saved on branch {{rescueBranch}} — merge or cherry-pick manually.
{{/if}}
{{#if retainedDir}}
Kept isolation workspace at {{retainedDir}} — retrieve changes from there; `omp worktree clear` cleans it up after this session exits.
{{#if sidecarMissing}}
Mount metadata is absent, so manually unmount {{retainedDir}} before cleaning up.
{{/if}}
{{/if}}
{{/when}}
{{#when kind "==" "patch-capture-failed"}}
Unable to capture patch: {{message}}.
Kept isolation workspace at {{retainedDir}} — retrieve changes from there; `omp worktree clear` cleans it up after this session exits.
{{#if sidecarMissing}}
Mount metadata is absent, so manually unmount {{retainedDir}} before cleaning up.
{{/if}}
{{/when}}
{{#when kind "==" "nested-capture-failed"}}
Unable to capture nested patch: {{message}}.
Kept isolation workspace at {{retainedDir}} — retrieve changes from there; `omp worktree clear` cleans it up after this session exits.
{{#if sidecarMissing}}
Mount metadata is absent, so manually unmount {{retainedDir}} before cleaning up.
{{/if}}
{{/when}}
