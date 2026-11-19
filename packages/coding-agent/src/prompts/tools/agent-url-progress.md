# {{id}} ({{status}})

{{#if publishedEmpty}}
Published output is empty. Condensed transcript: `history://{{id}}`.
{{else}}
Final output is not yet available: `agent://{{id}}` reports live progress until this run publishes its output. Condensed transcript: `history://{{id}}`.
{{/if}}
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
