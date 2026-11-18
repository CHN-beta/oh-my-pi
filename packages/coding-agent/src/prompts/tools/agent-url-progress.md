# {{id}} ({{status}})

Final output is not yet available: `agent://{{id}}` reports live progress until this run publishes its output. Condensed transcript: `history://{{id}}`.
{{#each sections}}

## Yield{{#if labels}} [{{labels}}]{{/if}}

```json
{{data}}
```
{{/each}}
{{#if lastText}}

## Most recent assistant text

{{lastText}}
{{/if}}
{{#if empty}}

No output yet.
{{/if}}
