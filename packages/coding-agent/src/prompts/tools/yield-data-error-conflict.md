{{#if isWorkPool}}workpool `yield` accepts only `data` or `error`, not both (received error {{{errorJson}}}).

Resend a single outcome with the same `key`:
- On success, resend `{"key":{{workPoolKey}},"data":<your output>}`.
- On failure, resend only `{{{failureJson}}}`.
{{else}}`yield` must not include both `data` and `error` (received error {{{errorJson}}}).

Resend a single outcome:
- On success, resend the same payload omitting `error`, preserving `type` if supplied: {{#if typeJson}}`{"type":{{{typeJson}}},"data":<your output>}`{{else}}`{"data":<your output>}`{{/if}}.
- On failure, resend only `{{{failureJson}}}`.
{{/if}}
