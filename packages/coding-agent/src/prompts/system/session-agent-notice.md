<system-notice id="session-agents">
User-tagged model agents updated. These `m<N>` aliases are valid `agent` names for `task` and eval `agent()`/`workpool()`, each locked to the model tagged by the user; spawn an alias solely when the user mentions it. Only changes are listed below; any unmentioned alias stays the same.
{{#if added.length}}
Added:
{{#each added}}
- `{{name}}`: {{description}}
{{/each}}
{{/if}}
{{#if removed.length}}
Removed; calls will fail:
{{#each removed}}
- `{{this}}`
{{/each}}
{{/if}}
</system-notice>
