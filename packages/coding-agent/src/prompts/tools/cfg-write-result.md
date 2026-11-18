{{#if declined}}
User rejected updating `{{path}}`; it remains {{previous}}. NEVER retry unless requested by the user.
{{/if}}
{{#if unchanged}}
`{{path}}` is already set to {{value}}; no change made.
{{/if}}
{{#if saved}}
Persisted `{{path}}` = {{value}} to global configuration (previously {{previous}}).
{{#if effective}}
The active value remains {{effective}} because {{provenance}} overrides global configuration, so the persisted setting is not in effect. Inform the user.
{{/if}}
{{/if}}
{{#if applied}}
Updated `{{path}}` = {{value}} for the current session only (previously {{previous}}); NOT persisted.
{{#if effective}}
The active value remains {{effective}} because {{provenance}} overrides session and global configuration, so neither this change nor persisting it will apply. Inform the user; NEVER retry.
{{else}}
Ask the user if this value works as expected. If yes → `write {{saveUrl}}` with the same payload to persist it. If no → revert by writing {{previous}} to `{{url}}`.
{{/if}}
{{/if}}
