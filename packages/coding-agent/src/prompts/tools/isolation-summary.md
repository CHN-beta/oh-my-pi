{{#when kind "==" "captured"}}
{{#if branchName}}
Isolation: modifications saved to branch `{{branchName}}` (apply=false); not merged.
{{else}}
{{#if rootPatchPath}}
Isolation: modifications saved to `{{rootPatchPath}}` (apply=false); not applied.
{{else}}
{{#if nestedCount}}
Isolation: modifications saved across {{pluralize nestedCount "nested repository" "nested repositories"}} (apply=false); not applied.
{{else}}
Isolation: no modifications captured.
{{/if}}
{{/if}}
{{/if}}
{{#list nestedPatchPaths prefix="- nested repository patch: `" suffix="`"}}{{this}}{{/list}}
{{/when}}
{{#when kind "==" "capture-error"}}
<system-notification>Isolation: {{error}}</system-notification>
{{#if branchName}}
Saved captured branch as {{branchName}}.
{{/if}}
{{#if rootPatchPath}}
- patch: `{{rootPatchPath}}`
{{/if}}
{{#list nestedPatchPaths prefix="- nested repository patch: `" suffix="`"}}{{this}}{{/list}}
{{/when}}
{{#when kind "==" "nested-apply-failed"}}
<system-notification>Failed to apply some nested repository patches: {{error}}{{#if nestedPatchPaths}}
Saved nested patches at:
{{#list nestedPatchPaths prefix="- "}}{{this}}{{/list}}{{/if}}</system-notification>
{{/when}}
{{#when kind "==" "not-applied"}}
<system-notification>Patches were left unapplied and require manual handling.</system-notification>

{{#if rootPatchPath}}
Patch artifact:
- {{rootPatchPath}}
{{/if}}
{{#if nestedPatchPaths}}
Nested repository patches (not applied):
{{#list nestedPatchPaths prefix="- "}}{{this}}{{/list}}
{{/if}}
{{/when}}
{{#when kind "==" "branch-merge-failed"}}
<system-notification>Failed to merge branch: {{branchName}}.
{{#if conflict}}
Conflict: {{conflict}}
{{/if}}
The unmerged branch is kept for manual resolution.</system-notification>
{{#if nestedPatchPaths}}
Nested repository patches (not applied):
{{#list nestedPatchPaths prefix="- "}}{{this}}{{/list}}
{{/if}}
{{/when}}
{{#when kind "==" "branch-capture-failed"}}
<system-notification>Branch merge failed while capturing the task branch: {{error}}
Task results are preserved, though workspace changes were not applied.</system-notification>
{{#if rootPatchPath}}
Patch artifact:
- {{rootPatchPath}}
{{/if}}
{{#if nestedPatchPaths}}
Nested repository patches (not applied):
{{#list nestedPatchPaths prefix="- "}}{{this}}{{/list}}
{{/if}}
{{/when}}
{{#when kind "==" "merge-error"}}
<system-notification>Merge step failed: {{error}}
Task results are preserved, though workspace changes were not applied.</system-notification>
{{#if branchName}}
Kept unmerged branch {{branchName}} for manual resolution.
{{/if}}
{{#if rootPatchPath}}
Patch artifact:
- {{rootPatchPath}}
{{/if}}
{{#if nestedPatchPaths}}
Nested repository patches (not applied):
{{#list nestedPatchPaths prefix="- "}}{{this}}{{/list}}
{{/if}}
{{/when}}
