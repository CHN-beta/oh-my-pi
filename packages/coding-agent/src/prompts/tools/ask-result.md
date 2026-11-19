{{#if interrupted}}Ask interrupted by message. Answers the user gave before it:{{else}}{{#if timedOut}}Timed out before a response; submitted the form's existing values:{{else}}Submitted user responses:{{/if}}{{/if}}
{{json}}
{{#if notes}}
Selected option notes:
{{#each notes}}
- {{question}}: {{option}} [{{name}}={{jsonStringify value}}] — {{text}}
{{/each}}
{{/if}}
