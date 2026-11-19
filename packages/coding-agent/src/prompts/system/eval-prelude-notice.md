<system-notice id="prelude-extension">
Available `eval` prelude globals updated. Only changes are shown below; any prelude not mentioned remains unchanged.
{{#if added.length}}
Added to JS/Python `eval`{{#if canRead}}; `read` the linked documentation prior to first use{{#if anyFirstCall}} unless marked{{/if}}{{/if}}:
{{#each added}}
- `{{name}}`{{#if summary}}: {{summary}}{{/if}}{{#if firstCall}} (no `read` needed first: the guide follows its first call's result){{/if}}{{#if ../canRead}} → `xdev://eval/{{name}}`{{/if}}
{{/each}}
{{/if}}
{{#if removed.length}}
Removed from scope; invocations will error:
{{#each removed}}
- `{{this}}`
{{/each}}
{{/if}}
{{#each sections}}

{{this}}
{{/each}}
</system-notice>
