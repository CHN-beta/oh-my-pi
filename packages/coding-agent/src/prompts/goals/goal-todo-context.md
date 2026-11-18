<todo_context>
Persisted todos track active progress for the ongoing goal rather than stale transcript history; because goal continuations carry no visible user prompt, treat this as live state.
Prior to major work: cross-check your next step against the todos. If an entry is outdated, already done, or no longer the active focus, invoke `todo` first to complete it or revise the list. Avoid leaving an item marked in_progress once you have moved to subsequent phases.

Overall: {{closed}}/{{total}} done, {{open}} open.
{{#each phases}}
- {{name}}
{{#each tasks}}
  - [{{status}}] {{content}}
{{/each}}
{{/each}}
</todo_context>
