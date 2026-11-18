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

Leave `type` omitted for a standard single terminal structured result.
Supply `type: ["section"]` to record an incremental, non-terminal section that accumulates.
{{/if}}
{{#unless workPoolItems}}
{{#if hasOutputSchema}}
This task specifies an output schema: the final `data` MUST be a complete object conforming to it.
Calling `type: "result"` without `data` finalizes previously submitted incremental sections.
That is invalid if no sections were submitted—plain prose in your final turn never satisfies the schema.
{{else}}
Supply `type: "result"` to finalize; omitting `data` uses your final assistant turn as the raw final result.
{{/if}}
{{/unless}}
