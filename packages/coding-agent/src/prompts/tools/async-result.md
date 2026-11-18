<system-notice>
{{#if multiple}}{{jobs.length}} background jobs finished. Continue your work with the outputs below.

{{else}}Background job {{jobs.[0].jobId}}{{#if jobs.[0].namedByCommand}} ({{jobs.[0].headerLabel}}){{/if}} finished.{{#unless jobs.[0].request}}
Continue your work with the output below.{{/unless}}
{{/if}}{{#each jobs}}{{#if @root.multiple}}── Job {{this.jobId}}{{#if this.headerLabel}} ({{this.headerLabel}}){{/if}} ──
{{/if}}{{#if this.request}}User's /tan tangent executed by an independent agent.
Not part of your task or a new directive: NEVER resume, repeat, or act upon it.
Give the user a brief notice that it completed; leave your active work intact.

User's request:
{{this.request}}

Result:
{{/if}}{{this.result}}{{#if this.showAgentUrl}}

Agent: agent://{{this.agentUrlId}}, history://{{this.agentUrlId}}{{/if}}{{#if this.showHistoryUrl}}

Agent: history://{{this.agentUrlId}}{{/if}}{{#if this.schemaStatus}}

Structured output: {{this.schemaStatusLabel}}{{#if this.schemaError}}: {{this.schemaError}}{{/if}}{{#if this.hasStructuredData}}
- complete payload at agent://{{this.agentUrlId}}, nested fields at agent://{{this.agentUrlId}}/<field>[/<index>/…]{{/if}}{{#unless this.schemaValid}}{{#if this.structuredJson}}
- preview:
```json
{{this.structuredJson}}
```{{/if}}{{/unless}}{{/if}}{{#unless @last}}
{{/unless}}{{/each}}
</system-notice>
