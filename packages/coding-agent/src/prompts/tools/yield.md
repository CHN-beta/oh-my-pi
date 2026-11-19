{{#if workPoolItems}}
Report ONE workpool item per call using `{ key, data }` or `{ key, error }`:
- `key`: the item's 1-based index.
- `data`: the self-contained result/evidence payload.
- `error`: a description of the failure.

The tool response indicates which keys remain. Submitting the last key ends the turn automatically.
NEVER send multiple items in one call.
{{else}}
Return subagent output as `{ data: <your output> }` on success, or `{ error: "message" }` on failure.
Never supply both, and never pass a bare payload outside `data`.

Omit `type` for the usual single terminal structured result.
Supply `type: ["<field>"]` with `data` to record an incremental, non-terminal section that accumulates.
A data-less `type: "result"` finalizes previously submitted sections; it is invalid when none were submitted.
{{/if}}
{{#unless workPoolItems}}
{{#if hasOutputSchema}}
This task specifies an output schema: the terminal `data` MUST be a complete object conforming to it.
{{/if}}
{{/unless}}
