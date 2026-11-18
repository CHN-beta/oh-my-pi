<system-reminder>
{{#if forced}}
Prior to substantive work, set up a phased todo list.

You MUST invoke `{{toolRefs.todo}}` as your opening action this turn. This forced initialization is the sole exception to `{{toolRefs.todo}}` never occupying its own turn; subsequent updates belong alongside real tool calls.
You MUST create the todo list via a single `init` operation.
You MUST span the full request from exploration through coding and verification—rather than only the immediate next step.
Task labels MUST be brief, concrete 5-10 word phrases.
The `init` op accepts only phase names and task-label strings; avoid inventing extra task metadata fields.

Once `{{toolRefs.todo}}` succeeds, proceed with the request in this same turn.
NEVER invoke `{{toolRefs.todo}}` again unless task progress has materially shifted.
{{else}}
Consider invoking `{{toolRefs.todo}}` upfront to outline a phased plan using a single `init` operation. An effective list spans the whole request—exploration through coding and verification—not merely the opening step, using concrete task labels that a later turn can act on without re-planning.
Keep each task label concise and concrete (5-10 words); the `init` op accepts only phase names and task-label strings, so avoid inventing extra metadata fields.
Once you create the list, proceed with the request in this same turn and avoid invoking `{{toolRefs.todo}}` again unless task progress has materially shifted.
{{/if}}
</system-reminder>
