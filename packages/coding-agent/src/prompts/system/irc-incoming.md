<irc>
Received IRC message from agent `{{from}}`{{#if replyTo}} (in reply to {{replyTo}}){{/if}}{{#if progress}} (status update; final answer follows later){{/if}}:

{{message}}

{{#if interrupting}}Delivered during a wait or active work; your active interruptible wait ended early so you can read it immediately.{{/if}}

{{#unless progress}}{{#if relayOnStop}}If a response is expected, answer with `write` (`path: "agent://{{from}}"`, `content: "…"`) if available; otherwise your final `yield` or closing message this turn routes to `{{from}}` upon stopping.{{else}}If a response is expected, answer with `write` (`path: "agent://{{from}}"`, `content: "…"`); you may complete your current step first. Nothing responds automatically on your behalf.{{/if}} Send an initial acknowledgment or interim status note to `agent://{{from}}?progress` so `{{from}}` continues waiting for the actual reply.{{/unless}}
</irc>
