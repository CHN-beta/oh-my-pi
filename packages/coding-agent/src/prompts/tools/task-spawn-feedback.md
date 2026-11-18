{{#if mixed}}
Launched {{count}} background agent{{#unless singular}}s{{/unless}}.{{scheduleFailureSummary}}
{{else}}
{{#if singleCall}}
Launched agent `{{agentId}}` (job `{{jobId}}`).
{{else}}
Launched {{count}} background agent{{#unless singular}}s{{/unless}} with {{agentLabel}}.{{scheduleFailureSummary}}
{{/if}}
{{/if}}
{{#if showListing}}{{#each started}}- `{{agentId}}` (job `{{jobId}}`)
{{/each}}{{/if}}
{{#if lifecycle}}
`read proc://` enumerates active jobs/services; `read proc://<id>` checks status/output without consuming delivery; `write proc://<id>/kill` with empty `content` cancels or stops them.
Job IDs exist only for this process; delivered results expire quickly (~30s) and unconsumed results within ~5min. Agent outputs and transcripts stay accessible via `agent://<id>` / `history://<id>`.{{#if ircEnabled}} `write agent://<id>` sends a message to a running agent.{{/if}}
{{/if}}
