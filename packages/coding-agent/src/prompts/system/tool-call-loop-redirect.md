<system-interrupt reason="tool_call_loop_detected">
You invoked `{{tool_name}}` {{count}} times in a row with the exact same arguments:
`{{arguments_summary}}`

Previous output (truncated): `{{result_summary}}`

NEVER invoke `{{tool_name}}` with identical arguments again during this turn. Vary your arguments, pick a different tool, or report your findings and yield if done.
</system-interrupt>
