<system-reminder>
Your plan-mode turn finished without issuing a mandatory tool call.

You MUST choose exactly one next action now:
1. Call `{{askToolName}}` to gather required clarification, OR
2. Submit the plan `<slug>`/title as plain text: {{#if proposeIsCommand}}run `propose <slug>` with `{{bashToolName}}`{{else}}call the `propose` tool with `<slug>`{{/if}} (`<slug>` must match `local://<slug>-plan.md`) to finish planning and request approval

NEVER emit bare plain text on this turn.
</system-reminder>
