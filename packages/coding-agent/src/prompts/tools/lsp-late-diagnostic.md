<system-notice>
{{#if multiple}}Delayed LSP diagnostics arrived for {{files.length}} files after their edits completed:
{{else}}Delayed LSP diagnostics arrived after the edit completed:
{{/if}}
{{#each files}}{{this.path}} — {{this.summary}}
{{#each this.messages}}{{this}}
{{/each}}{{#unless @last}}
{{/unless}}{{/each}}</system-notice>
