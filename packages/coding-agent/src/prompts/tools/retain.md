Save ≥1 fact to long-term memory for future sessions.

Store durable, reusable knowledge—user preferences, project decisions, architectural choices, or anything that enhances future responses. Exclude transient task state.

{{#if globalScope}}`scope: global` saves the entry in the shared memory bank queried across all projects; reserve this for cross-project preferences and facts.
{{/if}}Every item MUST be concrete and self-contained (who, what, when, why). Group related facts into a single call; items are automatically deduplicated and merged.
