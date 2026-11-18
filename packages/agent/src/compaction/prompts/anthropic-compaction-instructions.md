The conversation above constitutes the entire history to summarize. The API replaces all messages in this request with your summary; any omitted message is lost.

{{#if extraContext}}
{{extraContext}}
{{/if}}
{{basePrompt}}
{{#if customInstructions}}

Extra focus: {{customInstructions}}
{{/if}}

You MUST NOT invoke any tools while composing the summary; output only the summary text.
