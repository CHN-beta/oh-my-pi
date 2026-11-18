<system-notice id="skills">
Available skills updated during this session. When a skill matches → MUST read `skill://<name>` before starting. Only changes appear below; any skill omitted here remains unchanged.
{{#if added.length}}
Added:
{{#each added}}
- {{name}}: {{description}}
{{/each}}
{{/if}}
{{#if updated.length}}
Revised (this description supersedes the prior one):
{{#each updated}}
- {{name}}: {{description}}
{{/each}}
{{/if}}
{{#if removed.length}}
Removed:
{{#each removed}}
- `{{this}}`
{{/each}}
{{/if}}
</system-notice>
