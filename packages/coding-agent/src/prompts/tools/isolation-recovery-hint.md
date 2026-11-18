{{#if patchPath}}
Saved captured patch to {{patchPath}}.
{{/if}}
{{#list nestedPatchPaths prefix="Saved captured nested patch to " join=""}}
{{this}}.
{{/list}}
{{#if nestedFailure}}
Failed to write nested patches: {{nestedFailure}}.
{{/if}}
{{#if branchName}}
Saved captured branch as {{branchName}}.
{{/if}}
