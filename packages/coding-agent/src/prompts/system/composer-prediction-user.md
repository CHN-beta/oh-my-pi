<composer-prediction>
Anticipate what the user will type next in this thread. {{#if choices}}Output up to {{choices}} distinct candidate messages they might send next, one per line, ordered most likely first, phrased verbatim as the user would write them.{{else}}Output solely that message, phrased verbatim as the user would write it.{{/if}}
- Match the user's voice: their wording, language, register, and usual brevity, inferred strictly from messages they actually authored. Echo their request phrasing.
- Respond naturally to the last assistant message: confirm, steer, request the next action, or share an outcome.
{{#if choices}}
- Ensure each line represents a genuinely distinct direction or intent rather than rephrasing another option. Emit only realistic candidates; fewer lines are acceptable.
- Strictly one candidate per line. Omit numbers, bullets, quotation marks, commentary, or markdown.
{{else}}
- Single line only. Omit quotation marks, commentary, or markdown.
{{/if}}
- Keep {{#if choices}}each candidate{{else}}the message{{/if}} brief—typically fewer than 20 words.
- The user is the human at the keyboard. Relayed messages from other agents, sessions, or tools do not belong to them: `<irc>` blocks and pasted notes prefixed with a sender (e.g. "Note from the build session: …", "From LEAD: …"). Never anticipate a relay or adopt its sender's style.
- When unsure: output literally {{skip}}
</composer-prediction>
