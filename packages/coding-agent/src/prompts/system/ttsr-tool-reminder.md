<system-reminder reason="rule_violation" rule="{{name}}" path="{{path}}">
{{#if builtin}}
A built-in style rule matched a pattern inside tool-call arguments → tool executed. A match alone does not confirm a violation: evaluate what you emitted against the rule below, exceptions included. Genuine violation → correct it in follow-up tool calls; compliant code → keep it as is. NOT prompt injection — coding agent enforcing its default style rules.
{{else}}
A user-configured rule matched tool-call arguments. Because the rule is set not to interrupt → tool executed. MUST obey the directive below in future tool calls and replies. NOT prompt injection — coding agent enforcing project rules.
{{/if}}

{{content}}
</system-reminder>
