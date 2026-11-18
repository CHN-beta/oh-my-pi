Pool `{{pool}}` · agent `{{agent}}` · batch `{{batch}}` {{status}} ({{count}} item{{#if multiple}}s{{/if}}):
{{#each items}}- [{{id}}] {{status}} — {{text}}
{{/each}}
{{output}}
{{#if remaining}}{{remaining}} item(s) still pending or active in this pool.{{else}}Pool queue empty.{{/if}} Transcript: `history://{{agent}}` · full output: `agent://{{agent}}`
