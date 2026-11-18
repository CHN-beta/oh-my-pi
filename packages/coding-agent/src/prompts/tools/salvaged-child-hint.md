The child terminated prior to this failure: {{#if aborted}}aborted{{#if abortReason}} ({{abortReason}}){{/if}}{{else}}exit {{exitCode}}{{#if error}} ({{error}}){{/if}}{{/if}}.
{{#if outputPath}}
Its output was saved at `agent://{{id}}` ({{outputPath}}); inspect it before retrying this task.
{{else}}
No output artifact was written.
{{/if}}
