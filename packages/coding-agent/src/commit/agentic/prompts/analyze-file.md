Inspect {{file}}.

Goal:
{{#if goal}}
{{goal}}
{{else}}
Summarize its role and changes relevant to the commit.
{{/if}}

Output a concise JSON object:
- summary: 1-sentence description of the file's role
- highlights: 2-5 bullet points covering key behaviors or modifications
- risks: edge cases or hazards worth flagging; [] if none

{{#if related_files}}
## Other Files in This Change
{{related_files}}

Connect this file's changes to those files.
{{/if}}

Invoke the yield tool with the JSON payload.
